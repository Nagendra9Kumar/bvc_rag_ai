import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { questionId, rating, comment } = await req.json()
    
    if (!questionId || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const client = await clientPromise
    const db = client.db()
    
    // Store feedback in MongoDB
    await db.collection('feedback').insertOne({
      userId,
      questionId: typeof questionId === 'number' 
        ? ObjectId.createFromTime(questionId)
        : typeof questionId === 'string'
          ? new ObjectId(questionId)
          : questionId, // Assuming it's already an ObjectId
      rating,
      comment,
      createdAt: new Date(),
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to store feedback' },
      { status: 500 }
    )
  }
}
