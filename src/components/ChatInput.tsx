import React, { useRef, useEffect, useState } from "react";
import { Send, CornerDownLeft, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  disabled: boolean;
}

export default function ChatInput({ onSend, isGenerating, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea depending on text length
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isGenerating || disabled) return;
    onSend(text.trim());
    setText("");
    
    // Reset heights
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#262626] bg-[#0A0A0A]/80 p-4 backdrop-blur-md">
      <div className="relative flex items-end gap-2 rounded-2xl border border-[#333333] bg-[#1A1A1A] p-2.5 shadow-xs focus-within:border-blue-500/50 focus-within:ring-3 focus-within:ring-blue-500/10 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Szerver konfiguráció szükséges..." : "Írj egy üzenetet az AI-nak..."}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-1.5 pl-2 pr-12 text-sm text-white outline-hidden placeholder-[#555555] disabled:opacity-50 min-h-9 max-h-[140px]"
        />

        {/* Action Button */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          {text.trim() && (
            <span className="hidden sm:inline text-[10px] text-[#555555] font-mono flex items-center gap-0.5 mr-1">
              <span>Enter</span>
              <CornerDownLeft className="h-3 w-3" />
            </span>
          )}
          <button
            type="submit"
            disabled={!text.trim() || isGenerating || disabled}
            className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl font-bold transition-all cursor-pointer ${
              text.trim() && !isGenerating && !disabled
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                : "bg-[#141414] text-[#444444]"
            }`}
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-[#444444] uppercase tracking-widest">
        Powered by Google Gemini & Hugging Face — Elegant Dark Theme
      </div>
    </form>
  );
}
