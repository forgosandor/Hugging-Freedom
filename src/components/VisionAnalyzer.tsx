import React, { useState, useRef } from "react";
import { Upload, Eye, Sparkles, AlertCircle, FileText, X } from "lucide-react";
import { ConfigStatus } from "../types";

interface VisionAnalyzerProps {
  config: ConfigStatus;
}

export default function VisionAnalyzer({ config }: VisionAnalyzerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Magyarázd el részletesen, mi látható ezen a képen magyarul.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process file conversion to base64
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Kérjük, csak érvényes képfájlt (PNG, JPG, WEBP) tölts fel!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError("Hiba történt a képfájl beolvasása közben.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          prompt: prompt.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Szerver hiba: ${res.statusText}`);
      }

      setResult(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Hiba történt a kép elemzése közben. Próbáld meg újra!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="rounded-2xl border border-[#262626] bg-[#111111] p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Eye className="h-4.5 w-4.5 text-blue-500" />
          <span>Kép Elemzés (Vision / Látás)</span>
        </h2>
        <p className="mt-1 text-xs text-[#888888]">
          Tölts fel egy fotót, ábrát vagy grafikon, és a Google Gemini Flash azonnal értelmezi, elemzi vagy átalakítja neked szöveggé.
        </p>

        {/* Missing API Key Warning */}
        {!config.hasGeminiKey && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
            <p>
              <strong>Hiányzó Gemini kulcs:</strong> Kérjük add meg a <code>GEMINI_API_KEY</code>-t a beállításokban a kép elemző modul működéséhez!
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Upload Area / Image Preview Area */}
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />

            {!imagePreview ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={handleButtonClick}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all min-h-[220px] ${
                  dragActive
                    ? "border-blue-500 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : "border-[#333333] bg-[#141414] hover:border-[#444444] hover:bg-[#1A1A1A]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1A1A] border border-[#262626] text-[#888888] mb-3">
                  <Upload className="h-6 w-6 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-[#CCCCCC]">
                  Húzd ide a képet vagy kattints a tallózáshoz
                </p>
                <p className="mt-1 text-[10px] text-[#555555]">
                  PNG, JPG, JPEG vagy WEBP • Max 10MB
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-[#262626] bg-[#141414] p-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors z-10 cursor-pointer"
                  title="Kép eltávolítása"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="overflow-hidden rounded-xl border border-[#262626] bg-black max-w-full flex items-center justify-center min-h-[200px]">
                  <img
                    src={imagePreview}
                    alt="Feltöltött kép preview"
                    className="max-h-[260px] w-auto object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 self-start text-[10px] font-mono text-[#666666] px-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Kép sikeresen betöltve a memóriába.</span>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Settings & Trigger Form */}
          <form onSubmit={handleAnalyze} className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-4">
              <label className="text-[11px] uppercase tracking-widest text-[#666666] font-bold">
                Kérdés vagy feladat az AI-nak:
              </label>
              <div className="relative rounded-2xl border border-[#333333] bg-[#1A1A1A] p-2 focus-within:border-blue-500/50 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Mit elemezzen a képből?"
                  rows={4}
                  className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-white outline-hidden placeholder-[#555555]"
                />
              </div>

              {/* Quick Prompt Ideas */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Leírás magyarul", prompt: "Magyarázd el részletesen, mi látható ezen a képen magyarul." },
                  { label: "Szöveg kiolvasása (OCR)", prompt: "Olvasd ki az összes szöveget a képről és formázd táblázatosan vagy listaként, ha szükséges." },
                  { label: "Diagram értelmezése", prompt: "Elemezd a képen látható diagramot/grafikont és magyarázd el a legfőbb összefüggéseket." }
                ].map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(idea.prompt)}
                    className="rounded-lg bg-[#141414] border border-[#262626] hover:bg-[#1A1A1A] hover:border-[#333333] px-2.5 py-1 text-[10px] text-[#888888] hover:text-[#CCCCCC] transition-colors cursor-pointer"
                  >
                    {idea.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!imagePreview || isAnalyzing || !config.hasGeminiKey}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all cursor-pointer ${
                imagePreview && !isAnalyzing && config.hasGeminiKey
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                  : "bg-[#141414] text-[#444444] border border-[#262626]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-white" />
                  <span>Kép feldolgozása és elemzése...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Kép Elemzése</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result ? (
        <div className="rounded-2xl border border-[#262626] bg-[#111111] p-5 shadow-sm">
          <label className="text-[11px] uppercase tracking-widest text-[#666666] font-bold block mb-3">
            🤖 AI elemzés eredménye:
          </label>
          <div className="border-t border-[#262626] pt-3 text-sm leading-relaxed text-[#CCCCCC] whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-1">
            {result}
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="rounded-2xl border border-[#262626] bg-[#111111] p-12 shadow-sm flex flex-col items-center justify-center min-h-[220px]">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-500/10 border-t-blue-500" />
            <Eye className="absolute h-5 w-5 text-blue-500 animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-[#CCCCCC] font-semibold">A látás idegsejtek tüzelnek...</p>
          <p className="mt-1 text-xs text-[#666666]">A Gemini éppen végignézi és elemzi a pixeladatokat.</p>
        </div>
      ) : null}
    </div>
  );
}
