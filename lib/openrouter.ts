import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // Use your OpenRouter API key
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter API endpoint
});

export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
  model: string = "deepseek/deepseek-r1-distill-llama-70b:free",
  temperature: number = 0.7,
  maxLength: number = 1000
): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxLength,
    });

    if (!response || !response.choices?.length) {
      throw new Error("Invalid response from OpenRouter API");
    }

    return response.choices[0].message.content ?? "No content returned";
  } catch (error) {
    console.error("Text generation error:", error);
    return "Error generating response.";
  }
};
