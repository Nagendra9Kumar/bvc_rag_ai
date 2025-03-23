import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import clientPromise from '@/lib/mongodb'
import { pineconeIndex } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/huggingface'
import { Document } from '@/lib/models/document'

const MAX_CHARS = 1000; // Character limit for each chunk

// Function to split content into smaller chunks
const chunkText = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];
  
  const chunks: string[] = [];
  let currentChunk = "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChars) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;

    if (!file || !title || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const content = await file.text();
    let textChunks = chunkText(content, MAX_CHARS);
    let embeddings: number[][] = [];

    for (let chunk of textChunks) {
      try {
        const embedding = await getEmbedding(chunk);
        embeddings.push(embedding);
      } catch (error) {
        console.error("Embedding Error:", error);
        return NextResponse.json(
          { error: "Failed to generate embeddings" },
          { status: 500 }
        );
      }
    }

    // Save document to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    const doc: Document = {
      title,
      content,
      category,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    const result = await db.collection("documents").insertOne(doc);
    const documentId = result.insertedId.toString();

    // Store vectors in Pinecone with 1024-dimensional embeddings
    await Promise.all(
      embeddings.map((embedding, index) =>
        pineconeIndex.upsert([
          {
            id: `${documentId}-${index}`,
            values: embedding,
            metadata: {
              mongoId: documentId,
              chunk: index,
              text: textChunks[index],
            },
          },
        ])
      )
    );

    return NextResponse.json({ id: documentId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
