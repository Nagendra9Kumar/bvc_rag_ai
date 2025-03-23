import { type NextRequest, NextResponse } from "next/server"
import { auth } from '@clerk/nextjs/server'
import clientPromise from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    const documents = await db.collection("documents").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      documents: documents.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

