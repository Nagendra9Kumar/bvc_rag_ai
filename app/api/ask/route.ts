import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { queryRag } from "@/lib/langchain-rag";

// Define request schema
const requestSchema = z.object({
  question: z.string().min(1, "Question is required"),
  topK: z.number().min(1).max(10).default(5)
});

type ApiResponse = {
  answer?: string;
  sources?: Array<{
    title: string;
    description: string;
    score: number;
  }>;
  error?: string;
};

// Custom error class
class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { question, topK } = result.data;

    // Query using LangChain RAG
    const response = await queryRag(question, topK);

    // Return formatted response
    return NextResponse.json<ApiResponse>({
      answer: response.answer,
      sources: response.sources,
    });

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json<ApiResponse>(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Unhandled error:", error);
    return NextResponse.json<ApiResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
