import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";

// Enhanced logging utility with process stages
const logger = {
  info: (stage: string, message: string, ...args: any[]) => 
    console.log(`[INFO] [${stage}] ${message}`, ...args),
  error: (stage: string, message: string, ...args: any[]) => 
    console.error(`[ERROR] [${stage}] ${message}`, ...args),
  warn: (stage: string, message: string, ...args: any[]) => 
    console.warn(`[WARN] [${stage}] ${message}`, ...args),
  debug: (stage: string, message: string, ...args: any[]) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] [${stage}] ${message}`, ...args);
    }
  }
};

// Initialize Pinecone client
const initPineconeClient = async (): Promise<Pinecone> => {
  const STAGE = "PINECONE_INIT";
  try {
    logger.debug(STAGE, "Initializing Pinecone client");
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }
    
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    logger.debug(STAGE, "Pinecone client initialized successfully");
    return client;
  } catch (error) {
    logger.error(STAGE, "Failed to initialize Pinecone client:", error);
    throw new Error(`Pinecone initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get vector store from Pinecone
export const getVectorStore = async (indexName: string = process.env.PINECONE_INDEX || "bvc-rag-index") => {
  const STAGE = "VECTOR_STORE";
  try {
    logger.debug(STAGE, `Getting vector store with index: ${indexName}`);
    
    // Check for API keys
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }
    
    if (!process.env.HUGGING_FACE_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
      throw new Error("No Hugging Face API key found - please set either HUGGING_FACE_API_KEY or HUGGINGFACE_API_KEY");
    }
    
    // Get the appropriate API key (check both possible environment variable names)
    const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY;
    
    // Initialize Pinecone client with additional logging
    logger.debug(STAGE, "Initializing Pinecone client");
    const client = await initPineconeClient();
    
    logger.debug(STAGE, `Getting Pinecone index: ${indexName}`);
    const pineconeIndex = client.Index(indexName);
    
    logger.debug(STAGE, "Creating embedding model and connecting to vector store");
    const store = await PineconeStore.fromExistingIndex(
      new HuggingFaceInferenceEmbeddings({
        apiKey: huggingFaceApiKey,
        model: "BAAI/bge-large-en-v1.5"
      }),
      { pineconeIndex }
    );
    
    logger.debug(STAGE, "Vector store retrieved successfully");
    return store;
  } catch (error) {
    logger.error(STAGE, `Failed to get vector store with index ${indexName}:`, error);
    
    // Improved error diagnostics
    if (error instanceof Error) {
      if (error.message.includes("Invalid username or password")) {
        logger.error(STAGE, "Authentication error detected. Please check your Pinecone and Hugging Face API keys.");
        throw new Error("Authentication failed: Invalid API credentials - please verify your Pinecone and Hugging Face API keys");
      }
      
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        logger.error(STAGE, `Index "${indexName}" not found in Pinecone`);
        throw new Error(`Pinecone index "${indexName}" not found - please check your index name`);
      }
    }
    
    throw new Error(`Vector store initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Text splitter for chunking documents
export const getTextSplitter = () => {
  const STAGE = "TEXT_SPLITTER";
  logger.debug(STAGE, "Creating text splitter");
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
};

// Build RAG chain
export const createRagChain = () => {
  const STAGE = "RAG_CHAIN_CREATE";
  try {
    logger.debug(STAGE, "Creating RAG chain");
    
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    
    // Array of models to try in order (fallback strategy)
    const modelOptions = [
      "openai/gpt-5-mini",
      "deepseek/deepseek-r1-distill-llama-70b:free",
      "openai/gpt-3.5-turbo",
      "anthropic/claude-instant-v1"
    ];
    
    // LLM - Add validation for API key format
    logger.debug(STAGE, `Initializing LLM with model: ${modelOptions[0]}`);
    
    // Validate API key format
    if (process.env.OPENROUTER_API_KEY.trim() === "" || 
        process.env.OPENROUTER_API_KEY.length < 10) {
      throw new Error("OPENROUTER_API_KEY appears to be invalid");
    }
    
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      modelName: modelOptions[0],
      temperature: 0.7,
      maxTokens: 1000,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      }
    });
   
    

    // Prompt template
    logger.debug(STAGE, "Creating prompt template");
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an AI assistant for BVC Engineering College, Odalarevu.
      Answer questions based on the provided context.
      If no context is available or you're unsure, let the user know.
      
      Context:
      {context}
      
      Question: {question}
      
      Answer:
    `);

    // RAG chain
    logger.debug(STAGE, "Building RAG chain sequence");
    return RunnableSequence.from([
      {
        context: (input: { context: Document[]; question: string }) => {
          return input.context.map((doc) => doc.pageContent).join('\n\n');
        },
        question: (input: { context: Document[]; question: string }) => input.question,
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);
  } catch (error) {
    logger.error(STAGE, "Failed to create RAG chain:", error);
    throw new Error(`RAG chain creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Main RAG function
export async function queryRag(question: string, topK: number = 5) {
  const STAGE = "RAG_QUERY";
  logger.info(STAGE, `Processing query: "${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`);
  
  try {
    // Validate inputs
    if (!question || question.trim() === "") {
      logger.warn(STAGE, "Empty question received");
      return {
        answer: "I need a question to provide an answer. Please ask something specific.",
        sources: [],
      };
    }
    
    // Get vector store with better error handling
    try {
      logger.debug(STAGE, "Starting vector store retrieval");
      
      // Verify environment variables are set
      if (!process.env.PINECONE_API_KEY) {
        logger.error(STAGE, "PINECONE_API_KEY missing");
        return {
          answer: "The system is missing required configuration. Please contact the administrator to check API credentials.",
          sources: [],
          error: "Missing PINECONE_API_KEY"
        };
      }
      
      // Check for HuggingFace keys (with different possible names)
      if (!process.env.HUGGING_FACE_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
        logger.error(STAGE, "Hugging Face API key missing");
        return {
          answer: "The system is missing required configuration. Please contact the administrator to check Hugging Face API credentials.",
          sources: [],
          error: "Missing HUGGINGFACE_API_KEY"
        };
      }
      
      logger.debug(STAGE, "Retrieving vector store");
      const vectorStore = await getVectorStore();
      const retriever = vectorStore.asRetriever(topK);
      
      // Get relevant documents
      logger.debug(STAGE, `Retrieving top ${topK} relevant documents`);
      const startTime = Date.now();
      const context = await retriever.getRelevantDocuments(question);
      logger.debug(STAGE, `Retrieved ${context.length} documents in ${Date.now() - startTime}ms`);
      
      // Check if documents were found
      if (context.length === 0) {
        logger.info(STAGE, "No relevant documents found for the query");
        return {
          answer: "I couldn't find relevant information. Please try rephrasing your question.",
          sources: [],
        };
      }
      
      // Create and execute RAG chain
      logger.debug(STAGE, "Creating RAG chain");
      const ragChain = createRagChain();
      
      logger.debug(STAGE, "Invoking RAG chain");
      const chainStartTime = Date.now();
      const answer = await ragChain.invoke({ context, question });
      logger.debug(STAGE, `Generated answer in ${Date.now() - chainStartTime}ms`);
      
      // Format sources
      logger.debug(STAGE, "Formatting sources");
      const sources = context.map(doc => {
        const metadata = doc.metadata;
        return {
          title: metadata.title || "[No title]",
          description: metadata.description || "[No description]",
          score: metadata.score || 0,
        };
      });
      
      logger.info(STAGE, `Successfully processed query in ${Date.now() - startTime}ms`);
      return { answer, sources };
    } catch (vectorError: any) {
      // Handle vector store specific errors
      logger.error(STAGE, "Vector store error:", vectorError);
      
      if (vectorError.message && vectorError.message.includes("Invalid username or password")) {
        return {
          answer: "There's an authentication issue with the knowledge base. Please contact the system administrator to verify API credentials.",
          sources: [],
          error: "Authentication error with vector store"
        };
      }
      
      if (vectorError.message && vectorError.message.includes("not found")) {
        return {
          answer: "The knowledge base index could not be found. Please contact the system administrator.",
          sources: [],
          error: "Index not found"
        };
      }
      
      throw vectorError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    logger.error(STAGE, "RAG query error:", error);
    
    // Enhanced error handling
    // Authentication errors
    if (error.message && (
        error.message.includes("Invalid username or password") ||
        error.message.includes("authentication") ||
        error.message.includes("API key")
    )) {
      return {
        answer: "There's an authentication issue with the AI service. Please contact the system administrator to verify API credentials.",
        sources: [],
        error: "Authentication error"
      };
    }
    
    // Model errors
    if (error.lc_error_code === 'MODEL_NOT_FOUND') {
      return {
        answer: "Sorry, there's an issue with the AI model availability. Please try again later.",
        sources: [],
        error: "Model not available"
      };
    }
    
    // Rate limiting
    if (error.message && error.message.includes("rate limit")) {
      return {
        answer: "The service is currently experiencing high demand. Please try again in a few moments.",
        sources: [],
        error: "Rate limited"
      };
    }
    
    // Generic error response
    return {
      answer: "I encountered an error while processing your question. Please try again later.",
      sources: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Ingest documents function
export async function ingestDocuments(documents: Array<{ content: string; metadata?: Record<string, any> }>) {
  const STAGE = "INGEST_DOCS";
  try {
    logger.info(STAGE, `Starting ingestion of ${documents.length} documents`);
    const startTime = Date.now();
    
    // Validate input
    if (!documents.length) {
      logger.warn(STAGE, "No documents provided for ingestion");
      return { success: false, error: "No documents provided" };
    }
    
    // Get text splitter
    logger.debug(STAGE, "Creating text splitter");
    const splitter = getTextSplitter();
    
    // Process documents
    logger.debug(STAGE, "Processing and splitting documents");
    const docs: Document[] = [];
    
    for (const doc of documents) {
      // Create document
      const document = new Document({
        pageContent: doc.content,
        metadata: doc.metadata || {},
      });
      
      // Split into chunks
      const chunks = await splitter.splitDocuments([document]);
      docs.push(...chunks);
    }
    
    logger.debug(STAGE, `Split ${documents.length} documents into ${docs.length} chunks`);
    
    // Get vector store
    logger.debug(STAGE, "Getting vector store");
    const vectorStore = await getVectorStore();
    
    // Add documents to vector store
    logger.debug(STAGE, `Adding ${docs.length} document chunks to vector store`);
    await vectorStore.addDocuments(docs);
    
    logger.info(STAGE, `Successfully ingested ${documents.length} documents (${docs.length} chunks) in ${Date.now() - startTime}ms`);
    return { success: true, chunks: docs.length };
  } catch (error) {
    logger.error(STAGE, "Document ingestion error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Delete documents function
export async function deleteDocuments(ids: string[]) {
  const STAGE = "DELETE_DOCS";
  try {
    logger.info(STAGE, `Deleting ${ids.length} documents`);
    
    if (!ids.length) {
      logger.warn(STAGE, "No document IDs provided for deletion");
      return { success: false, error: "No document IDs provided" };
    }
    
    // Get vector store
    const vectorStore = await getVectorStore();
    
    // Check if the vectorStore has a delete method
    if (typeof vectorStore.delete !== 'function') {
      logger.error(STAGE, "Vector store does not support document deletion");
      return { success: false, error: "Vector store does not support document deletion" };
    }
    
    // Delete documents
    await vectorStore.delete({ ids });
    
    logger.info(STAGE, `Successfully deleted ${ids.length} documents`);
    return { success: true, deleted: ids.length };
  } catch (error) {
    logger.error(STAGE, "Document deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
