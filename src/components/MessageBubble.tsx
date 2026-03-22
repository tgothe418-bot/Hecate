import React, { useState } from "react";
import { Message } from "../types";
import { Bot, User, RefreshCw, Maximize2, X, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StarGameBoard } from "./StarGameBoard";
import { geminiService } from "../services/geminiService";
import { SpreadBoard } from "./SpreadBoard";

interface MessageBubbleProps {
  message: Message;
  onRetry?: (command: string) => void;
  onGameMove?: (command: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry, onGameMove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const isUser = message.role === "user";
  const isImage = message.content.startsWith("data:image/");

  return (
    <>
      <div
        className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex ${message.isGame || message.spread ? "max-w-[95%] w-full" : "max-w-[80%]"} ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-3`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-zinc-800 text-zinc-200" : message.isError ? "bg-red-900 text-red-100" : "bg-red-950 text-red-400"}`}
          >
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
          <div
            className={`px-4 py-3 rounded-2xl ${isUser ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" : message.isError ? "bg-red-950/50 text-red-200 rounded-tl-sm border border-red-900/50" : "bg-zinc-900 text-zinc-300 rounded-tl-sm border border-red-900/30"} ${message.isGame || message.spread ? "w-full" : ""}`}
          >
            {isImage ? (
              <div className="relative group">
                <img 
                  src={message.content} 
                  alt="Generated Tarot Card" 
                  className="max-w-sm rounded-lg shadow-md border border-red-900/50 cursor-pointer transition-transform hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  onClick={() => {
                    setExpandedImage(message.content);
                    setIsExpanded(true);
                  }}
                />
                <button 
                  onClick={() => {
                    setExpandedImage(message.content);
                    setIsExpanded(true);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  aria-label="Expand image"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            ) : message.isGame ? (
              <div className="flex flex-col gap-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <StarGameBoard 
                  engine={geminiService.getStarGameEngine()} 
                  onMove={(cmd) => onGameMove && onGameMove(cmd)} 
                />
              </div>
            ) : message.spread ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <SpreadBoard spread={message.spread} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.attachments.map((att, i) => (
                      <div key={i} className="relative group">
                        {att.mimeType.startsWith('image/') ? (
                          <img 
                            src={`data:${att.mimeType};base64,${att.data}`} 
                            alt={att.name} 
                            className="max-w-[200px] max-h-[200px] object-cover rounded-lg shadow-md border border-zinc-700 cursor-pointer transition-transform hover:scale-[1.02]"
                            onClick={() => {
                              setExpandedImage(`data:${att.mimeType};base64,${att.data}`);
                              setIsExpanded(true);
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-md p-3">
                            <FileText size={24} className="text-zinc-400" />
                            <span className="text-sm text-zinc-300 truncate max-w-[150px]">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.content && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
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
      {isExpanded && expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => {
            setIsExpanded(false);
            setExpandedImage(null);
          }}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
              setExpandedImage(null);
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={expandedImage} 
            alt="Expanded Image" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
