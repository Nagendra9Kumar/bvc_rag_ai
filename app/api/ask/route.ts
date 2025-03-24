import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { pineconeIndex } from "@/lib/pinecone";
import { getEmbedding } from '@/lib/huggingface';
import { generateText } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, topK = 5 } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the question
    let embedding: number[];
    try {
      embedding = await getEmbedding(question);
    } catch (error) {
      console.error("Embedding Error:", error);
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    // Query Pinecone
    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    // If no matches, return appropriate message
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant documents. Please try rephrasing your question.",
        sources: [],
      });
    }

    // Build a context from Pinecone's metadata
    const context = queryResponse.matches
      .map((match) => {
        const { title, description, text } = match.metadata || {};
        return `Title: ${title || "[No title]"}\nDescription: ${
          description || "[No description]"
        }\n\nContent: ${text || "[No content]"}`;
      })
      .join("\n\n---\n\n");

    // Just before calling generateText, shorten your context:
    const trimmedContext = context.slice(0, 3000); // or whichever cutoff needed

    // Generate answer using Hugging Face
    const systemPrompt =
      "You are an AI assistant for BVC Engineering College, Odalarevu. Answer questions based on the provided context. If no context is available, let the user know.";
    const userPrompt = `Context:\n${trimmedContext}\n\nQuestion: ${question}`;

    const answer = await generateText(systemPrompt, userPrompt /* smaller max tokens */);
    
    // Return response with the matched documents as sources
    return NextResponse.json({
      answer,
      sources: queryResponse.matches.map((match) => {
        const { title, description } = match.metadata || {};
        return {
          title: title || "[No title]",
          description: description || "[No description]",
          score: match.score,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
