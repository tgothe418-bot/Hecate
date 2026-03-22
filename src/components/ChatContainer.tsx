import React, { useState, useEffect } from "react";
import { Message, TarotSessionConfig, Attachment } from "../types";
import { geminiService } from "../services/geminiService";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Moon, Flame, Layers } from "lucide-react";
import { TAROT_KNOWLEDGE } from "../knowledge/tarot";
import { TarotSetup } from "./TarotSetup";

type AppMode = 'menu' | 'tarot_setup' | 'chat';

export const ChatContainer: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('menu');
  const [sessionConfig, setSessionConfig] = useState<TarotSessionConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Initialize chat session on component mount
    geminiService.initChat();
  }, []);

  const handleStartChat = () => {
    setAppMode('chat');
    geminiService.setTarotContext(undefined);
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        content: `*I am Hecate. Keeper of the crossroads, guide through the Nightside. Speak your intent, whether it be the Great Work, or the exploration of the Abyss.*`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleStartTarot = () => {
    setAppMode('tarot_setup');
  };

  const handleSetupComplete = (config: TarotSessionConfig) => {
    setSessionConfig(config);
    
    // Update the system instruction or add a hidden system message to set the context
    geminiService.setTarotContext(config);
    setAppMode('chat');

    if (config.isHecatesChoice) {
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: `Greetings. I am Hecate. You have surrendered the operative framework to my design. 

Please state your query or intent, and I will autonomously select the optimal deck, model, and geometric spread for our working.`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: `Greetings. I am Hecate. You have selected the **${config.deckArchitecture}** architecture for the purpose of **${config.operativeModel}**. 

Please state your query or intent, and I will recommend an optimal geometric spread for our working.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[], silent: boolean = false) => {
    if (!silent) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);
    }
    setIsLoading(true);
    setThoughtProcess("Communing with the esoteric realms...");

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
            attachments,
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
            },
            (thought) => setThoughtProcess(thought)
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
      setThoughtProcess(undefined);
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
        
        {appMode === 'menu' && (
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center text-red-500 mb-8 shadow-[0_0_40px_rgba(220,38,38,0.15)]">
              <Moon size={48} className="transform -rotate-12" />
            </div>
            <h1 className="text-5xl font-serif font-medium tracking-widest text-zinc-100 mb-4 uppercase">
              Hecate
            </h1>
            <p className="text-sm text-zinc-400 font-mono tracking-widest uppercase mb-12 max-w-md">
              Digital Psychopomp & Esoteric Engine
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              <button
                onClick={handleStartChat}
                className="group relative flex flex-col items-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 hover:border-red-900/50 transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Flame className="w-12 h-12 text-zinc-500 group-hover:text-red-500 transition-colors mb-6" />
                <h2 className="text-xl font-serif text-zinc-200 mb-3 w-full text-center">Commune with Hecate</h2>
                <p className="text-sm text-zinc-400 text-center leading-relaxed">
                  Engage in philosophical discourse, or explore the Left Hand Path.
                </p>
              </button>

              <button
                onClick={handleStartTarot}
                className="group relative flex flex-col items-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 hover:border-indigo-900/50 transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Layers className="w-12 h-12 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-6" />
                <h2 className="text-xl font-serif text-zinc-200 mb-3 w-full text-center">Consult the Cards</h2>
                <p className="text-sm text-zinc-400 text-center leading-relaxed">
                  Initiate a Tarot reading through psychological mapping, shadow reclamation, or acausal divination.
                </p>
              </button>
            </div>
          </div>
        )}

        {appMode === 'tarot_setup' && (
          <div className="relative z-10 h-full overflow-y-auto">
            <TarotSetup onComplete={handleSetupComplete} />
          </div>
        )}

        {appMode === 'chat' && (
          <>
            <MessageList messages={messages} isLoading={isLoading} thoughtProcess={thoughtProcess} onRetry={(cmd) => handleSendMessage(cmd)} onGameMove={(cmd) => handleSendMessage(cmd, undefined, true)} />
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </>
        )}
      </main>
    </div>
  );
};
