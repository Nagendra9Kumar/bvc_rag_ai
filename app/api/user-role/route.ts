import { checkRole } from '@/utils/roles'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try{
  // Check if user has admin role
  const isAdmin = await checkRole('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    role: user.publicMetadata.role || "user"
  })
}catch(error) {
    console.error("Error in user-role API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}