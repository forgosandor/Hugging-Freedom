import React, { useRef, useEffect, useState } from "react";
import { Sparkles, User, Copy, Check, Info, Bot, ArrowRight } from "lucide-react";
import { Message } from "../types";

interface ChatAreaProps {
  messages: Message[];
  isGenerating: boolean;
  activeModelName: string;
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    title: "Kreatív vers írása",
    prompt: "Írj egy rövid, rímes verset az AI-ról és az emberi gondolatok kapcsolatáról magyarul.",
    icon: "✍️"
  },
  {
    title: "Kvantumfizika egyszerűen",
    prompt: "Magyarázd el a kvantum-szuperpozíció fogalmát egy 10 évesnek érthető, mindennapi példákkal.",
    icon: "🔬"
  },
  {
    title: "Python programozás",
    prompt: "Írj egy egyszerű Python függvényt, ami ellenőrzi, hogy egy szó palindrom-e, magyarázó kommentekkel.",
    icon: "💻"
  }
];

export default function ChatArea({
  messages,
  isGenerating,
  activeModelName,
  onSuggestionClick
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Auto-scroll to bottom of chat when new messages or chunks arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Custom parser to format markdown (code blocks, bold text, lists) cleanly without massive packages
  const renderFormattedMessage = (content: string) => {
    if (!content) return null;

    // Split content by triple backticks for code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const firstLineBreak = part.indexOf("\n");
        let language = "code";
        let code = "";

        if (firstLineBreak !== -1) {
          language = part.slice(3, firstLineBreak).trim() || "code";
          code = part.slice(firstLineBreak + 1, -3).trim();
        } else {
          code = part.slice(3, -3).trim();
        }

        return (
          <div key={index} className="my-4 overflow-hidden rounded-xl border border-[#262626] bg-[#111111] text-[#E5E5E5] shadow-md">
            <div className="flex items-center justify-between bg-[#1A1A1A] px-4 py-2 text-xs font-mono text-[#888888] border-b border-[#262626]">
              <span className="uppercase">{language}</span>
              <button
                onClick={() => handleCopy(code, index * 100)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedIndex === index * 100 ? (
                  <>
                    <Check className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Másolva!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Másolás</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed select-all bg-[#0A0A0A] text-[#CCCCCC]">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format inline bold text **text** and standard newlines
      const inlineParts = part.split("\n").map((line, lineIdx) => {
        // Process line for simple bold styling
        const boldRegex = /\*\*(.*?)\*\*/g;
        const lineParts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            lineParts.push(line.substring(lastIndex, match.index));
          }
          lineParts.push(
            <strong key={match.index} className="font-semibold text-white">
              {match[1]}
            </strong>
          );
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < line.length) {
          lineParts.push(line.substring(lastIndex));
        }

        // Process lists starting with "- " or "* "
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const listContent = line.replace(/^[-*]\s+/, "");
          return (
            <li key={lineIdx} className="ml-4 list-disc text-sm leading-relaxed text-[#CCCCCC] my-1">
              {lineParts}
            </li>
          );
        }

        // Standard paragraph line
        return line.trim() ? (
          <p key={lineIdx} className="text-sm leading-relaxed text-[#CCCCCC] my-1">
            {lineParts}
          </p>
        ) : (
          <div key={lineIdx} className="h-2" />
        );
      });

      return <div key={index}>{inlineParts}</div>;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-1 py-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#111111] border border-[#262626] text-blue-500 shadow-xs mb-4">
            <Bot className="h-8 w-8 animate-bounce" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Kezdj el beszélgetni!
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-[#888888]">
            Válassz motort felül, és írd meg az első kérdésedet. Az alábbi minták közül is választhatsz az indításhoz:
          </p>

          {/* Prompt Suggestions */}
          <div className="mt-8 grid gap-3 w-full max-w-2xl sm:grid-cols-3">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(s.prompt)}
                className="flex flex-col justify-between items-start rounded-xl border border-[#262626] bg-[#141414] p-4 text-left shadow-2xs hover:border-blue-500/30 hover:bg-[#1A1A1A] hover:shadow-xs transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <span className="text-xl mb-2 block">{s.icon}</span>
                  <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {s.title}
                  </span>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#666666] line-clamp-3">
                    "{s.prompt}"
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 self-end text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Próba</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-4/5 ${
                  isUser ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`flex h-8.5 w-8.5 shrink-0 select-none items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                    isUser
                      ? "bg-[#1A1A1A] border border-[#262626] text-[#E5E5E5]"
                      : "bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  }`}
                >
                  {isUser ? <User className="h-4.5 w-4.5 text-[#888888]" /> : <Sparkles className="h-4.5 w-4.5" />}
                </div>

                {/* Message Bubble Container */}
                <div className="flex flex-col gap-1">
                  {/* Sender title */}
                  <span className={`text-[10px] font-semibold text-[#555555] px-1 ${
                    isUser ? "text-right" : "text-left"
                  }`}>
                    {isUser ? "Te" : activeModelName} • {m.timestamp}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`group relative rounded-2xl px-4 py-3 shadow-2xs ${
                      isUser
                        ? "bg-blue-600/10 border border-blue-500/20 text-white rounded-tr-xs"
                        : "bg-[#141414] border border-[#262626] text-[#CCCCCC] rounded-tl-xs"
                    }`}
                  >
                    {/* Render message body */}
                    <div className="break-words text-sm leading-relaxed">
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        renderFormattedMessage(m.content)
                      )}
                    </div>

                    {/* Quick message utilities */}
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className={`absolute right-2 top-2 rounded-lg bg-[#1D1D1D] border border-[#333333] p-1 text-[#888888] shadow-2xs hover:bg-[#252525] hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                        isUser ? "hidden" : "block"
                      }`}
                      title="Szöveg másolása"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active generation loading state */}
          {isGenerating && (
            <div className="flex gap-3.5 self-start max-w-4/5 animate-pulse">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Sparkles className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-[#555555] px-1">
                  {activeModelName} ír...
                </span>
                <div className="rounded-2xl rounded-tl-xs bg-[#141414] border border-[#262626] px-4 py-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
