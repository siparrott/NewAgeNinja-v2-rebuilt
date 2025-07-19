// LLM runner for the agent system
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runLLM(messages: any[], tools?: any[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools: tools?.length ? tools : undefined,
      temperature: 0.1,
      max_tokens: 1500,
    });

    return completion;
  } catch (error) {
    console.error("LLM execution error:", error);
    throw error;
  }
}