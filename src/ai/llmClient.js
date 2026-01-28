import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL || "openrouter/auto",
  temperature: 0.2,

  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:8080",
      "X-Title": "SAP-Payment-Validation-Agent"
    }
  }
});
