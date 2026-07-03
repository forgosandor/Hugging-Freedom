import React from "react";
import { Cpu, Server, Check, ArrowRight, Zap, Info } from "lucide-react";
import { EngineType } from "../types";

interface ModelSelectorProps {
  engine: EngineType;
  setEngine: (engine: EngineType) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onClearChat: () => void;
  messageCount: number;
}

export const HF_MODELS = [
  {
    id: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    name: "Meta Llama 3.1 (8B)",
    description: "Sokoldalú, kiváló szövegértési és kódolási képességű nyílt modell a Metától.",
    badge: "Kiváló"
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral v0.3 (7B)",
    description: "Kompakt, rendkívül intelligens európai fejlesztésű modell, híres a természetességéről.",
    badge: "Gyors"
  },
  {
    id: "microsoft/Phi-3-mini-4k-instruct",
    name: "Microsoft Phi-3 (Gyors)",
    description: "Könnyűsúlyú, rendkívül gyors és mobil-optimalizált mini modell.",
    badge: "Villámgyors"
  }
];

export default function ModelSelector({
  engine,
  setEngine,
  selectedModel,
  setSelectedModel,
  onClearChat,
  messageCount
}: ModelSelectorProps) {
  
  const handleEngineChange = (newEngine: EngineType) => {
    setEngine(newEngine);
    if (newEngine === "gemini") {
      setSelectedModel("gemini-3.5-flash");
    } else {
      setSelectedModel(HF_MODELS[0].id);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#262626] bg-[#111111] p-4 shadow-xs md:p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Cpu className="h-4.5 w-4.5 text-blue-500" />
          <span>AI Modell Választás</span>
        </h2>
        {messageCount > 0 && (
          <button
            onClick={onClearChat}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            Beszélgetés törlése ({messageCount})
          </button>
        )}
      </div>

      {/* Engine Selection Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0A0A0A] p-1 border border-[#262626]">
        <button
          onClick={() => handleEngineChange("gemini")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
            engine === "gemini"
              ? "bg-[#1A1A1A] text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Zap className={`h-3.5 w-3.5 ${engine === 'gemini' ? 'fill-blue-500/20' : ''}`} />
          <span>Google Gemini (Ajánlott)</span>
        </button>
        <button
          onClick={() => handleEngineChange("huggingface")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
            engine === "huggingface"
              ? "bg-[#1A1A1A] text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          <span>Hugging Face Modellek</span>
        </button>
      </div>

      {/* Model Option Cards */}
      {engine === "gemini" ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-[#1A1A1A] p-3.5 transition-all shadow-[0_0_12px_rgba(59,130,246,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Gemini 3.5 Flash</span>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                  Stabil & Gyors
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#888888]">
                A legújabb generációs, nagy sebességű és megbízható modellünk.
              </p>
            </div>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            <Check className="h-3.5 w-3.5" />
          </div>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-3">
          {HF_MODELS.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all hover:shadow-xs cursor-pointer ${
                  isSelected
                    ? "border-blue-500/40 bg-[#1A1A1A] text-white ring-2 ring-blue-500/10"
                    : "border-[#262626] bg-[#141414] text-[#AAAAAA] hover:bg-[#1A1A1A] hover:border-[#333333]"
                }`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#CCCCCC]'}`}>{m.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold shrink-0 ${
                      m.badge === 'Villámgyors' 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                        : m.badge === 'Gyors' 
                          ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                          : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                    }`}>
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#666666]">
                    {m.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-2 self-end flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_0_6px_rgba(59,130,246,0.4)]">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
