import { GoogleGenAI, Chat, Type, FunctionDeclaration, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { buildSystemInstruction } from "../knowledge";
import { StarGameEngine } from "../game/StarGame";
import { TAROT_KNOWLEDGE } from "../knowledge/tarot";
import { TarotSessionConfig, Attachment } from "../types";

import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// Initialize the Google Gen AI SDK safely for Vite environments
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || process.env.API_KEY;
  }
  return undefined;
};
const ai = new GoogleGenAI({ apiKey: getApiKey() });

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

const extractImageFromPdfDeclaration: FunctionDeclaration = {
  name: "extractImageFromPdf",
  description: "When a PDF is uploaded, scan its content for visual references and illustrations. For each relevant illustration found, call this tool with the corresponding page number to extract and display it within the response. Do not generate new artwork.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pageNumber: {
        type: Type.NUMBER,
        description: "The page number of the PDF to extract as an image (1-indexed).",
      },
    },
    required: ["pageNumber"],
  },
};

class GeminiService {
  private chatSession: Chat | null = null;
  private starGameEngine: StarGameEngine;
  private tarotConfig: TarotSessionConfig | null = null;

  private lastUploadedPdf: string | null = null;

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
        tools: [{ functionDeclarations: [getGameStateDeclaration, movePieceDeclaration, drawTarotCardDeclaration, conductTarotReadingDeclaration, extractImageFromPdfDeclaration] }],
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

  async sendMessage(
    message: string, 
    attachments?: Attachment[], 
    onImageGenerated?: (base64Image: string) => void, 
    onSpreadGenerated?: (spread: any) => void,
    onThought?: (thought: string) => void
  ): Promise<string> {
    if (!this.chatSession) {
      this.initChat();
    }

    try {
      let contentParts: any[] = [];
      if (message) {
        contentParts.push({ text: message });
      }
      if (attachments && attachments.length > 0) {
        attachments.forEach(att => {
          if (att.mimeType === 'application/pdf') {
            this.lastUploadedPdf = att.data;
          }
          contentParts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType
            }
          });
        });
      }

      if (contentParts.length === 0) return "I have nothing to say at this moment.";

      let response = await this.chatSession!.sendMessage({ message: contentParts as any });
      
      // Handle function calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];
        for (const call of response.functionCalls) {
          if (call.name === "getGameState") {
            if (onThought) onThought("Analyzing the Star Game state...");
            const state = this.starGameEngine.state;
            functionResponses.push({
              functionResponse: {
                name: "getGameState",
                response: state
              }
            });
          } else if (call.name === "movePiece") {
            const args = call.args as any;
            if (onThought) onThought(`Moving piece ${args.pieceId}...`);
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
            if (onThought) onThought(`Drawing tarot card: ${args.cardName}...`);
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
            if (onThought) onThought(`Conducting ${args.spreadType} reading...`);
            try {
              // Generate images sequentially to avoid 429 Rate Limit errors
              const cardsWithImages = [];
              for (let index = 0; index < args.cards.length; index++) {
                const card = args.cards[index];
                const base64Image = await this.generateTarotImage(card.name, TAROT_KNOWLEDGE, card.cardNumber);
                cardsWithImages.push({
                  id: `card-${index}-${Date.now()}`,
                  name: card.name,
                  positionName: card.positionName,
                  elementalDignity: card.elementalDignity,
                  numerologicalEmanation: card.numerologicalEmanation,
                  base64Image,
                  isRevealed: false
                });
              }

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
          } else if (call.name === "extractImageFromPdf") {
            const args = call.args as any;
            if (onThought) onThought(`Extracting page ${args.pageNumber} from PDF...`);
            try {
              const base64Image = await this.extractImageFromPdf(args.pageNumber);
              if (onImageGenerated) {
                onImageGenerated(base64Image);
              }
              functionResponses.push({
                functionResponse: {
                  name: "extractImageFromPdf",
                  response: { success: true, message: `Image of page ${args.pageNumber} successfully extracted and shown to the user.` }
                }
              });
            } catch (error: any) {
              functionResponses.push({
                functionResponse: {
                  name: "extractImageFromPdf",
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
        
        response = await this.chatSession!.sendMessage({ message: functionResponses as any });
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
      
      const imageAi = new GoogleGenAI({ apiKey: getApiKey() });

      const response = await imageAi.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "3:4",
          outputMimeType: "image/jpeg",
          personGeneration: "ALLOW_ADULT",
          safetyFilterLevel: "BLOCK_ONLY_HIGH"
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
      }
      
      throw new Error(`No image generated. Response: ${JSON.stringify(response)}`);
    } catch (error: any) {
      console.error("Error generating Tarot image:", error);
      // Only flag invalid keys for actual authentication errors, not 404s
      if (error.status === 401 || (error.message && error.message.includes("API key"))) {
        throw new Error("API_KEY_INVALID");
      }
      throw new Error(`Failed to materialize the visual archetype: ${error.message}`);
    }
  }

  async extractImageFromPdf(pageNumber: number): Promise<string> {
    if (!this.lastUploadedPdf) {
      throw new Error("No PDF has been uploaded.");
    }
    
    try {
      const pdfData = atob(this.lastUploadedPdf);
      const uint8Array = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        uint8Array[i] = pdfData.charCodeAt(i);
      }

      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Invalid page number. The PDF has ${pdf.numPages} pages.`);
      }

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 }); // High resolution

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error("Could not create canvas context");
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      return dataUrl.split(',')[1]; // Return base64 part
    } catch (error: any) {
      console.error("Error extracting image from PDF:", error);
      throw new Error(`Failed to extract image from PDF: ${error.message}`);
    }
  }

  public getStarGameEngine(): StarGameEngine {
    return this.starGameEngine;
  }
}

export const geminiService = new GeminiService();
