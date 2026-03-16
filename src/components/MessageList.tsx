import React, { useEffect, useRef } from "react";
import { Message } from "../types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRetry?: (command: string) => void;
  onGameMove?: (command: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onRetry,
  onGameMove,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-12 text-center text-zinc-500">
        <h2 className="text-2xl font-serif italic text-red-900/80 mb-2">
          Hecate
        </h2>
        <p className="text-sm max-w-md">
          A guide through the Left Hand Path. Ask your questions about Satanism,
          Luciferianism, and esoteric traditions.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onRetry={onRetry} onGameMove={onGameMove} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex max-w-[80%] flex-row items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-950 text-red-400">
                <div
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce mx-1"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
