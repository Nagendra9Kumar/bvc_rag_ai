import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { pineconeIndex } from "@/lib/pinecone";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiting for bulk operations
const bulkLimiter = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await bulkLimiter(request);
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const website_contentsCollection = db.collection("website_contents");
    const websitesCollection = db.collection("websites");

    // Get websites to be deleted
    const websites = await website_contentsCollection 
      .find({ createdBy: userId })
      .toArray();

    if (websites.length === 0) {
      return NextResponse.json({ 
        message: "No websites found to delete",
        totalWebsites: 0
      });
    }

    console.log(`📋 Found ${websites.length} websites to delete`);

    // Delete website contents
    const mongoResult = await db.collection("website_contents").deleteMany({
      createdBy: userId,
    });
    console.log(`✨ Deleted ${mongoResult.deletedCount} documents from MongoDB`);

    try {
      await pineconeIndex.deleteAll();
      console.log("✨ Deleted vectors from Pinecone successfully");
    } catch (pineconeError) {
      console.error("❌ Error deleting from Pinecone:", pineconeError);
    }
    
    // Delete all websites
    const deleteResult = await website_contentsCollection.deleteMany();
    console.log(`✨ Deleted ${deleteResult.deletedCount} websites`);
    // Update status
    
    try {
      await websitesCollection.updateMany(
      {},
      { $set: { status: "unknown" } }
      );
    } catch (error) {
      console.error("❌ Error updating website status:", error);
    }
    console.log(`✨ Updated status of websites to "unknown"`);
    return NextResponse.json({ 
      message: "All websites deleted successfully", 
      summary: {
        deletedWebsites: deleteResult.deletedCount,
        deletedContents: mongoResult.deletedCount
      }
    });
  } catch (error: any) {
    console.error("❌ Error in delete-all route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}