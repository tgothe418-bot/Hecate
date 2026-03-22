import { GoogleGenAI } from "@google/genai";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || "dummy";
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'A simple tarot card',
      config: {
        numberOfImages: 1,
        aspectRatio: "3:4",
        outputMimeType: "image/jpeg"
      }
    });
    console.log("3.0 Response:", JSON.stringify(response));
  } catch (e: any) {
    console.error("3.0 Error:", e.message);
  }
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A simple tarot card',
      config: {
        numberOfImages: 1,
        aspectRatio: "3:4",
        outputMimeType: "image/jpeg"
      }
    });
    console.log("4.0 Response:", JSON.stringify(response));
  } catch (e: any) {
    console.error("4.0 Error:", e.message);
  }
}
test();
