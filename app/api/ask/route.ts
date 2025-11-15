import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { queryRag } from "@/lib/langchain-rag";

// Configure route for longer timeout
export const maxDuration = 60; // 60 seconds max to handle slow LLM responses
export const dynamic = 'force-dynamic';

// Define request schema
const requestSchema = z.object({
  question: z.string().min(1, "Question is required"),
  topK: z.number().min(1).max(10).default(2) // Reduced to 2 for faster responses
});

type ApiResponse = {
  answer?: string;
  sources?: Array<{
    title: string;
    description: string;
    score: number;
  }>;
  followUpQuestions?: string[];
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

// Generate contextual follow-up questions
function generateFollowUpQuestions(originalQuestion: string, answer: string): string[] {
  const lowerQuestion = originalQuestion.toLowerCase();
  const lowerAnswer = answer.toLowerCase();
  
  // Admission related
  if (lowerQuestion.includes('admission') || lowerAnswer.includes('admission')) {
    return [
      "What documents are required for admission?",
      "When does the admission process start?",
      "What is the eligibility criteria?"
    ];
  }
  
  // Fee related
  if (lowerQuestion.includes('fee') || lowerAnswer.includes('fee') || 
      lowerQuestion.includes('cost') || lowerAnswer.includes('cost')) {
    return [
      "What are the scholarship options?",
      "Are there any payment installment plans?",
      "What does the fee include?"
    ];
  }
  
  // Placement related
  if (lowerQuestion.includes('placement') || lowerAnswer.includes('placement') ||
      lowerQuestion.includes('job') || lowerAnswer.includes('job')) {
    return [
      "What is the average placement package?",
      "Which companies visit for placements?",
      "What is the placement success rate?"
    ];
  }
  
  // Course/Program related
  if (lowerQuestion.includes('course') || lowerAnswer.includes('course') ||
      lowerQuestion.includes('program') || lowerAnswer.includes('program') ||
      lowerQuestion.includes('department') || lowerAnswer.includes('department')) {
    return [
      "What specializations are available?",
      "What is the course duration?",
      "What are the faculty credentials?"
    ];
  }
  
  // Hostel related
  if (lowerQuestion.includes('hostel') || lowerAnswer.includes('hostel') ||
      lowerQuestion.includes('accommodation') || lowerAnswer.includes('accommodation')) {
    return [
      "What are the hostel facilities?",
      "What is the hostel fee structure?",
      "Is hostel accommodation available for all students?"
    ];
  }
  
  // Infrastructure/Facilities
  if (lowerQuestion.includes('facility') || lowerAnswer.includes('facility') ||
      lowerQuestion.includes('infrastructure') || lowerAnswer.includes('infrastructure') ||
      lowerQuestion.includes('campus') || lowerAnswer.includes('campus')) {
    return [
      "What labs and equipment are available?",
      "Does the campus have a library?",
      "What sports facilities are available?"
    ];
  }
  
  // If answer mentions specific topics, suggest related questions
  if (lowerAnswer.includes('engineering') || lowerAnswer.includes('bvc')) {
    return [
      "What makes BVC unique?",
      "What are the admission requirements?",
      "Tell me about placement opportunities"
    ];
  }
  
  // Default follow-ups if no specific match
  return [
    "What programs does BVC offer?",
    "How can I apply for admission?",
    "Tell me about campus life"
  ];
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
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { question, topK } = result.data;

    // Query using LangChain RAG
    const response = await queryRag(question, topK);

    // Generate follow-up questions based on the answer
    const followUpQuestions = generateFollowUpQuestions(question, response.answer);

    // Return formatted response
    return NextResponse.json<ApiResponse>({
      answer: response.answer,
      sources: response.sources,
      followUpQuestions,
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
