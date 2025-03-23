import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { pineconeIndex } from "@/lib/pinecone";

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
    // (instead of making an HTTP call to /api/websites/chunks/all)
    const mongoResult = await db.collection("website_contents").deleteMany({
      createdBy: userId,
    });
    console.log(`Deleted ${mongoResult.deletedCount} documents from MongoDB.`);
    
    // Delete all vectors from Pinecone
    try {
      // Use namespace if you're using it to separate user data
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

    // Now process each website individually
    const processingPromises = websites.map(async (website) => {
      try {
        const websiteId = website._id.toString();
        
        // Trigger scraping via API (still need this since it's a long-running process)
        const scrapeUrl = `${baseUrl}/api/websites/scrape/${websiteId}`;
        console.log(`Triggering scrape at: ${scrapeUrl}`);

        // Include the auth header from the original request
        const authHeader = request.headers.get("Authorization") || "";
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
        await websitesCollection.updateOne(
          { _id: website._id },
          {
            $set: {
              status: "error",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            },
          }
        );
        return { 
          id: website._id.toString(), 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        };
      }
    });

    const results = await Promise.all(processingPromises);
    return NextResponse.json({ 
      message: "Scraping process initiated", 
      results,
      deletedCount: mongoResult.deletedCount 
    });
  } catch (error: any) {
    console.error("Error in scraping-all route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}