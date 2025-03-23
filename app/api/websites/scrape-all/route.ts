import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { pineconeIndex } from "@/lib/pinecone";

// Rate limiting configuration
const CONCURRENT_SCRAPES = 3; // Number of concurrent scrapes
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches

// Helper function to process websites in batches with rate limiting
async function processBatch(websites: any[], baseUrl: string, authHeader: string) {
  const results = [];
  
  // Process websites in batches
  for (let i = 0; i < websites.length; i += CONCURRENT_SCRAPES) {
    const batch = websites.slice(i, i + CONCURRENT_SCRAPES);
    console.log(`Processing batch ${i / CONCURRENT_SCRAPES + 1}, size: ${batch.length}`);
    
    // Process current batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (website) => {
        try {
          const websiteId = website._id.toString();
          const scrapeUrl = `${baseUrl}/api/websites/scrape/${websiteId}`;
          console.log(`Triggering scrape at: ${scrapeUrl}`);
          
          const scrapeResponse = await fetch(scrapeUrl, {
            method: "POST",
            headers: {
              Authorization: authHeader,
            },
          });
          
          if (!scrapeResponse.ok) {
            throw new Error(`Failed to trigger scrape: ${await scrapeResponse.text()}`);
          }
          
          return { id: websiteId, success: true };
        } catch (error) {
          console.error(`Error processing website ${website._id}:`, error);
          return { 
            id: website._id.toString(), 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // If there are more websites to process, wait before next batch
    if (i + CONCURRENT_SCRAPES < websites.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
}

export async function POST(request: Request) {
  try {
    // Get the current user ID to filter websites
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const websitesCollection = db.collection("websites");
    
    // Only fetch websites belonging to the current user
    const websites = await websitesCollection.find({ createdBy: userId }).toArray();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // First, delete all existing content for this user
    const mongoResult = await db.collection("website_contents").deleteMany({
      createdBy: userId,
    });
    console.log(`Deleted ${mongoResult.deletedCount} documents from MongoDB.`);
    
    // Delete all vectors from Pinecone
    try {
      await pineconeIndex.deleteAll();
      console.log("Deleted all vectors from Pinecone successfully.");
    } catch (pineconeError) {
      console.error("Error deleting from Pinecone:", pineconeError);
    }
    
    // Update all websites to have unknown status
    await websitesCollection.updateMany(
      { createdBy: userId },
      {
        $set: {
          status: "unknown",
          updatedAt: new Date(),
        },
        $unset: { embeddings: "" }
      }
    );

    // Process websites with rate limiting
    const authHeader = request.headers.get("Authorization") || "";
    const results = await processBatch(websites, baseUrl, authHeader);

    return NextResponse.json({ 
      message: "Scraping process initiated", 
      results,
      deletedCount: mongoResult.deletedCount,
      totalWebsites: websites.length
    });
  } catch (error: any) {
    console.error("Error in scraping-all route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}