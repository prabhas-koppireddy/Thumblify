import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export default ai;

// import OpenAI from "openai";

// const ai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// export default ai;