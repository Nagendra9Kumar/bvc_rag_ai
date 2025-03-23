import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Website } from '@/lib/models/website'
import { auth as getAuth } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'
import puppeteer from 'puppeteer'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

// Import existing Pinecone client & HuggingFace embeddings
import { pineconeIndex } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/huggingface'

async function createEmbeddings(websiteId: string, userId: string, content: string, metadata: any) {
  try {
    // Split text into chunks for embeddings
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    
    const textChunks = await textSplitter.splitText(content)
    
    // Create batch of documents with embeddings using HuggingFace
    const vectors = []
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]
      // Convert chunk to embedding
      const embeddingVector = await getEmbedding(chunk)
      console.log(`Embedding for chunk ${i}:`)
      vectors.push({
        id: `${websiteId}-chunk-${i}`,
        values: embeddingVector,
        metadata: {
          text: chunk,
          userId,
          websiteId,
          chunkIndex: i,
          ...metadata
        },
      })
    }
    const batchSize = 100
for (let i = 0; i < vectors.length; i += batchSize) {
  const batch = vectors.slice(i, i + batchSize)

  // Pass the batch array as the first argument
  // and the namespace as the second argument
  await pineconeIndex.upsert(
    batch,              // <-- array of vectors
  )
}
    return vectors.length
  } catch (error) {
    console.error('Error creating embeddings:', error)
    throw error
  }
}

async function scrapeWebsite(url: string) {
  let browser = null;
  try {
    // Launch a headless browser
    // Fix 2: Use correct headless option type
    browser = await puppeteer.launch({
      headless: true, // Changed from "new" to true
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Open a new page
    const page = await browser.newPage();
    
    // Set default navigation timeout (30 seconds)
    page.setDefaultNavigationTimeout(30000);
    
    // Set user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract title
    const title = await page.title();
    
    // Extract meta description
    const description = await page.evaluate(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      return metaDescription ? metaDescription.getAttribute('content') : '';
    });
    
    // Extract page content (text)
    const content = await page.evaluate(() => {
      // Remove scripts, styles, and other non-content elements
      const elementsToRemove = document.querySelectorAll('script, style, noscript, iframe');
      elementsToRemove.forEach(el => el.remove());
      
      // Get the text content of the body
      return document.body.innerText;
    });
    
    return {
      title,
      description: description || '',
      content,
      url,
      scrapedAt: new Date()
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(
  request: Request, 
  context: { params: Promise<{ _id: string }> }
) {
  try {
    const { userId } = await getAuth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { _id } = await context.params;
    
    if (!_id) {
      return new NextResponse('Missing website ID', { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('bvc_rag_ai')
    // Fix 3: Remove generic type from collection access
    const websitesCollection = db.collection('websites')
    
    // Find the website to get its URL
    const website = await websitesCollection.findOne({
      _id: new ObjectId(_id), 
      createdBy: userId
    })
    
    if (!website) {
      return new NextResponse('Website not found or unauthorized', { status: 404 })
    }
    
    // Update status to pending
    await websitesCollection.updateOne(
      { _id: new ObjectId(_id), createdBy: userId },
      { $set: { 
          lastScraped: new Date(),
          status: 'pending'
        } 
      }
    )
    
    // Process website asynchronously
    processWebsiteAsync(db, website, _id, userId).catch(error => {
      console.error(`Background processing error for ${_id}:`, error)
    })
    
    return new NextResponse('Website scraping and embedding generation initiated')
  } catch (error: any) {
    console.error('Error initiating scraping:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}

async function processWebsiteAsync(db: any, website: any, _id: string, userId: string) {
  try {
    // Scrape the website
    const scrapedData = await scrapeWebsite(website.url)
    console.log(`Scraped data for ${website.url}:`);
    // Store scraped content in MongoDB
    const contentCollection = db.collection('website_contents')
    await contentCollection.updateOne(
      { websiteId: new ObjectId(_id) },
      { 
        $set: {
          ...scrapedData,
          websiteId: new ObjectId(_id),
          createdBy: userId
        }
      },
      { upsert: true }
    )
    
    // Create embeddings and store in Pinecone
    const metadata = {
      title: scrapedData.title,
      description: scrapedData.description,
      url: website.url,
      source: 'website',
      sourceId: _id,
    }
    
    const chunksCount = await createEmbeddings(
      _id,
      userId,
      scrapedData.content,
      metadata
    )

    
    
    // Update website status to active and include embedding info
    // Fix 4: Remove generic type
    const websitesCollection = db.collection('websites')
    await websitesCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { 
          status: 'active',
          embeddings: {
            count: chunksCount,
            lastUpdated: new Date()
          }
        } 
      }
    )
    
    console.log(`Successfully scraped website ${_id} and created ${chunksCount} embeddings`)
  } catch (error) {
    // Fix 5: Type the error properly
    console.error('Error in scraping process:', error)
    
    // Update status to error
    const websitesCollection = db.collection('websites')
    await websitesCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        } 
      }
    )
  }
}
