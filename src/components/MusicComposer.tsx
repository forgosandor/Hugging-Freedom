import React, { useState, useRef, useEffect } from "react";
import { Music, Download, Play, Pause, RefreshCw, AudioLines, Info, Sparkles } from "lucide-react";
import { ConfigStatus } from "../types";

interface MusicComposerProps {
  config: ConfigStatus;
}

const TEMPLATES = [
  { label: "🎷 Chill Lo-Fi", prompt: "Lo-fi hip hop beat for studying, smooth saxophone, chill vibe, 80 bpm" },
  { label: "🌃 Cyberpunk Techno", prompt: "Dark cyberpunk industrial techno beat, fast synthesizers, heavy rhythmic pulse, 130 bpm" },
  { label: "🌌 Deep Space Ambient", prompt: "Deep space cosmic ambient pad, celestial synth waves, relaxing slow soundscape, 70 bpm" },
  { label: "🎸 Acoustic Folk", prompt: "Mellow acoustic guitar folk melody, warm organic vibe, cozy evening feel, 95 bpm" }
];

export default function MusicComposer({ config }: MusicComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [animationBars, setAnimationBars] = useState<number[]>(Array(24).fill(15));
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAnimationBars(
          Array(24)
            .fill(0)
            .map(() => Math.floor(Math.random() * 45) + 5)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAnimationBars(Array(24).fill(15));
    }
  }, [isPlaying]);

  const handleTemplateClick = (text: string) => {
    setPrompt(text);
  };

  const generateMusic = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsOfflineFallback(false);
    setIsPlaying(false);

    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      if (!response.ok) {
        throw new Error("Szerver hiba történt a generálás során.");
      }

      const data = await response.json();
      if (data.base64) {
        setAudioUrl(data.base64);
        setIsOfflineFallback(data.fallback);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Ismeretlen válasz a szervertől.");
      }
    } catch (err: any) {
      setError(err.message || "Nem sikerült a zene generálása.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="h-5 w-5 text-blue-400" />
          <span>Zene és dallam generálása</span>
        </h2>
        <p className="text-xs text-[#888888]">
          Írd le részletesen, milyen zenét szeretnél (angolul adja a legjobb eredményt), és az AI megkomponálja neked.
        </p>
      </div>

      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Template prompt chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#888888] block">Sablonok gyors indításhoz:</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTemplateClick(tpl.prompt)}
                className="text-xs px-3 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 hover:text-white transition cursor-pointer border border-[#262626]"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Például: Lo-fi hip hop beat for studying, smooth saxophone, chill vibe, 80 bpm..."
            className="w-full text-sm rounded-xl bg-[#181818] border border-[#262626] px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateMusic}
          disabled={isGenerating || !prompt.trim()}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isGenerating || !prompt.trim()
              ? "bg-[#262626] text-[#666666] cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10"
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Dallamok komponálása folyamatban (20-40 mp)...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>🎵 Zene Komponálása</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Output / Player Panel */}
      {audioUrl && (
        <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="h-16 flex items-end justify-center gap-1.5 w-full max-w-[280px]">
              {animationBars.map((height, idx) => (
                <div
                  key={idx}
                  style={{ height: `${height}%` }}
                  className="w-1.5 bg-gradient-to-t from-blue-600 via-indigo-500 to-pink-500 rounded-full transition-all duration-100"
                />
              ))}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Generált Zeneszám</h3>
              <p className="text-xs text-[#888888] max-w-md line-clamp-1 italic">
                "{prompt}"
              </p>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/20 transition transform hover:scale-105"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
              </button>

              <a
                href={audioUrl}
                download="nexusai_music.wav"
                className="w-12 h-12 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 hover:text-white flex items-center justify-center border border-[#262626] cursor-pointer transition transform hover:scale-105"
                title="Audio Letöltése"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="border-t border-[#1C1C1C] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#888888]">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                {isOfflineFallback ? (
                  <span className="text-indigo-400 font-semibold">Offline Vektoros Szintetizátor Rendelés (Biztonságos Mód)</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">Meta MusicGen Modell (Hugging Face)</span>
                )}
              </span>
            </div>
            <div className="font-mono text-[10px] text-gray-500">
              {isOfflineFallback ? "PCM • 22050HZ • MONO • 16-BIT" : "WAV • 32000HZ • STEREO"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
