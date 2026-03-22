import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    console.log("Response keys:", Object.keys(response));
    if (response.generatedImages) {
      console.log("generatedImages length:", response.generatedImages.length);
      if (response.generatedImages.length > 0) {
        console.log("First image keys:", Object.keys(response.generatedImages[0]));
        if (response.generatedImages[0].image) {
          console.log("Image object keys:", Object.keys(response.generatedImages[0].image));
        }
      }
    } else {
      console.log("No generatedImages array. Full response:", JSON.stringify(response));
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
