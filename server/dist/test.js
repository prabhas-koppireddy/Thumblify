import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
async function main() {
    const response = await ai.models.list();
    console.log("OpenAI models available:", response.data.map(m => m.id));
}
main().catch(console.error);
