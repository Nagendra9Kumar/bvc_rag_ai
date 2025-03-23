import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Website } from '@/lib/models/website'
import { auth as getAuth } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  try {
    const { userId } = await getAuth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    if (!body) {
      return new NextResponse('Invalid request body', { status: 400 })
    }
    // Extract URL from request body
    const { url } = body

    // Basic validation
    if (!url) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (e) {
      return new NextResponse('Invalid URL format', { status: 400 })
    }

    const client = await clientPromise
    const collection = client.db('bvc_rag_ai').collection<Website>('websites')

    // Check if URL already exists
    const existing = await collection.findOne({ url })
    if (existing) {
      return new NextResponse('URL already exists', { status: 409 })
    }

    // Create new website entry
    const website: Website = {
      url,
      status: 'unkown',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    }

    await collection.insertOne(website)

    return NextResponse.json(website)
  } catch (error: any) {
    console.error('Error adding website:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await getAuth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const client = await clientPromise
    const collection = client.db('bvc_rag_ai').collection<Website>('websites')

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')

    // Build query
    const query: any = {}
    if (active !== null) {
      query.active = active === 'true'
    }

    const websites = await collection.find(query).toArray()
    return NextResponse.json(websites)
  } catch (error: any) {
    console.error('Error fetching websites:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
