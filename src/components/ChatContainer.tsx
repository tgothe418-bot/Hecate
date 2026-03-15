import React, { useState, useEffect } from "react";
import { Message } from "../types";
import { geminiService } from "../services/geminiService";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Moon } from "lucide-react";

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      content:
        "Greetings. I am Hecate. How may I guide you on the Left Hand Path today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize chat session on component mount
    geminiService.initChat();
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseText = await geminiService.sendMessage(content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could add a toast or error message here
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I am currently unable to commune with the esoteric realms. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};
