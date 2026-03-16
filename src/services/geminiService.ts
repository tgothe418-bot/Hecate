import { GoogleGenAI, Chat, Type, FunctionDeclaration, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { buildSystemInstruction } from "../knowledge";
import { StarGameEngine, BoardName } from "../game/StarGame";
import { TAROT_KNOWLEDGE } from "../knowledge/tarot";

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = buildSystemInstruction();

const getBoardStateDeclaration: FunctionDeclaration = {
  name: "getBoardState",
  description: "Get the current state of a specific board in the Star Game.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      boardName: {
        type: Type.STRING,
        description: "The name of the board (Sirius, Arcturus, Antares, Mira, Rigel, Deneb, Naos)",
      },
    },
    required: ["boardName"],
  },
};

const movePieceDeclaration: FunctionDeclaration = {
  name: "movePiece",
  description: "Move a piece in the Star Game.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fromBoard: {
        type: Type.STRING,
        description: "The name of the board the piece is currently on.",
      },
      fromSquare: {
        type: Type.STRING,
        description: "The ID of the square the piece is currently on (e.g., A1, B2).",
      },
      toBoard: {
        type: Type.STRING,
        description: "The name of the board to move the piece to.",
      },
      toSquare: {
        type: Type.STRING,
        description: "The ID of the square to move the piece to.",
      },
    },
    required: ["fromBoard", "fromSquare", "toBoard", "toSquare"],
  },
};

const drawTarotCardDeclaration: FunctionDeclaration = {
  name: "drawTarotCard",
  description: "Draw a tarot card and generate its image to show to the user. ALWAYS use this when conducting a tarot reading to visually manifest each card one at a time.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      cardName: {
        type: Type.STRING,
        description: "The name of the tarot card to draw (e.g., 'The Fool', 'Three of Swords').",
      },
      cardNumber: {
        type: Type.STRING,
        description: "The traditional number of the tarot card (e.g., '0', 'I', 'VIII', '10').",
      },
    },
    required: ["cardName"],
  },
};

class GeminiService {
  private chatSession: Chat | null = null;
  private starGameEngine: StarGameEngine;

  constructor() {
    this.starGameEngine = new StarGameEngine();
  }

  initChat() {
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        tools: [{ functionDeclarations: [getBoardStateDeclaration, movePieceDeclaration, drawTarotCardDeclaration] }],
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH, 
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          }
        ]
      },
    });
  }

  async sendMessage(message: string, onImageGenerated?: (base64Image: string) => void): Promise<string> {
    if (!this.chatSession) {
      this.initChat();
    }

    try {
      let response = await this.chatSession!.sendMessage({ message });
      
      // Handle function calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];
        for (const call of response.functionCalls) {
          if (call.name === "getBoardState") {
            const args = call.args as any;
            const state = this.starGameEngine.getBoardState(args.boardName as BoardName);
            functionResponses.push({
              functionResponse: {
                name: "getBoardState",
                response: state || { error: "Board not found" }
              }
            });
          } else if (call.name === "movePiece") {
            const args = call.args as any;
            const success = this.starGameEngine.movePiece(
              args.fromBoard as BoardName,
              args.fromSquare,
              args.toBoard as BoardName,
              args.toSquare
            );
            functionResponses.push({
              functionResponse: {
                name: "movePiece",
                response: { success, message: success ? "Move successful. Metamorphosis applied." : "Invalid move." }
              }
            });
          } else if (call.name === "drawTarotCard") {
            const args = call.args as any;
            try {
              const base64Image = await this.generateTarotImage(args.cardName, TAROT_KNOWLEDGE, args.cardNumber);
              if (onImageGenerated) {
                onImageGenerated(base64Image);
              }
              functionResponses.push({
                functionResponse: {
                  name: "drawTarotCard",
                  response: { success: true, message: `Image of ${args.cardName} successfully generated and shown to the user.` }
                }
              });
            } catch (error: any) {
              if (error.message === "API_KEY_INVALID") {
                throw error;
              }
              functionResponses.push({
                functionResponse: {
                  name: "drawTarotCard",
                  response: { success: false, error: error.message }
                }
              });
            }
          }
        }
        
        response = await this.chatSession!.sendMessage({
          message: functionResponses as any
        });
      }

      return response.text || "I have nothing to say at this moment.";
    } catch (error: any) {
      console.error("Error sending message to Gemini:", error);
      if (error.message === "API_KEY_INVALID") {
        throw error;
      }
      throw new Error("Failed to communicate with the esoteric realms.");
    }
  }

  /**
   * Integrates 'Nano Banana 2' (gemini-3.1-flash-image-preview) for Tarot Card Art Generation
   * Utilizes a 3:4 aspect ratio standard for Tarot cards.
   */
  async generateTarotImage(cardName: string, esotericContext: string, cardNumber?: string, stylePrompt: string = "Dark esoteric, highly detailed, occult tarot card art, sinister aesthetic, chiaroscuro lighting, mystical symbols"): Promise<string> {
    try {
      const numberPrompt = cardNumber ? ` Include the number '${cardNumber}' in a central location at the top of the card.` : ` Include the traditional card number in a central location at the top of the card.`;
      const fullPrompt = `Create tarot card art for '${cardName}'. Context: ${esotericContext}. Style: ${stylePrompt}. Include the title '${cardName}' elegantly rendered in the image.${numberPrompt}`;
      
      // Create a new instance to ensure it uses the latest API_KEY from the dialog
      const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

      const response = await imageAi.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { text: fullPrompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "2K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data; // Base64 string
        }
      }
      throw new Error("No image generated.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
        throw new Error("API_KEY_INVALID");
      }
      console.error("Error generating Tarot image:", error);
      throw new Error("Failed to materialize the visual archetype.");
    }
  }
  public getStarGameEngine(): StarGameEngine {
    return this.starGameEngine;
  }
}

export const geminiService = new GeminiService();
