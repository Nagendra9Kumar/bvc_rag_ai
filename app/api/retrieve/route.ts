import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import clientPromise from '@/lib/mongodb'
import { pineconeIndex } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/huggingface'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { query, topK = 5 } = await req.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    // Generate embedding for the query
    let embedding: number[];
    try {
      embedding = await getEmbedding(query);
    } catch (error) {
      console.error('Embedding Error:', error)
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: 500 }
      )
    }
    
    // Query Pinecone for similar documents
    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    })
    
    // Get full documents from MongoDB
    const client = await clientPromise
    const db = client.db()
    const documents = await Promise.all(
      queryResponse.matches.map(async (match) => {
        const id = match.metadata?.mongoId
        if (!id) return null
        
        const doc = await db.collection('documents').findOne({
          _id: new ObjectId(id as string)
        })
        return doc
      })
    )
    
    const validDocuments = documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null)
    
    return NextResponse.json({
      documents: validDocuments.map(doc => ({
        id: doc._id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
