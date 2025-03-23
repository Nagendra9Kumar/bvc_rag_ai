import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import clientPromise from "@/lib/mongodb";
import { pineconeIndex } from "@/lib/pinecone";

export async function DELETE(request: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // 1. Delete all website content from MongoDB for this user
    const mongoResult = await db.collection("website_contents").deleteMany({
      createdBy: userId,
    });

    console.log(`Deleted ${mongoResult.deletedCount} documents from MongoDB.`);

    // 2. Delete all vectors from Pinecone for this user
    try {
      await pineconeIndex.deleteAll();
      console.log("Deleted all vectors from Pinecone successfully.");
    } catch (pineconeError) {
      console.error("Error deleting from Pinecone:", pineconeError);
      // Continue execution even if Pinecone delete fails
    }

    // 3. Update all websites to have unknown status
    await db.collection("websites").updateMany(
      { createdBy: userId },
      {
        $set: {
          status: "unknown",
          updatedAt: new Date(),
        },
        $unset: { embeddings: "" }
      }
    );

    return NextResponse.json({
      message: "All website chunks deleted successfully",
      mongoDeleted: mongoResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all website chunks:", error);
    return NextResponse.json(
      { error: "Failed to delete all website chunks" },
      { status: 500 }
    );
  }
}