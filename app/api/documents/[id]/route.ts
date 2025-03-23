import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import clientPromise from "@/lib/mongodb"
import { pineconeIndex } from "@/lib/pinecone"
import { getEmbedding } from "@/lib/huggingface"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(params.id),
      userId,
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, category } = await req.json()

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // First check if document exists and belongs to user
    const existingDoc = await db.collection("documents").findOne({
      _id: new ObjectId(params.id),
      userId,
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete existing vectors from Pinecone
    await pineconeIndex.deleteMany({
      filter: {
        mongoId: params.id
      }
    });

    // Generate new embeddings
    const MAX_CHARS = 1000;
    const textChunks = content.match(/.{1,1000}/g) || [content];
    const embeddings: number[][] = [];

    for (let chunk of textChunks) {
      try {
        const embedding = await getEmbedding(chunk);
        embeddings.push(embedding);
      } catch (error) {
        console.error("Embedding Error:", error)
        return NextResponse.json(
          { error: "Failed to generate embeddings" },
          { status: 500 }
        )
      }
    }

    // Update document in MongoDB
    await db.collection("documents").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          title,
          content,
          category,
          updatedAt: new Date(),
        },
      }
    )

    // Store new vectors in Pinecone
    await Promise.all(
      embeddings.map((embedding, index) =>
        pineconeIndex.upsert([
          {
            id: `${params.id}-${index}`,
            values: embedding,
            metadata: {
              mongoId: params.id,
              chunk: index,
              text: textChunks[index],
            },
          },
        ])
      )
    )

    return NextResponse.json({ id: params.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

