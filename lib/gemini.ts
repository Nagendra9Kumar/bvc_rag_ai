import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
// Check for required API key
if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing Google API key");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embedAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Generate text using Gemini Pro model
 */

export const generateText = async (
    systemPrompt: string,
    userPrompt: string,
    model: string = "gemini-2.0-flash",
    temperature: number = 0.7,
    maxLength: number = 1000
  ): Promise<string> => {
    try {
      const modelInstance = genAI.getGenerativeModel({ model });
  
      const response = await modelInstance.generateContent({
        contents: [
          { role: "system", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxLength,
        },
      });
  
      const text = response.response.text();
      return text ?? "No content returned";
    } catch (error) {
      console.error("Text generation error:", error);
      return "Error generating response.";
    }
  };
/**
 * Get text embeddings using Gemini Pro model
 */

export async function getEmbedding(text: string, attempt = 1): Promise<number[]> {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000 * Math.pow(2, attempt - 1); // Exponential backoff
  
    try {
      const modelInstance = genAI.getGenerativeModel({ model: "gemini-embedding-exp-03-07" });
      const response = await modelInstance.embedContent(text);
      return response?.embedding?.values ?? [];
    } catch (error: any) {
      console.error(`Embedding error on attempt ${attempt}:`, error);
  
      if (attempt < MAX_RETRIES && error.status === 429) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(res => setTimeout(res, RETRY_DELAY));
        return getEmbedding(text, attempt + 1);
      }
  
      throw new Error(`Failed to fetch embedding: ${error.message}`);
    }
  }
  

export { genAI };
