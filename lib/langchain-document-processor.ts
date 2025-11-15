import { Document } from "@langchain/core/documents";
import { getTextSplitter, getVectorStore } from "./langchain-rag";
import { nanoid } from "nanoid";
import clientPromise from "@/lib/mongodb";

export interface DocumentToProcess {
  title: string;
  content: string;
  category?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export async function processDocument(doc: DocumentToProcess) {
  try {
    // 1. Split the document into chunks
    const textSplitter = getTextSplitter();
    const textChunks = await textSplitter.splitText(doc.content);
    
    // 2. Create LangChain documents
    const documents = textChunks.map((text, index) => {
      return new Document({
        pageContent: text,
        metadata: {
          title: doc.title,
          userId: doc.userId,
          category: doc.category || "general",
          chunkIndex: index,
          documentId: nanoid(),
          ...doc.metadata,
        },
      });
    });
    
    // 3. Get vector store
    const vectorStore = await getVectorStore();
    
    // 4. Add documents to vector store
    await vectorStore.addDocuments(documents);
    
    // 5. Save document record to MongoDB
    const client = await clientPromise;
    const db = client.db();
    await db.collection("documents").insertOne({
      title: doc.title,
      category: doc.category || "general",
      userId: doc.userId,
      chunkCount: textChunks.length,
      createdAt: new Date(),
      ...doc.metadata,
    });
    
    return {
      success: true,
      chunksProcessed: textChunks.length,
    };
  } catch (error) {
    console.error("Document processing error:", error);
    throw error;
  }
}