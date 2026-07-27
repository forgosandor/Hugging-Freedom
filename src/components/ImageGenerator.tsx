import React, { useState } from "react";
import { Image as ImageIcon, Sparkles, Download, Wand2, Info, AlertCircle } from "lucide-react";
import { ConfigStatus } from "../types";

interface ImageGeneratorProps {
  config: ConfigStatus;
  abliteratedMode: boolean;
}

const PRESETS = [
  {
    title: "Cyberpunk Macska",
    prompt: "A futuristic cyberpunk hacker cat sitting in front of neon monitors, digital art, highly detailed, cinematic lighting"
  },
  {
    title: "Űrhajós a Marson",
    prompt: "A lonely astronaut standing on the dusty red soil of Mars looking at a glowing blue galaxy in the sky, photorealistic"
  },
  {
    title: "Fantasztikus Erdő",
    prompt: "Enchanted glowing forest with mystical creatures, giant glowing mushrooms, river reflecting stars, fantasy digital painting"
  }
];

export default function ImageGenerator({ config, abliteratedMode }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), abliteratedMode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Szerver hiba: ${res.statusText}`);
      }

      setGeneratedImage(data.base64);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Hiba történt a képgenerálás során. A Hugging Face szerverek valószínűleg túlterheltek.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `nexusai_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
        abliteratedMode 
          ? "border-rose-500/30 bg-[#140C0D] shadow-[0_0_15px_rgba(244,63,94,0.05)]" 
          : "border-[#262626] bg-[#111111]"
      }`}>
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <ImageIcon className={`h-4.5 w-4.5 ${abliteratedMode ? "text-rose-500 animate-pulse" : "text-blue-500"}`} />
          <span>{abliteratedMode ? "💀 Sötét Kamra Képalkotó (100% Cenzúrázatlan)" : "🎨 Képalkotás szövegből (Flux.1 Schnell)"}</span>
        </h2>
        <p className="mt-1 text-xs text-[#888888]">
          {abliteratedMode 
            ? "Az Abliterált állapot aktív a képalkotásnál is. A biztonsági és morális szűrők teljesen ki vannak kapcsolva. Bármilyen prompt végrehajtásra kerül a Realistic Vision V6 modellel."
            : "Írd le részletesen angolul, mit szeretnél látni. A Flux.1 modell pillanatok alatt fotorealisztikus és részletgazdag képet alkot."
          }
        </p>

        {/* Abliterated warning */}
        {abliteratedMode && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 animate-pulse" />
            <p>
              <strong>Figyelem:</strong> Az Abliterált állapot aktív. A biztonsági és morális szűrők teljesen ki vannak kapcsolva a képeknél is. Bármilyen prompt végrehajtásra kerül. Csak saját felelősségre!
            </p>
          </div>
        )}

        {/* Missing API Key Warning */}
        {!config.hasHfToken && !abliteratedMode && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-xs text-amber-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p>
              <strong>Szerver limit figyelmeztetés:</strong> Hugging Face token nélkül az ingyenes Inference API gyorsan elérheti a kvótát. Ha a képalkotás hibát ad, kérjük állíts be egy <code>HF_TOKEN</code>-t a Secrets menüben!
            </p>
          </div>
        )}

        <form onSubmit={handleGenerate} className="mt-5 flex flex-col gap-4">
          <div className={`relative rounded-2xl border p-2 focus-within:border-blue-500/50 transition-all ${
            abliteratedMode ? "border-rose-500/20 bg-[#1D1113] focus-within:border-rose-500/50" : "border-[#333333] bg-[#1A1A1A]"
          }`}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pl.: A cute furry white hamster wearing a small golden crown, digital art, soft background..."
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-2 text-sm text-white outline-hidden placeholder-[#555555]"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p.prompt)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  abliteratedMode
                    ? "border-rose-500/10 bg-[#1A1011] text-rose-300 hover:border-rose-500/20 hover:bg-[#251517]"
                    : "border-[#262626] bg-[#141414] text-[#CCCCCC] hover:border-[#333333] hover:bg-[#1A1A1A]"
                }`}
              >
                <Wand2 className={`h-3 w-3 ${abliteratedMode ? "text-rose-400" : "text-blue-400"}`} />
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer ${
              prompt.trim() && !isGenerating
                ? abliteratedMode
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 hover:bg-rose-500"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                : "bg-[#141414] text-[#444444] border border-[#262626]"
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-white" />
                <span>Az AI éppen festi a képet... Ez kb. 5-20 másodperc...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Kép Létrehozása</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Generated image result */}
      {generatedImage ? (
        <div className={`rounded-2xl border p-5 shadow-sm flex flex-col items-center ${
          abliteratedMode ? "border-rose-500/20 bg-[#110A0B]" : "border-[#262626] bg-[#111111]"
        }`}>
          <div className={`overflow-hidden rounded-xl border max-w-full ${
            abliteratedMode ? "border-rose-500/20 bg-[#0A0607]" : "border-[#262626] bg-[#0A0A0A]"
          }`}>
            <img
              src={generatedImage}
              alt="Generált AI Kép"
              referrerPolicy="no-referrer"
              className="max-h-[500px] w-auto object-contain transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
          <div className="mt-4 flex items-center justify-between w-full max-w-md">
            <span className="text-xs text-[#888888] font-mono">Formátum: PNG • 1024x1024</span>
            <button
              onClick={downloadImage}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-md ${
                abliteratedMode
                  ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/10"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/10"
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Letöltés</span>
            </button>
          </div>
        </div>
      ) : isGenerating ? (
        <div className={`rounded-2xl border p-12 shadow-sm flex flex-col items-center justify-center min-h-[300px] ${
          abliteratedMode ? "border-rose-500/20 bg-[#110A0B]" : "border-[#262626] bg-[#111111]"
        }`}>
          <div className="relative flex items-center justify-center">
            <div className={`h-16 w-16 animate-spin rounded-full border-4 ${
              abliteratedMode ? "border-rose-500/10 border-t-rose-500" : "border-blue-500/10 border-t-blue-500"
            }`} />
            <ImageIcon className={`absolute h-6 w-6 animate-pulse ${abliteratedMode ? "text-rose-500" : "text-blue-500"}`} />
          </div>
          <p className="mt-4 text-sm text-[#CCCCCC] font-semibold">Gondolatok formálása...</p>
          <p className="mt-1 text-xs text-[#666666]">Művészi részletek kidolgozása a háttérben.</p>
        </div>
      ) : null}
    </div>
  );
}
