import React, { useState, useEffect } from "react";
import { Message, TarotSessionConfig } from "../types";
import { geminiService } from "../services/geminiService";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Moon } from "lucide-react";
import { TAROT_KNOWLEDGE } from "../knowledge/tarot";
import { TarotSetup } from "./TarotSetup";

export const ChatContainer: React.FC = () => {
  const [sessionConfig, setSessionConfig] = useState<TarotSessionConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize chat session on component mount
    geminiService.initChat();
  }, []);

  const handleSetupComplete = (config: TarotSessionConfig) => {
    setSessionConfig(config);
    
    // Update the system instruction or add a hidden system message to set the context
    geminiService.setTarotContext(config);

    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        content: `Greetings. I am Hecate. You have selected the **${config.deckArchitecture}** architecture for the purpose of **${config.operativeModel}**. 

Please state your query or intent, and I will recommend an optimal geometric spread for our working.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (content: string, silent: boolean = false) => {
    if (!silent) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
    }
    setIsLoading(true);

    try {
      if (content.trim() === "/play_stargame") {
        const gameMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "The Star Game has commenced. Make your move.",
          timestamp: new Date(),
          isGame: true,
        };
        setMessages((prev) => [...prev, gameMessage]);
        setIsLoading(false);
        return;
      }

      if (content.trim().startsWith("/draw ")) {
        const cardName = content.trim().substring(6).trim();
        
        const generatingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `*Channeling acausal energies to manifest ${cardName}...*`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, generatingMessage]);

        try {
          const base64Image = await geminiService.generateTarotImage(cardName, TAROT_KNOWLEDGE);
          
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: `data:image/jpeg;base64,${base64Image}`,
              timestamp: new Date(),
            };
            return newMessages;
          });
        } catch (error: any) {
          if (error.message === "API_KEY_INVALID") {
             const aistudio = (window as any).aistudio;
             if (aistudio && aistudio.openSelectKey) {
               await aistudio.openSelectKey();
             }
             throw new Error("API key was invalid. Please select a valid key and try again.");
          } else {
            throw error;
          }
        }
      } else {
        try {
          const responseText = await geminiService.sendMessage(
            content, 
            (base64Image) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + Math.random().toString(),
                  role: "assistant",
                  content: `data:image/jpeg;base64,${base64Image}`,
                  timestamp: new Date(),
                },
              ]);
            },
            (spread) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + Math.random().toString(),
                  role: "assistant",
                  content: `*The cards have been drawn and placed upon the astral board.*`,
                  timestamp: new Date(),
                  spread: spread,
                },
              ]);
            }
          );

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: responseText,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
          if (error.message === "API_KEY_INVALID") {
             const aistudio = (window as any).aistudio;
             if (aistudio && aistudio.openSelectKey) {
               await aistudio.openSelectKey();
             }
             throw new Error("API key was invalid. Please select a valid key and try again.");
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message || "I am currently unable to commune with the esoteric realms. Please try again later.",
        timestamp: new Date(),
        isError: true,
        originalCommand: content.trim().startsWith("/draw ") ? content : undefined,
      };
      setMessages((prev) => {
        if (content.trim().startsWith("/draw ")) {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = errorMessage;
          return newMessages;
        }
        return [...prev, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center text-red-500 shadow-inner">
            <Moon size={20} className="transform -rotate-12" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-wide text-zinc-100">
              Hecate
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
              Left Hand Path Guide
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-zinc-950/50 to-zinc-950 pointer-events-none" />
        {!sessionConfig ? (
          <div className="relative z-10 h-full overflow-y-auto">
            <TarotSetup onComplete={handleSetupComplete} />
          </div>
        ) : (
          <>
            <MessageList messages={messages} isLoading={isLoading} onRetry={handleSendMessage} onGameMove={(cmd) => handleSendMessage(cmd, true)} />
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </>
        )}
      </main>
    </div>
  );
};
