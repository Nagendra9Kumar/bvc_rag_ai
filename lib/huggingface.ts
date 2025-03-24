import { HfInference } from "@huggingface/inference";


if (!process.env.HUGGING_FACE_API_KEY) {
  throw new Error("Missing Hugging Face API key");
}

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

/**
 * Get text embeddings using Hugging Face inference API.
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
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
  } catch (error) {
    console.error("Embedding error:", error);
    throw new Error("Failed to get embedding.");
  }
};

export default hf;
