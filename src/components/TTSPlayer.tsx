import React, { useState, useEffect, useRef } from "react";
import { Volume2, Play, Pause, Square, Sliders, Info, AudioLines } from "lucide-react";

export default function TTSPlayer() {
  const [text, setText] = useState(
    "Üdvözöllek a NexusAI Studióban! Ez egy teljesen egyedi, mesterséges intelligencia által vezérelt felolvasó rendszer, ami emberi minőségben beszél."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [animationBars, setAnimationBars] = useState<number[]>(Array(20).fill(10));
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Try to pre-select Hungarian ("hu") voice if available
        const huVoice = availableVoices.find(v => v.lang.toLowerCase().includes("hu"));
        const defaultVoice = huVoice || availableVoices.find(v => v.lang.toLowerCase().includes("en")) || availableVoices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Update animated audio waves when playing and not paused
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const interval = setInterval(() => {
        setAnimationBars(
          Array(20)
            .fill(0)
            .map(() => Math.floor(Math.random() * 50) + 4)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAnimationBars(Array(20).fill(10));
    }
  }, [isPlaying, isPaused]);

  const speak = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      return;
    }

    synthRef.current.cancel();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set parameters
    const selectedVoice = voices.find(v => v.name === selectedVoiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const pause = () => {
    if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Group Hungarian and other languages for easy selection
  const huVoices = voices.filter(v => v.lang.toLowerCase().includes("hu"));
  const otherVoices = voices.filter(v => !v.lang.toLowerCase().includes("hu"));

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-blue-400" />
          <span>Szöveg Felolvasó (TTS)</span>
        </h2>
        <p className="text-xs text-[#888888]">
          Gépelj be egy tetszőleges szöveget, válaszd ki a hang karaktert, majd hallgasd meg az eredményt magas minőségű, valós idejű szintézissel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Text Input */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 shadow-xl space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Írd be ide a felolvasandó szöveget..."
              className="w-full text-sm rounded-xl bg-[#181818] border border-[#262626] px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />

            {/* Speaking Waveform Visualization */}
            <div className="h-12 bg-[#181818] border border-[#232323] rounded-xl flex items-center justify-center gap-1 px-4 relative overflow-hidden">
              {isPlaying && !isPaused ? (
                <div className="flex items-center gap-1 relative z-10">
                  {animationBars.map((height, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${height}px` }}
                      className="w-1 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-full transition-all duration-100"
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#666666] font-mono relative z-10">
                  {isPaused ? "FELOLVASÁS SZÜNETELTETVE" : "STÚDIÓ RENDERING KÉSZENLÉT"}
                </span>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
              <button
                onClick={speak}
                disabled={!text.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-[#262626] text-white disabled:text-[#666666] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{isPaused ? "Folytatás" : "Felolvasás"}</span>
              </button>

              {isPlaying && !isPaused && (
                <button
                  onClick={pause}
                  className="px-4 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 hover:text-white rounded-xl border border-[#262626] transition cursor-pointer"
                  title="Szünet"
                >
                  <Pause className="h-4 w-4 fill-white" />
                </button>
              )}

              {isPlaying && (
                <button
                  onClick={stop}
                  className="px-4 py-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 rounded-xl border border-rose-500/10 transition cursor-pointer"
                  title="Leállítás"
                >
                  <Square className="h-4 w-4 fill-rose-400 text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Voice & Settings */}
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#262626] pb-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span>Hangbeállítások</span>
            </h3>

            {/* Voice select */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] font-medium">Hang Karakter:</label>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full text-xs rounded-xl bg-[#181818] border border-[#262626] px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {huVoices.length > 0 && (
                  <optgroup label="Ajánlott Magyar Hangok">
                    {huVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        🇭🇺 {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Egyéb Nyelvek">
                  {otherVoices.slice(0, 45).map((v) => (
                    <option key={v.name} value={v.name}>
                      🌐 {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888888] font-medium">Beszéd sebesség:</span>
                <span className="text-blue-400 font-mono">{rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-[#181818] h-1 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#888888] font-medium">Hangmagasság:</span>
                <span className="text-blue-400 font-mono">{pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-[#181818] h-1 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="text-[10px] text-[#666666] flex gap-1.5 pt-2 border-t border-[#1C1C1C]">
              <Info className="h-4.5 w-4.5 text-blue-400/50 shrink-0" />
              <span>
                Ez a modul a böngésződ beépített, nulla-késleltetésű beszédmotorját használja a legmagasabb minőségért és a korlátlan offline működésért.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
