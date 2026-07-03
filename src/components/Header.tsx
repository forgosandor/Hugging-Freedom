import React from "react";
import { Sparkles, BrainCircuit, Activity, Cpu } from "lucide-react";
import { ConfigStatus, EngineType } from "../types";

interface HeaderProps {
  config: ConfigStatus;
  activeEngine: EngineType;
  isLoadingConfig: boolean;
}

export default function Header({ config, activeEngine, isLoadingConfig }: HeaderProps) {
  return (
    <header className="border-b border-[#262626] bg-[#0A0A0A]/80 pb-6 pt-6 backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/10">
            <Cpu className="h-6 w-6 animate-pulse" />
            <div className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-[#0A0A0A]">
              AI
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Univerzális Ingyenes AI Chat
            </h1>
            <p className="text-xs text-[#888888] sm:text-sm font-medium">
              Próbáld ki a legújabb open-source modelleket és a Gemini Flash-t teljesen ingyen!
            </p>
          </div>
        </div>

        {/* API key statuses */}
        <div className="flex flex-wrap gap-2 sm:self-center">
          {isLoadingConfig ? (
            <div className="h-6 w-32 animate-pulse rounded-full bg-[#1A1A1A]" />
          ) : (
            <>
              <div className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1 text-xs font-medium text-[#CCCCCC] shadow-2xs">
                <span className={`h-2 w-2 rounded-full ${config.hasGeminiKey ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-rose-500'}`} />
                <span>Gemini API:</span>
                <span className={config.hasGeminiKey ? 'text-blue-400' : 'text-rose-400 font-bold'}>
                  {config.hasGeminiKey ? 'Aktív' : 'Hiányzik'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1 text-xs font-medium text-[#CCCCCC] shadow-2xs">
                <span className={`h-2 w-2 rounded-full ${config.hasHfToken ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>Hugging Face:</span>
                <span className={config.hasHfToken ? 'text-green-400' : 'text-amber-400'}>
                  {config.hasHfToken ? 'Token Betöltve' : 'Szerveres limit'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Engine specific informative note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#262626] bg-[#111111] p-3.5 text-xs text-[#CCCCCC]">
        {activeEngine === "gemini" ? (
          <>
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p>
              A <strong className="text-white font-semibold">Google Gemini 1.5/2.5 Flash</strong> egy rendkívül gyors és stabil válaszokat adó modell. Az AI Studio Free Tier (ingyenes szint) hozzáféréssel percenként akár 15 kérést is teljesen ingyen végezhetsz el.
            </p>
          </>
        ) : (
          <>
            <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <p>
              A <strong className="text-white font-semibold">Hugging Face Serverless Open-Source</strong> modellek ingyenesen használhatóak, de terheltebb időszakokban várakozási idő léphet fel vagy hibaüzenetet adhatnak. Ha rendelkezel saját HF tokennel a környezetben, a stabilitás és a sebesség fokozódik.
            </p>
          </>
        )}
      </div>
    </header>
  );
}
