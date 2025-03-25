import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";

interface UpdateConversationBody {
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// GET a specific conversation
export async function GET(req: NextRequest, context: { params: { _id: string } }) {
  try {
    const { _id } = context.params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const conversationsCollection = await db.collection("conversations");
    const conversation = await conversationsCollection.findOne({ _id: new ObjectId(_id), userId });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT to update a conversation
export async function PUT(req: NextRequest, context: { params: { _id: string } }) {
  try {
    const { _id } = context.params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json({ 
        error: "Invalid conversation ID", 
        details: `Provided ID: ${_id} is not a valid MongoDB ObjectId`
      }, { status: 400 });
    }

    let body;
    try {
      const text = await req.text(); // First get raw text
      console.log("Raw request body:", text); // Debug log
      body = JSON.parse(text);
      console.log("Parsed request body:", body); // Debug log
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Invalid JSON", 
        details: parseError instanceof Error ? parseError.message : "Could not parse request body"
      }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        error: "Invalid request body",
        details: "Request body must be a JSON object"
      }, { status: 400 });
    }

    const { title, messages } = body as UpdateConversationBody;

    // Validation with more specific error messages
    const validationErrors: string[] = [];
    
    // Title validation
    if (!title) {
      validationErrors.push("Title is required");
    } else if (typeof title !== 'string') {
      validationErrors.push(`Title must be a string, received ${typeof title}`);
    } else if (title.trim().length === 0) {
      validationErrors.push("Title cannot be empty");
    }
    
    // Messages validation
    if (!messages) {
      validationErrors.push("Messages array is required");
    } else if (!Array.isArray(messages)) {
      validationErrors.push(`Messages must be an array, received ${typeof messages}`);
    } else if (messages.length === 0) {
      validationErrors.push("Messages array cannot be empty");
    } else {
      messages.forEach((msg, index) => {
        if (!msg || typeof msg !== 'object') {
          validationErrors.push(`Message at index ${index} must be an object`);
          return;
        }
        if (!msg.role) {
          validationErrors.push(`Message at index ${index} is missing role`);
        } else if (!['user', 'assistant'].includes(msg.role)) {
          validationErrors.push(`Message at index ${index} has invalid role: ${msg.role}`);
        }
        if (!msg.content) {
          validationErrors.push(`Message at index ${index} is missing content`);
        } else if (typeof msg.content !== 'string') {
          validationErrors.push(`Message content at index ${index} must be a string`);
        }
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 });
    }

    const conversationsCollection = await db.collection("conversations");
    const result = await conversationsCollection.updateOne(
      { _id: new ObjectId(_id), userId },
      { $set: { 
        title, 
        messages, 
        updatedAt: new Date(),
        lastModifiedBy: userId
      }}
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Conversation updated successfully",
      conversationId: _id
    });

  } catch (error) {
    console.error("Error updating conversation:", {
      error,
      conversationId: context.params._id,
      userId: (await auth())?.userId,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE a conversation
export async function DELETE(req: NextRequest, 
  { params: { id } }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    console.log("Deleting conversation with ID:", id);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const conversationsCollection = await db.collection("conversations");
    const result = await conversationsCollection.deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
