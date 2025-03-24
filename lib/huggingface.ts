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
      model: "BAAI/bge-large-en-v1.5",
      inputs: text,
    });

    if (!Array.isArray(response)) {
      throw new Error("Expected an array response from the embedding API.");
    }

    return Array.isArray(response[0]) ? (response[0] as number[]) : (response as number[]);
  } catch (error) {
    console.error("Embedding error:", error);
    throw new Error("Failed to get embedding.");
  }
};

/**
 * Generate text using Meta's Llama 3 model on Hugging Face.
 */
// export const generateText = async (
//   systemPrompt: string,
//   userPrompt: string,
//   model: string = "deepseek-ai/deepseek-llm-7b-chat",
//   temperature: number = 0.7,
//   maxLength: number = 1000
// ): Promise<string> => {
//   try {
//     const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;

//     // Rough token estimation (for better accuracy, use `tiktoken`)
//     const promptTokens = fullPrompt.split(/\s+/).length;
//     const safeMax = Math.max(Math.min(maxLength, 2048 - promptTokens - 1), 1);

//     const response = await hf.textGeneration({
//       model,
//       inputs: fullPrompt,
//       parameters: {
//         temperature,
//         max_new_tokens: safeMax,
//         do_sample: true,
//         top_p: 0.95,
//         repetition_penalty: 1.2,
//       },
//     });

//     if (!response?.generated_text) {
//       throw new Error("Invalid response from Hugging Face API");
//     }

//     const fullGeneratedText = response.generated_text;
//     return fullGeneratedText.includes("Assistant:")
//       ? fullGeneratedText.split("Assistant:")[1].trim()
//       : fullGeneratedText.trim();
//   } catch (error) {
//     console.error("Text generation error:", error);
//     return "Error generating response.";
//   }
// };
export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
  model: string = "deepseek-chat",
  temperature: number = 0.7,
  maxLength: number = 1000
): Promise<string> => {
  try {
    const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;

    // Rough token estimation (for better accuracy, use `tiktoken`)
    const promptTokens = fullPrompt.split(/\s+/).length;
    const safeMax = Math.max(Math.min(maxLength, 2048 - promptTokens - 1), 1);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature,
        max_tokens: safeMax,
        top_p: 0.95,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from DeepSeek API");
    }

    const fullGeneratedText = data.choices[0].message.content;
    return fullGeneratedText.includes("Assistant:")
      ? fullGeneratedText.split("Assistant:")[1].trim()
      : fullGeneratedText.trim();
  } catch (error) {
    console.error("Text generation error:", error);
    return "Error generating response.";
  }
};

export default hf;
