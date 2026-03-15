import React from "react";
import { Message } from "../types";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-3`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-zinc-800 text-zinc-200" : "bg-red-950 text-red-400"}`}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        <div
          className={`px-4 py-3 rounded-2xl ${isUser ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" : "bg-zinc-900 text-zinc-300 rounded-tl-sm border border-red-900/30"}`}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
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
  );
};
