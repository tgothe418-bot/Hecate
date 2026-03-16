import React, { useState } from "react";
import { Message } from "../types";
import { Bot, User, RefreshCw, Maximize2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
  onRetry?: (command: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === "user";
  const isImage = message.content.startsWith("data:image/");

  return (
    <>
      <div
        className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-3`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-zinc-800 text-zinc-200" : message.isError ? "bg-red-900 text-red-100" : "bg-red-950 text-red-400"}`}
          >
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
          <div
            className={`px-4 py-3 rounded-2xl ${isUser ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" : message.isError ? "bg-red-950/50 text-red-200 rounded-tl-sm border border-red-900/50" : "bg-zinc-900 text-zinc-300 rounded-tl-sm border border-red-900/30"}`}
          >
            {isImage ? (
              <div className="relative group">
                <img 
                  src={message.content} 
                  alt="Generated Tarot Card" 
                  className="max-w-sm rounded-lg shadow-md border border-red-900/50 cursor-pointer transition-transform hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  onClick={() => setIsExpanded(true)}
                />
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  aria-label="Expand image"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
            {message.isError && message.originalCommand && onRetry && (
              <button
                onClick={() => onRetry(message.originalCommand!)}
                className="mt-3 flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors bg-red-900/20 px-3 py-1.5 rounded-full border border-red-900/30"
              >
                <RefreshCw size={12} />
                Retry Manifestation
              </button>
            )}
            <div
              className={`text-[10px] mt-2 opacity-50 ${isUser ? "text-right" : "text-left"}`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isExpanded && isImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsExpanded(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={message.content} 
            alt="Expanded Tarot Card" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
