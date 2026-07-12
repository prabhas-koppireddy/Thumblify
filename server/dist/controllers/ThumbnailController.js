import Thumbnail from "../models/Thumbnail.js";
import ai from "../configs/ai.js";
import { v2 as cloudinary } from "cloudinary";
const stylePrompts = {
    "Bold & Graphic": "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
    "Tech/Futuristic": "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
    Minimalist: "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
    Photorealistic: "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
    Illustrated: "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};
const colorSchemeDescriptions = {
    vibrant: "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
    sunset: "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
    forest: "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
    neon: "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
    purple: "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
    monochrome: "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
    ocean: "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
    pastel: "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};
export const generateThumbnail = async (req, res) => {
    try {
        const { userId } = req.session;
        const { title, prompt: user_prompt, style, aspect_ratio, color_scheme, text_overlay, } = req.body;
        const thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used: user_prompt,
            user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
            isGenerating: true,
        });
        let prompt = `Create a ${stylePrompts[style]} for: "${title}"`;
        if (color_scheme) {
            prompt += `Use a ${colorSchemeDescriptions[color_scheme]} color scheme.`;
        }
        if (user_prompt) {
            prompt += `Additional details: ${user_prompt}.`;
        }
        prompt += `The thumbnail should be ${aspect_ratio}, visually stunning, and designed to maximize click-through rate. Make it bold, professional, and impossible to ignore.`;
        const sizeMap = {
            "16:9": "1536x1024",
            "1:1": "1024x1024",
            "9:16": "1024x1536",
        };
        const size = sizeMap[aspect_ratio] || "1536x1024";
        // Respond immediately to the client so they can navigate and poll
        res.json({
            message: "Thumbnail Generation Started",
            thumbnail,
        });
        // Run the generation process in the background
        (async () => {
            try {
                // Generate the image using OpenAI gpt-image-1.5
                const response = await ai.images.generate({
                    model: "gpt-image-1.5",
                    prompt,
                    n: 1,
                    size: size,
                });
                const b64Data = response.data?.[0]?.b64_json;
                if (!b64Data) {
                    throw new Error("Failed to generate image from OpenAI");
                }
                // Upload the base64 string directly to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(`data:image/png;base64,${b64Data}`, {
                    resource_type: "image",
                });
                thumbnail.image_url = uploadResult.secure_url;
                thumbnail.isGenerating = false;
                await thumbnail.save();
            }
            catch (bgError) {
                console.error("Error generating thumbnail in background:", bgError);
                thumbnail.isGenerating = false;
                await thumbnail.save();
            }
        })();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
// Controllers For Thumbnail Deletion
export const deleteThumbnail = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.session;
        await Thumbnail.findByIdAndDelete({
            _id: id,
            userId,
        });
        res.json({
            message: "Thumbnail deleted successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
// Controller to proxy thumbnail downloading to bypass CORS/mixed-content restrictions
export const downloadThumbnail = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== "string") {
            return res.status(400).json({ message: "URL is required" });
        }
        // Validate that URL is a Cloudinary URL to prevent SSRF
        if (!url.startsWith("http://res.cloudinary.com") && !url.startsWith("https://res.cloudinary.com")) {
            return res.status(400).json({ message: "Invalid image URL" });
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "image/png";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="thumbnail.png"`);
        res.send(buffer);
    }
    catch (error) {
        console.error("Error downloading thumbnail:", error);
        res.status(500).json({ message: error.message || "Failed to download thumbnail" });
    }
};
