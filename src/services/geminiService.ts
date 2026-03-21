import { GoogleGenAI, Chat, Type, FunctionDeclaration, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { buildSystemInstruction } from "../knowledge";
import { StarGameEngine } from "../game/StarGame";
import { TAROT_KNOWLEDGE } from "../knowledge/tarot";
import { TarotSessionConfig } from "../types";

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getGameStateDeclaration: FunctionDeclaration = {
  name: "getGameState",
  description: "Get the current state of the Star Game, including all pieces and their 3D coordinates.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const movePieceDeclaration: FunctionDeclaration = {
  name: "movePiece",
  description: "Move a piece in the Star Game using 3D coordinates.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pieceId: {
        type: Type.STRING,
        description: "The ID of the piece to move (e.g., 'W-VEN-2-01').",
      },
      targetX: {
        type: Type.NUMBER,
        description: "The target X coordinate (1-9).",
      },
      targetY: {
        type: Type.NUMBER,
        description: "The target Y coordinate (1-9).",
      },
      targetZ: {
        type: Type.NUMBER,
        description: "The target Z coordinate (board level, 1-7).",
      },
    },
    required: ["pieceId", "targetX", "targetY", "targetZ"],
  },
};

const drawTarotCardDeclaration: FunctionDeclaration = {
  name: "drawTarotCard",
  description: "Draw a single tarot card and generate its image to show to the user. Use this for single card draws.",
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

const conductTarotReadingDeclaration: FunctionDeclaration = {
  name: "conductTarotReading",
  description: "Conduct a full tarot reading using a specific spread. Use this when the user asks for a reading or spread. The system will generate images for all cards and display them in the requested geometric layout.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      spreadType: {
        type: Type.STRING,
        description: "The type of spread to use ('Shadow Work', 'Hecate\\'s Crossroads', 'Psychological Webbing', or 'Linear').",
      },
      cards: {
        type: Type.ARRAY,
        description: "The cards drawn for the spread.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the tarot card (e.g., 'The Fool', 'Three of Swords').",
            },
            positionName: {
              type: Type.STRING,
              description: "The name of the position in the spread (e.g., 'Mask', 'Shadow', 'Significator').",
            },
            elementalDignity: {
              type: Type.STRING,
              description: "The elemental dignity of the card (e.g., 'Fire/Will', 'Water/Emotion').",
            },
            numerologicalEmanation: {
              type: Type.STRING,
              description: "The numerological emanation of the card.",
            },
            cardNumber: {
              type: Type.STRING,
              description: "The traditional number of the tarot card (e.g., '0', 'I', 'VIII', '10').",
            }
          },
          required: ["name", "positionName"]
        }
      }
    },
    required: ["spreadType", "cards"],
  },
};

class GeminiService {
  private chatSession: Chat | null = null;
  private starGameEngine: StarGameEngine;
  private tarotConfig: TarotSessionConfig | null = null;

  constructor() {
    this.starGameEngine = new StarGameEngine();
  }

  setTarotContext(config?: TarotSessionConfig) {
    this.tarotConfig = config;
    // Re-initialize chat with new context
    this.initChat();
  }

  initChat() {
    const systemInstruction = buildSystemInstruction(this.tarotConfig || undefined);
    
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        tools: [{ functionDeclarations: [getGameStateDeclaration, movePieceDeclaration, drawTarotCardDeclaration, conductTarotReadingDeclaration] }],
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

  async sendMessage(message: string, onImageGenerated?: (base64Image: string) => void, onSpreadGenerated?: (spread: any) => void): Promise<string> {
    if (!this.chatSession) {
      this.initChat();
    }

    try {
      let response = await this.chatSession!.sendMessage(message);
      
      // Handle function calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];
        for (const call of response.functionCalls) {
          if (call.name === "getGameState") {
            const state = this.starGameEngine.state;
            functionResponses.push({
              functionResponse: {
                name: "getGameState",
                response: state
              }
            });
          } else if (call.name === "movePiece") {
            const args = call.args as any;
            const success = this.starGameEngine.movePiece(
              args.pieceId,
              args.targetX,
              args.targetY,
              args.targetZ
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
          } else if (call.name === "conductTarotReading") {
            const args = call.args as any;
            try {
              // Generate images for all cards in parallel
              const cardsWithImages = await Promise.all(args.cards.map(async (card: any, index: number) => {
                const base64Image = await this.generateTarotImage(card.name, TAROT_KNOWLEDGE, card.cardNumber);
                return {
                  id: `card-${index}-${Date.now()}`,
                  name: card.name,
                  positionName: card.positionName,
                  elementalDignity: card.elementalDignity,
                  numerologicalEmanation: card.numerologicalEmanation,
                  base64Image,
                  isRevealed: false
                };
              }));

              const spread = {
                type: args.spreadType,
                cards: cardsWithImages
              };

              if (onSpreadGenerated) {
                onSpreadGenerated(spread);
              }

              functionResponses.push({
                functionResponse: {
                  name: "conductTarotReading",
                  response: { success: true, message: `Spread generated and displayed to the user.` }
                }
              });
            } catch (error: any) {
              if (error.message === "API_KEY_INVALID") {
                throw error;
              }
              functionResponses.push({
                functionResponse: {
                  name: "conductTarotReading",
                  response: { success: false, error: error.message }
                }
              });
            }
          } else {
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: "Unknown function call" }
              }
            });
          }
        }
        
        if (functionResponses.length === 0) {
          break;
        }
        
        response = await this.chatSession!.sendMessage(functionResponses);
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
  async generateTarotImage(cardName: string, esotericContext: string, cardNumber?: string, stylePrompt: string = "Highly detailed, esoteric tarot card art, mystical aesthetic, chiaroscuro lighting, symbolic"): Promise<string> {
    try {
      const numberPrompt = cardNumber ? ` Include the number '${cardNumber}' in a central location at the top of the card.` : ` Include the traditional card number in a central location at the top of the card.`;
      const fullPrompt = `Create tarot card art for '${cardName}'. Style: ${stylePrompt}. Include the title '${cardName}' elegantly rendered in the image.${numberPrompt}`;
      
      // Create a new instance to ensure it uses the latest API_KEY from the dialog
      const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

      const response = await imageAi.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: fullPrompt,
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data; // Base64 string
        }
      }
      console.error("No image generated. Response:", JSON.stringify(response, null, 2));
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
