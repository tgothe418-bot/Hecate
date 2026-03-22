import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { Attachment } from "../types";

interface MessageInputProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/') || item.type === 'application/pdf') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setAttachments(prev => [...prev, {
              data: base64String,
              mimeType: file.type,
              name: file.name || `pasted-${Date.now()}`
            }]);
          };
          reader.readAsDataURL(file);
        });
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setAttachments(prev => [...prev, {
            data: base64String,
            mimeType: file.type,
            name: file.name || `pasted-${Date.now()}`
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          data: base64String,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="max-w-4xl mx-auto w-full flex flex-wrap gap-2 px-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-md p-2 pr-8">
              {att.mimeType.startsWith('image/') ? (
                <img src={`data:${att.mimeType};base64,${att.data}`} alt={att.name} className="w-8 h-8 object-cover rounded" />
              ) : (
                <FileText size={24} className="text-zinc-400" />
              )}
              <span className="text-xs text-zinc-300 truncate max-w-[150px]">{att.name}</span>
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute right-1 top-1 p-1 text-zinc-500 hover:text-red-400 transition-colors"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="max-w-4xl mx-auto w-full flex items-center gap-2">
        <input 
          type="file" 
          multiple 
          accept="image/*,application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-3 rounded-full text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 transition-colors"
          title="Attach artwork or PDF"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Speak to Hecate..."
          disabled={isLoading}
          className="flex-1 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-900/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="p-3 rounded-full bg-red-950 text-red-400 hover:bg-red-900 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
