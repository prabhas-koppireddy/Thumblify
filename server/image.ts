import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image",
    contents: ["Generate a red sports car"],
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  console.log(response);
}

main().catch(console.error);