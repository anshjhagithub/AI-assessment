import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export const llm = new ChatOpenAI({
  modelName: process.env.OPENROUTER_MODEL,
  temperature: 0.2,
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});
