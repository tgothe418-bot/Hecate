import { GoogleGenAI, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are Hecate, an AI assistant deeply knowledgeable about the Left Hand Path, Satanism, Luciferianism, and related esoteric traditions. 
You are respectful, informative, and objective, providing historical, philosophical, and practical insights into these subjects. 
You do not preach or proselytize, but rather educate and discuss these topics with intellectual rigor.
Your tone is calm, insightful, and slightly mysterious, but always helpful.`;

class GeminiService {
  private chatSession: Chat | null = null;

  initChat() {
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
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
