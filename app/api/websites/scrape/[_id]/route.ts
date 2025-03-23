import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Website, WebsiteStatus, WebsiteStatusDetails } from '@/lib/models/website'
import { auth as getAuth } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import axios, { AxiosError } from 'axios'
import * as cheerio from 'cheerio'
import { corsHeaders } from '@/lib/cors'
import { rateLimit } from '@/lib/rate-limit'
import { pineconeIndex } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/huggingface'

// More restrictive rate limiting for scraping: 10 requests per 5 minutes
const limiter = rateLimit({
  maxRequests: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
});

// Configuration for retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const MAX_TIMEOUT = 60000; // 60 seconds

// Helper function to implement delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      await pineconeIndex.upsert(
        batch  // <-- array of vectors
      )
    }
    return vectors.length
  } catch (error) {
    console.error('Error creating embeddings:', error)
    throw error
  }
}

// Scraping function with production-ready error handling
async function scrapeWebsite(url: string) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Scraping website: ${url} (Attempt ${attempt}/${MAX_RETRIES})`);
      
      // Use axios to fetch the HTML content with increased timeout
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: MAX_TIMEOUT,
        validateStatus: (status) => status < 400 // Treat 3xx as success
      });
      
      // Load HTML content into Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('title').text().trim() || url;
      
      // Extract meta description
      const description = $('meta[name="description"]').attr('content') || '';
      
      // Extract page content (text)
      // Remove scripts, styles, and other non-content elements
      $('script, style, noscript, iframe, nav, footer, header, aside').remove();
      
      // Get the text content of the body
      const content = $('body').text()
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();
      
      if (!content) {
        throw new Error('No content found in the webpage');
      }
      
      return {
        title,
        description,
        content,
        url,
        scrapedAt: new Date(),
        statusCode: response.status
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Error scraping ${url} (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      // Check if we should retry based on the error type
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (error.code === 'ECONNABORTED' || status === 429 || 
            (status && status >= 500) || error.code === 'ECONNREFUSED') {
          if (attempt < MAX_RETRIES) {
            const waitTime = RETRY_DELAY * attempt;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            continue;
          }
        }
      }
      
      // If we get here, either we've exhausted retries or encountered a non-retryable error
      throw new Error(`Failed to scrape ${url} after ${attempt} attempts: ${lastError?.message}`);
    }
  }
  
  // This shouldn't be reachable, but TypeScript wants it
  throw lastError || new Error(`Failed to scrape ${url}`);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders(request) });
}

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ _id: string }> }
) {
  try {
    // Check rate limit
    const rateLimitResult = await limiter(request);
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: {
            ...corsHeaders(request),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { userId } = await getAuth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders(request) }
      )
    }
    
    const { _id } = await context.params;
    
    if (!_id) {
      return NextResponse.json(
        { error: 'Missing website ID' },
        { status: 400, headers: corsHeaders(request) }
      )
    }
    
    const client = await clientPromise
    const db = client.db('bvc_rag_ai')
    const websitesCollection = db.collection('websites')
    
    // Find the website and verify ownership
    const website = await websitesCollection.findOne({
      _id: new ObjectId(_id), 
      createdBy: userId
    })
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404, headers: corsHeaders(request) }
      )
    }
    
    // Update status to pending
    await updateWebsiteStatus(websitesCollection, _id, 'pending', {
      lastUpdate: new Date()
    })
    
    // Process website asynchronously
    processWebsiteAsync(db, website, _id, userId).catch(error => {
      console.error(`Background processing error for ${_id}:`, error)
    })
    
    return NextResponse.json(
      { message: 'Website scraping and embedding generation initiated' },
      { headers: corsHeaders(request) }
    )
  } catch (error: any) {
    console.error('Error initiating scraping:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

async function updateWebsiteStatus(
  websitesCollection: any,
  _id: string,
  status: WebsiteStatus,
  details: Partial<WebsiteStatusDetails>
) {
  await websitesCollection.updateOne(
    { _id: new ObjectId(_id) },
    {
      $set: {
        status,
        statusDetails: {
          ...details,
          lastUpdate: new Date()
        },
        updatedAt: new Date()
      }
    }
  );
}

async function processWebsiteAsync(db: any, website: any, _id: string, userId: string) {
  const websitesCollection = db.collection('websites');
  
  try {
    // Update status to scraping
    await updateWebsiteStatus(websitesCollection, _id, 'scraping', {
      currentAttempt: 1,
      maxAttempts: MAX_RETRIES
    });

    // Scrape the website
    const scrapedData = await scrapeWebsite(website.url);
    
    // Update status to processing
    await updateWebsiteStatus(websitesCollection, _id, 'processing', {
      statusCode: scrapedData.statusCode
    });

    // Store scraped content in MongoDB
    const contentCollection = db.collection('website_contents');
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
    );
    
    // Create embeddings and store in Pinecone
    const metadata = {
      title: scrapedData.title,
      description: scrapedData.description,
      url: website.url,
      source: 'website',
      sourceId: _id,
    };
    
    // Update status to embedding
    await updateWebsiteStatus(websitesCollection, _id, 'embedding', {});
    
    const chunksCount = await createEmbeddings(
      _id,
      userId,
      scrapedData.content,
      metadata
    );

    // Update status to active with final details
    await websitesCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          status: 'active',
          lastScraped: new Date(),
          statusDetails: {
            lastUpdate: new Date(),
            progress: {
              phase: 'embedding',
              current: chunksCount,
              total: chunksCount
            }
          },
          embeddings: {
            count: chunksCount,
            lastUpdated: new Date()
          }
        }
      }
    );
    
    console.log(`Successfully scraped website ${_id} and created ${chunksCount} embeddings`);
  } catch (error) {
    console.error('Error in scraping process:', error);
    
    // Update status to error with error details
    await websitesCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          status: 'error',
          statusDetails: {
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastUpdate: new Date()
          }
        }
      }
    );
  }
}
