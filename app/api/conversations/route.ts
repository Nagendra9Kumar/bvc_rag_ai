import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db"; // Your database connection

// GET all conversations for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationsCollection = await db.collection("conversations");
    const conversations = await conversationsCollection.find({
      userId: userId
    }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST a new conversation
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, messages = [] } = await req.json();
    
    const newConversation = {
      userId,
      title,
      messages,
      createdAt: Date.now()
    };
    const conversationsCollection = await db.collection("conversations");
    const result = await conversationsCollection.insertOne(newConversation);
    
    return NextResponse.json({
      id: result.insertedId,
      ...newConversation
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}