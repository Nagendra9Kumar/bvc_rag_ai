import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { pineconeIndex } from "@/lib/pinecone";
import { getEmbedding } from '@/lib/gemini';
import { generateText } from "@/lib/openrouter";
import { z } from "zod";

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
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function for timing out promises
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function buildContext(matches: any[]): string {
  const context = matches
    .map((match) => {
      const { title, description, text } = match.metadata || {};
      return `Title: ${title || "[No title]"}
Description: ${description || "[No description]"}
Content: ${text || "[No content]"}`;
    })
    .join("\n\n---\n\n");

  return context.slice(0, 3000); // Trim context to prevent token limits
}

async function generateAnswer(question: string, context: string): Promise<string> {
  const systemPrompt = 
    "You are an AI assistant for BVC Engineering College, Odalarevu. " +
    "Answer questions based on the provided context. " +
    "If no context is available, let the user know.";

  const userPrompt = `Context:\n${context}\n\nQuestion: ${question}`;

  try {
    return await timeoutPromise(
      generateText(systemPrompt, userPrompt),
      30000 // 30 second timeout
    );
  } catch (error) {
    console.error("Text generation error:", error);
    throw new ApiError(500, "Failed to generate response");
  }
}

function formatSources(matches: any[]) {
  return matches.map((match) => {
    const { title, description } = match.metadata || {};
    return {
      title: title || "[No title]",
      description: description || "[No description]",
      score: match.score,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    // Validate request body
    const body = await req.json();
    const { question, topK } = requestSchema.parse(body);

    // Get embedding with timeout
    const embedding = await timeoutPromise(
      getEmbedding(question),
      5000
    ).catch(() => {
      throw new ApiError(500, "Failed to generate embedding due to timeout");
    });

  
  

    // Query Pinecone
    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    }).catch((error) => {
      console.error("Pinecone Query Error:", error);
      throw new ApiError(500, "Failed to search the knowledge base");
    });

    // Handle no matches
    if (!queryResponse.matches?.length) {
      return NextResponse.json<ApiResponse>({
        answer: "I couldn't find relevant documents. Please try rephrasing your question.",
        sources: [],
      });
    }

    // Build context from matches
    const context = buildContext(queryResponse.matches);

    // Generate answer
    const answer = await generateAnswer(question, context);

    // Return formatted response
    return NextResponse.json<ApiResponse>({
      answer,
      sources: formatSources(queryResponse.matches),
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
