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
import { getEmbedding } from '@/lib/gemini'

// Enhanced rate limiting: 10 requests per 5 minutes per user
const limiter = rateLimit({
  maxRequests: 10,
  windowMs: 5 * 60 * 1000,
});

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const MAX_TIMEOUT = 60000;
const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5MB

// Helper function to implement delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced HTML content extraction
function extractContent($: cheerio.CheerioAPI) {
  // Remove unwanted elements
  $('script, style, noscript, iframe, nav, footer, header, aside, .cookie-banner, .ad, #cookie-consent').remove();
  
  // Get main content areas first
  const mainContent = $('main, article, .content, .main-content, #content, #main').text();
  if (mainContent.length > 100) {
    return mainContent;
  }

  // Fallback to body content with better cleaning
  return $('body')
    .clone()
    .find('nav, header, footer, aside, .navigation, .menu, .sidebar')
    .remove()
    .end()
    .text();
}

// Enhanced scraping function with better error handling
async function scrapeWebsite(url: string) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🌐 Scraping website: ${url} (Attempt ${attempt}/${MAX_RETRIES})`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: MAX_TIMEOUT,
        maxContentLength: MAX_CONTENT_LENGTH,
        validateStatus: (status) => status < 400
      });

      const $ = cheerio.load(response.data);

      // Enhanced metadata extraction
      const title = $('title').text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   $('h1').first().text().trim() ||
                   url;

      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';

      const content = extractContent($)
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      if (!content) {
        throw new Error('No meaningful content found in the webpage');
      }

      return {
        title,
        description,
        content,
        url,
        scrapedAt: new Date(),
        statusCode: response.status,
        contentLength: content.length
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Error scraping ${url} (Attempt ${attempt}/${MAX_RETRIES}):`, error);

      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const isRetryable = error.code === 'ECONNABORTED' || 
                           error.code === 'ECONNREFUSED' ||
                           status === 429 || 
                           (status && status >= 500 && status < 600);

        if (isRetryable && attempt < MAX_RETRIES) {
          const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
      }

      throw new Error(`Failed to scrape ${url}: ${lastError?.message}`);
    }
  }

  throw lastError || new Error(`Failed to scrape ${url}`);
}

async function createEmbeddings(websiteId: string, userId: string, content: string, metadata: any) {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const textChunks = await textSplitter.splitText(content);
    console.log(`📄 Created ${textChunks.length} chunks from content`);

    const batchSize = 5; // Adjust based on API limits
    interface PineconeVector {
      id: string;
      values: number[];
      metadata: {
      text: string;
      userId: string;
      websiteId: string;
      chunkIndex: number;
      title?: string;
      description?: string;
      url?: string;
      source?: string;
      sourceId?: string;
      [key: string]: any;
      };
    }

    let vectors: PineconeVector[] = [];

    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize);

      try {
        const embeddingVectors = await Promise.all(batch.map(chunk => getEmbedding(chunk)));

        interface ChunkMetadata {
          text: string;
          userId: string;
          websiteId: string;
          chunkIndex: number;
          [key: string]: any;
        }

        embeddingVectors.forEach((vector: number[], index: number) => {
          vectors.push({
            id: `${websiteId}-chunk-${i + index}`,
            values: vector,
            metadata: { text: batch[index], userId, websiteId, chunkIndex: i + index, ...metadata } as ChunkMetadata,
          });
        });

        console.log(`✅ Generated embeddings for batch ${i / batchSize + 1}/${Math.ceil(textChunks.length / batchSize)}`);
      } catch (error) {
        console.error(`❌ Error generating embedding batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    // Batch upload to Pinecone
    for (let i = 0; i < vectors.length; i += batchSize) {
      await pineconeIndex.upsert(vectors.slice(i, i + batchSize));
      console.log(`📤 Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }

    return vectors.length;
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
}

// Helper function to update website status
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
  console.log(`📝 Updated website ${_id} status to ${status}`);
}

// Enhanced async processing function
async function processWebsiteAsync(db: any, website: any, _id: string, userId: string) {
  const websitesCollection = db.collection('websites');

  try {
    await updateWebsiteStatus(websitesCollection, _id, 'scraping', {
      currentAttempt: 1,
      maxAttempts: MAX_RETRIES
    });

    const scrapedData = await scrapeWebsite(website.url);
    
    await updateWebsiteStatus(websitesCollection, _id, 'processing', {
      statusCode: scrapedData.statusCode
    });

    // Store scraped content
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

    await updateWebsiteStatus(websitesCollection, _id, 'embedding', {});
    
    const chunksCount = await createEmbeddings(
      _id,
      userId,
      scrapedData.content,
      {
        title: scrapedData.title,
        description: scrapedData.description,
        url: website.url,
        source: 'website',
        sourceId: _id,
      }
    );

    await websitesCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          status: 'active',
          lastScraped: new Date(),
          statusDetails: {
            lastUpdate: new Date(),
            progress: {
              phase: 'completed',
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
    
    console.log(`✨ Successfully processed website ${_id} with ${chunksCount} embeddings`);
  } catch (error) {
    console.error('❌ Error in processing:', error);
    
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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders(request) });
}

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ _id: string }> }
) {
  try {
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

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders(request) }
      );
    }
    
    const { _id } = await context.params;
    if (!_id) {
      return NextResponse.json(
        { error: 'Missing website ID' },
        { status: 400, headers: corsHeaders(request) }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    const websitesCollection = db.collection('websites');
    
    const website = await websitesCollection.findOne({
      _id: new ObjectId(_id), 
      createdBy: userId
    });
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found or unauthorized' },
        { status: 404, headers: corsHeaders(request) }
      );
    }
    
    await updateWebsiteStatus(websitesCollection, _id, 'pending', {
      lastUpdate: new Date()
    });
    
    processWebsiteAsync(db, website, _id, userId).catch(error => {
      console.error(`Background processing error for ${_id}:`, error);
    });
    
    return NextResponse.json(
      { message: 'Website scraping and embedding generation initiated' },
      { headers: corsHeaders(request) }
    );
  } catch (error: any) {
    console.error('Error initiating scraping:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
