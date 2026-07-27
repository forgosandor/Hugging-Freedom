import React, { useRef, useEffect, useState } from "react";
import { Send, CornerDownLeft, FileText, HelpCircle, Languages, Sparkles, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  disabled: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, isGenerating, disabled, onStop }: ChatInputProps) {
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

  const handleQuickAction = (actionType: "summarize" | "explain" | "translate") => {
    if (disabled || isGenerating) return;
    
    const currentText = text.trim();
    let newText = "";
    
    switch (actionType) {
      case "summarize":
        newText = currentText 
          ? `Kérlek, készíts egy tömör összefoglalót a következő szövegről:\n\n${currentText}` 
          : "Kérlek, foglald össze a következő szöveget: ";
        break;
      case "explain":
        newText = currentText 
          ? `Magyarázd el részletesen, egyszerűen és érthetően a következő témát/szöveget:\n\n${currentText}` 
          : "Magyarázd el egyszerűen a következőt: ";
        break;
      case "translate":
        newText = currentText 
          ? `Fordítsd le a következő szöveget kiváló minőségben magyarra (vagy angolra, ha magyar nyelvű):\n\n${currentText}` 
          : "Kérlek, fordítsd le a következőt: ";
        break;
    }
    
    setText(newText);
    
    // Focus the textarea after applying action
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const QUICK_ACTIONS = [
    { label: "Összegzés (Summarize)", type: "summarize" as const, icon: FileText, color: "text-blue-400 hover:bg-blue-500/10 border-blue-500/10" },
    { label: "Magyarázat (Explain)", type: "explain" as const, icon: HelpCircle, color: "text-purple-400 hover:bg-purple-500/10 border-purple-500/10" },
    { label: "Fordítás (Translate)", type: "translate" as const, icon: Languages, color: "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10" }
  ];

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#262626] bg-[#0A0A0A]/80 p-4 backdrop-blur-md space-y-3">
      {/* Floating shortcut menu / Quick Actions */}
      {!disabled && (
        <div className="flex flex-col gap-1.5 pb-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[#666666] font-semibold uppercase tracking-wider pl-1">
            <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
            <span>Gyors Műveletek (Módosítja a beírt szöveget küldés előtt)</span>
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-none">
            {QUICK_ACTIONS.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAction(action.type)}
                  disabled={isGenerating}
                  className={`text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] border hover:border-blue-500/30 text-gray-300 font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          {text.trim() && !isGenerating && (
            <span className="hidden sm:inline text-[10px] text-[#555555] font-mono flex items-center gap-0.5 mr-1">
              <span>Enter</span>
              <CornerDownLeft className="h-3 w-3" />
            </span>
          )}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 border border-rose-500/30 transition-all cursor-pointer animate-pulse"
              title="Generálás megszakítása"
            >
              <StopCircle className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!text.trim() || disabled}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl font-bold transition-all cursor-pointer ${
                text.trim() && !disabled
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                  : "bg-[#141414] text-[#444444]"
              }`}
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-[#444444] uppercase tracking-widest">
        Powered by Google Gemini & Hugging Face — Elegant Dark Theme
      </div>
    </form>
  );
}
