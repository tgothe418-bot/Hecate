import { GoogleGenAI, Chat } from "@google/genai";
import { buildSystemInstruction } from "../knowledge";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = buildSystemInstruction();

class GeminiService {
  private chatSession: Chat | null = null;

  initChat() {
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH", 
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          }
        ]
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      this.initChat();
    }

    try {
      const response = await this.chatSession!.sendMessage({ message });
      return response.text || "I have nothing to say at this moment.";
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw new Error("Failed to communicate with the esoteric realms.");
    }
  }
}

export const geminiService = new GeminiService();
