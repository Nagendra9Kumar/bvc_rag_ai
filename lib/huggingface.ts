import { HfInference } from "@huggingface/inference";

// Check if we're in a build environment
const isBuild = process.env.NODE_ENV === 'production' && !process.env.HUGGING_FACE_API_KEY

let hf: HfInference

if (isBuild) {
  // During build time, create a mock instance
  hf = {} as HfInference
} else {
  if (!process.env.HUGGING_FACE_API_KEY) {
    throw new Error("Missing Hugging Face API key");
  }
  
  hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
}

/**
 * Get text embeddings using Hugging Face inference API with retry logic.
 */
export const getEmbedding = async (text: string, retries = 3): Promise<number[]> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await hf.featureExtraction({
        model: "BAAI/bge-large-en-v1.5", // This model produces 1024-dim vectors
        inputs: text,
      });

      if (!Array.isArray(response)) {
        throw new Error("Expected an array response from the embedding API.");
      }

      const trimmedEmbedding = Array.isArray(response[0]) ? (response[0] as number[]).slice(0, 1024) : (response as number[]).slice(0, 1024);
      return trimmedEmbedding;
    } catch (error: any) {
      console.error(`Embedding error (attempt ${attempt}/${retries}):`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw new Error(`Failed to get embedding after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error("Failed to get embedding.");
};

export default hf;
