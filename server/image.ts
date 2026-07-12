import { OpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function main() {
  const response = await ai.images.generate({
    model: "gpt-image-2",
    prompt: "Generate a red sports car",
    n: 1,
    size: "1024x1024",
  });

  console.log(response);
}

main().catch(console.error);