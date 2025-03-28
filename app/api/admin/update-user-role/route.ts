import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId: adminId } = await auth();
  
  // Check if current user is an admin (implement your own logic)
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { userId, role }: { userId: string; role: string } = await request.json();
    
    // Update the user's metadata with their role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}