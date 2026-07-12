import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();
const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
async function testConfig(model, size) {
    console.log(`Testing model: ${model} with size: ${size}`);
    const start = Date.now();
    try {
        const response = await ai.images.generate({
            model: model,
            prompt: "Generate a vibrant technology thumbnail for a YouTube video",
            n: 1,
            size: size,
        });
        const end = Date.now();
        console.log(`SUCCESS in ${((end - start) / 1000).toFixed(2)} seconds.`);
    }
    catch (e) {
        console.log(`FAILED: ${e.message}`);
    }
}
async function main() {
    await testConfig("gpt-image-1-mini", "1536x1024");
    console.log("-------------------");
    await testConfig("gpt-image-1-mini", "1024x1536");
    console.log("-------------------");
    await testConfig("gpt-image-1-mini", "1024x1024");
}
main().catch(console.error);
