import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Website } from '@/lib/models/website'
import { auth as getAuth } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'

export async function DELETE(req: Request,
  context: { params: Promise<{ _id: string }> }) {
  try {
    const { userId } = await getAuth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const { _id } = await context.params;

    if (!_id) {
      return new NextResponse('Missing website ID', { status: 400 })
    }

    const client = await clientPromise
    const collection = client.db('bvc_rag_ai').collection<Website>('websites')

    const result = await collection.deleteOne({
      _id: new ObjectId(_id),
      createdBy: userId // Only allow deletion of own websites
    })

    if (result.deletedCount === 0) {
      return new NextResponse('Website not found or unauthorized', { status: 404 })
    }

    return new NextResponse('Website deleted successfully')
  } catch (error: any) {
    console.error('Error deleting website:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
