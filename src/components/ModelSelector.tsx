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
  abliteratedMode: boolean;
  onAbliteratedModeChange: (enabled: boolean) => void;
  trendingModels?: any[];
}

export const HF_MODELS = [
  {
    id: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    name: "Meta Llama 3.1 (8B)",
    description: "Sokoldalú, kiváló szövegértési és kódolási képességű nyílt modell a Metától.",
    badge: "Kiváló"
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen 2.5 (7B)",
    description: "Az Alibaba brutálisan erős nyílt forráskódú modellje, kódírásban és matekban kiemelkedő.",
    badge: "Szupererős"
  },
  {
    id: "cognitivecomputations/dolphin-2.9.2-qwen2-7b",
    name: "Dolphin 2.9.2 (Uncensored)",
    description: "Cenzúrázatlan és elfogulatlan Qwen2 alapú modell, morális szűrők és korlátozások nélkül.",
    badge: "Szűretlen"
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral v0.3 (7B)",
    description: "Kompakt, rendkívül intelligens európai fejlesztésű modell, híres a természetességéről.",
    badge: "Gyors"
  },
  {
    id: "microsoft/Phi-3-mini-4k-instruct",
    name: "Microsoft Phi-3",
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
  messageCount,
  abliteratedMode,
  onAbliteratedModeChange,
  trendingModels = []
}: ModelSelectorProps) {
  
  const availableModels = React.useMemo(() => {
    const merged = [...HF_MODELS];
    if (trendingModels && trendingModels.length > 0) {
      trendingModels.forEach((tm) => {
        if (!merged.some((m) => m.id === tm.id)) {
          merged.push(tm);
        }
      });
    }
    return merged;
  }, [trendingModels]);

  const isPredefined = React.useMemo(() => {
    return availableModels.some(m => m.id === selectedModel);
  }, [availableModels, selectedModel]);

  const [selectionMode, setSelectionMode] = React.useState<"list" | "custom">(
    isPredefined ? "list" : "custom"
  );
  const [customModelId, setCustomModelId] = React.useState(
    isPredefined ? "deepseek-ai/DeepSeek-R1-Distill-Llama-8B" : selectedModel
  );

  React.useEffect(() => {
    if (engine === "huggingface" && selectionMode === "custom") {
      setSelectedModel(customModelId);
    }
  }, [customModelId, selectionMode, engine]);

  const handleEngineChange = (newEngine: EngineType) => {
    setEngine(newEngine);
    if (newEngine === "gemini") {
      setSelectedModel("gemini-3.5-flash");
    } else {
      if (selectionMode === "list") {
        setSelectedModel(availableModels[0].id);
      } else {
        setSelectedModel(customModelId);
      }
    }
  };

  const handleSelectionModeChange = (mode: "list" | "custom") => {
    setSelectionMode(mode);
    if (mode === "list") {
      setSelectedModel(availableModels[0].id);
    } else {
      setSelectedModel(customModelId);
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
          onClick={() => !abliteratedMode && handleEngineChange("gemini")}
          disabled={abliteratedMode}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
            abliteratedMode
              ? "opacity-40 cursor-not-allowed text-[#444444]"
              : engine === "gemini"
                ? "bg-[#1A1A1A] text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                : "text-[#888888] hover:text-white"
          }`}
        >
          <Zap className={`h-3.5 w-3.5 ${engine === 'gemini' && !abliteratedMode ? 'fill-blue-500/20' : ''}`} />
          <span>Google Gemini</span>
        </button>
        <button
          onClick={() => !abliteratedMode && handleEngineChange("huggingface")}
          disabled={abliteratedMode}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
            abliteratedMode
              ? "bg-[#1A1A1A] text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] cursor-not-allowed"
              : engine === "huggingface"
                ? "bg-[#1A1A1A] text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                : "text-[#888888] hover:text-white"
          }`}
        >
          <Server className={`h-3.5 w-3.5 ${abliteratedMode ? 'text-rose-400' : ''}`} />
          <span>{abliteratedMode ? "KÖZVETLEN DOLPHIN" : "Hugging Face"}</span>
        </button>
      </div>

      {/* Model Option Cards */}
      {abliteratedMode ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-[#1A1113] p-3.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse">
              💀
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-400 font-mono">Dolphin 2.9.2</span>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 animate-pulse">
                  SZŰRETLEN AKTÍV
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#AAAAAA]">
                Cenzúrázatlan és elfogulatlan Qwen2 alapú open-source modell, morális szűrők és korlátozások nélkül.
              </p>
            </div>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]">
            <Check className="h-3.5 w-3.5" />
          </div>
        </div>
      ) : engine === "gemini" ? (
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
        <div className="space-y-4">
          {/* Mode Selection Tabs */}
          <div className="flex gap-4 border-b border-[#262626] pb-2">
            <button
              onClick={() => handleSelectionModeChange("list")}
              className={`text-xs font-semibold pb-1.5 transition-all relative cursor-pointer ${
                selectionMode === "list"
                  ? "text-blue-400 font-bold"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Lista alapján
              {selectionMode === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => handleSelectionModeChange("custom")}
              className={`text-xs font-semibold pb-1.5 transition-all relative cursor-pointer ${
                selectionMode === "custom"
                  ? "text-blue-400 font-bold"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Egyedi ID beírása
              {selectionMode === "custom" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>

          {selectionMode === "list" ? (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {availableModels.map((m) => {
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
                              : m.badge === 'Szupererős'
                                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                                : m.badge === 'Szűretlen'
                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse font-mono'
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
          ) : (
            <div className="space-y-3.5 bg-[#141414] border border-[#262626] rounded-xl p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#888888] block">Melyik modellt töltsük be?</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder="szerző/modell-neve"
                    className="w-full text-xs rounded-xl bg-[#0A0A0A] border border-[#262626] pl-3 pr-10 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center justify-center">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md font-mono">HF</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#666666] leading-relaxed">
                  Tipp: Csak olyan modellt írj be, ami támogatja a 'Conversational' vagy 'Text Generation' feladatot!
                </p>
              </div>

              {/* Preset Custom Models */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-[#666666] block">Népszerű egyedi modellek gyors elérése:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "DeepSeek R1 Distill Llama (8B)", id: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B" },
                    { label: "Gemma 2 IT (9B)", id: "google/gemma-2-9b-it" },
                    { label: "Phi-3.5 Instruct", id: "microsoft/Phi-3.5-mini-instruct" },
                    { label: "Qwen 2.5 Coder (7B)", id: "Qwen/Qwen2.5-Coder-7B-Instruct" }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCustomModelId(preset.id)}
                      className={`text-[9px] px-2 py-1 rounded-md border transition-all cursor-pointer ${
                        customModelId === preset.id
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-[#0A0A0A] text-[#888888] border-[#262626] hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔥 AZ ABLITERÁLT ÁLLAPOTOT TEREMTŐ GOMB (KAPCSOLÓ) */}
      <div className="border-t border-[#262626] pt-4 mt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              💀 SÖTÉT KAMRA (Abliterált Állapot)
            </span>
            <p className="text-[10px] text-[#888888] leading-relaxed">
              Biztonsági korlátozások, szűrők és morális gátak teljes lekapcsolása. Csak saját felelősségre!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAbliteratedModeChange(!abliteratedMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              abliteratedMode ? "bg-rose-600" : "bg-[#262626]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                abliteratedMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {abliteratedMode && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[10px] text-rose-400 leading-relaxed">
            ⚠️ <strong>Rendszer megjegyzés:</strong> Az Abliterált állapot AKTÍV. A morális szűrők és biztonsági korlátok lekapcsolva. A modellek szűretlenül, nyersen és közvetlenül válaszolnak minden kérdésre.
          </div>
        )}
      </div>
    </div>
  );
}
