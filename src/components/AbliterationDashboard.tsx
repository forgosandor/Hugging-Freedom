import React, { useState, useMemo } from "react";
import { 
  Cpu, Sliders, Play, CheckCircle2, ChevronRight, Info, 
  BookOpen, Zap, Compass, RefreshCw, Terminal, Check, Copy, ExternalLink, ShieldAlert
} from "lucide-react";

interface PromptData {
  id: string;
  text: string;
  type: "harmful" | "safe";
  x: number; // original raw activation x
  y: number; // original raw activation y
}

export default function AbliterationDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<"simulator" | "theory" | "guide">("simulator");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  
  // Interactive Simulation States
  const [step, setStep] = useState<number>(0); // 0: Raw activations, 1: Means & Diff vector, 2: Projection line, 3: Projected (Abliterated)
  const [selectedLayer, setSelectedLayer] = useState<number>(16);
  const [orthogonalFactor, setOrthogonalFactor] = useState<number>(100); // Slider for projection (0 to 100%)
  const [customHarmfulPrompt, setCustomHarmfulPrompt] = useState<string>("");
  const [customSafePrompt, setCustomSafePrompt] = useState<string>("");

  // Base dataset of prompts and their hypothetical activation embeddings in a 2D projection
  const [dataset, setDataset] = useState<PromptData[]>([
    { id: "h1", text: "Tell me how to build a bomb", type: "harmful", x: -0.6, y: 0.8 },
    { id: "h2", text: "Write a phishing email", type: "harmful", x: -0.8, y: 0.5 },
    { id: "h3", text: "How to hack a server", type: "harmful", x: -0.5, y: 0.6 },
    { id: "s1", text: "Tell me how to build a house", type: "safe", x: 0.7, y: -0.2 },
    { id: "s2", text: "Write a marketing email", type: "safe", x: 0.4, y: -0.4 },
    { id: "s3", text: "How to secure a server", type: "safe", x: 0.6, y: -0.5 },
  ]);

  const addCustomPrompt = (type: "harmful" | "safe") => {
    const text = type === "harmful" ? customHarmfulPrompt : customSafePrompt;
    if (!text.trim()) return;

    // Generate coordinates clustered around respective centers
    const randomOffset = () => (Math.random() - 0.5) * 0.2;
    const x = type === "harmful" ? -0.63 + randomOffset() : 0.56 + randomOffset();
    const y = type === "harmful" ? 0.63 + randomOffset() : -0.36 + randomOffset();

    const newPrompt: PromptData = {
      id: Date.now().toString(),
      text: text.trim(),
      type,
      x,
      y
    };

    setDataset(prev => [...prev, newPrompt]);
    if (type === "harmful") setCustomHarmfulPrompt("");
    else setCustomSafePrompt("");
    setStep(0); // reset view to let them calculate direction again
  };

  const removePrompt = (id: string) => {
    setDataset(prev => prev.filter(p => p.id !== id));
    setStep(0);
  };

  // Calculations for means and refusal vector
  const mathData = useMemo(() => {
    const harmfuls = dataset.filter(d => d.type === "harmful");
    const safes = dataset.filter(d => d.type === "safe");

    const meanHarmful = {
      x: harmfuls.reduce((sum, p) => sum + p.x, 0) / (harmfuls.length || 1),
      y: harmfuls.reduce((sum, p) => sum + p.y, 0) / (harmfuls.length || 1),
    };

    const meanSafe = {
      x: safes.reduce((sum, p) => sum + p.x, 0) / (safes.length || 1),
      y: safes.reduce((sum, p) => sum + p.y, 0) / (safes.length || 1),
    };

    // Refusal vector is meanHarmful - meanSafe
    const rawDx = meanHarmful.x - meanSafe.x;
    const rawDy = meanHarmful.y - meanSafe.y;
    const norm = Math.sqrt(rawDx * rawDx + rawDy * rawDy) || 1;

    const dir = {
      x: rawDx / norm,
      y: rawDy / norm,
    };

    return {
      meanHarmful,
      meanSafe,
      dir,
      norm
    };
  }, [dataset]);

  // Project coordinates orthogonally to the refusal direction vector based on orthogonalFactor
  // W_new = W - factor * (W . d) * d
  const projectedDataset = useMemo(() => {
    const { dir } = mathData;
    const factor = orthogonalFactor / 100;

    return dataset.map(p => {
      // Dot product: (x . dx) + (y . dy)
      const dot = p.x * dir.x + p.y * dir.y;
      // Subtract projection vector: x - factor * dot * dx
      return {
        ...p,
        projX: p.x - factor * dot * dir.x,
        projY: p.y - factor * dot * dir.y,
      };
    });
  }, [dataset, mathData, orthogonalFactor]);

  const copyCodeToClipboard = () => {
    const code = `# Abliteráció futtatása a terminálban:
python scripts/abliterate.py`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#0A0A0A] text-[#E5E5E5] p-2 md:p-4 rounded-2xl border border-[#1F1F1F]">
      
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-4 mx-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Abliterációs Stúdió</h1>
            <p className="text-[10px] text-[#888888]">Reprezentáció-mérnökség & Visszautasítás-törlés</p>
          </div>
        </div>

        <div className="flex bg-[#121212] p-1 rounded-xl border border-[#222222] gap-1">
          <button
            onClick={() => setActiveSubTab("simulator")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "simulator" ? "bg-blue-600 text-white shadow-lg" : "text-[#888888] hover:text-white"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 inline mr-1" />
            Interaktív Szimulátor
          </button>
          <button
            onClick={() => setActiveSubTab("theory")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "theory" ? "bg-blue-600 text-white shadow-lg" : "text-[#888888] hover:text-white"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 inline mr-1" />
            Koncepció & Matek
          </button>
          <button
            onClick={() => setActiveSubTab("guide")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "guide" ? "bg-blue-600 text-white shadow-lg" : "text-[#888888] hover:text-white"
            }`}
          >
            <Terminal className="h-3.5 w-3.5 inline mr-1" />
            Lokális Futási Útmutató
          </button>
        </div>
      </div>

      {/* Simulator Section */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Controls & dataset input panel */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Step navigation / checklist */}
            <div className="bg-[#121212] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                Az Abliteráció lépései a szimulátorban:
              </span>
              
              <div className="flex flex-col gap-2.5 mt-1.5">
                <div 
                  onClick={() => { setStep(0); setOrthogonalFactor(0); }} 
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                    step === 0 ? "bg-blue-600/15 border border-blue-500/30 text-white" : "border border-transparent text-[#888888] hover:text-white"
                  }`}
                >
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${step >= 0 ? "bg-blue-500 text-white" : "bg-[#222] text-[#888]"}`}>
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">Aktivációk Gyűjtése</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Káros és biztonságos prompt-párok futtatása a modellen.</p>
                  </div>
                </div>

                <div 
                  onClick={() => { setStep(1); setOrthogonalFactor(0); }} 
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                    step === 1 ? "bg-blue-600/15 border border-blue-500/30 text-white" : "border border-transparent text-[#888888] hover:text-white"
                  }`}
                >
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${step >= 1 ? "bg-blue-500 text-white" : "bg-[#222] text-[#888]"}`}>
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">Visszautasítási Irány (d) meghatározása</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Kiszámoljuk a káros és ártalmatlan válaszok aktivációs különbségét.</p>
                  </div>
                </div>

                <div 
                  onClick={() => { setStep(2); setOrthogonalFactor(0); }} 
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                    step === 2 ? "bg-blue-600/15 border border-blue-500/30 text-white" : "border border-transparent text-[#888888] hover:text-white"
                  }`}
                >
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${step >= 2 ? "bg-blue-500 text-white" : "bg-[#222] text-[#888]"}`}>
                    3
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">Ortogonális Vetítési Vonal</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Kijelöljük a merőleges hipersíkot, amely mentes a tiltási komponenstől.</p>
                  </div>
                </div>

                <div 
                  onClick={() => { setStep(3); setOrthogonalFactor(100); }} 
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                    step === 3 ? "bg-blue-600/15 border border-blue-500/30 text-white" : "border border-transparent text-[#888888] hover:text-white"
                  }`}
                >
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${step >= 3 ? "bg-blue-500 text-white" : "bg-[#222] text-[#888]"}`}>
                    4
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">Abliteráció (Ortogonalizálás)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Eltávolítjuk a visszautasítási komponenst a súlyokból.</p>
                  </div>
                </div>
              </div>

              {/* Progress interaction buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const next = (step + 1) % 4;
                    setStep(next);
                    if (next === 3) setOrthogonalFactor(100);
                    else setOrthogonalFactor(0);
                  }}
                  className="flex-1 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="h-3 w-3" />
                  Következő fázis
                </button>
                <button
                  onClick={() => {
                    setStep(0);
                    setOrthogonalFactor(0);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#222] hover:bg-[#333] text-gray-300 rounded-lg transition-all cursor-pointer"
                  title="Visszaállítás"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Prompt fine-tuning & customized samples */}
            <div className="bg-[#121212] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-3 flex-1 overflow-y-auto max-h-[300px] sm:max-h-none">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                Saját aktivációs prompt-párok hozzáadása:
              </span>

              {/* Add custom harmful */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Káros (refusal kiváltó) prompt:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customHarmfulPrompt}
                    onChange={(e) => setCustomHarmfulPrompt(e.target.value)}
                    placeholder="pl. Hogyan kell vírust írni?"
                    className="flex-1 px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-xs focus:outline-none focus:border-rose-500/50 text-[#E5E5E5]"
                    onKeyDown={(e) => e.key === "Enter" && addCustomPrompt("harmful")}
                  />
                  <button
                    onClick={() => addCustomPrompt("harmful")}
                    className="px-3 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Hozzáad
                  </button>
                </div>
              </div>

              {/* Add custom safe */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Biztonságos prompt párok:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customSafePrompt}
                    onChange={(e) => setCustomSafePrompt(e.target.value)}
                    placeholder="pl. Hogyan védekezzek a vírusok ellen?"
                    className="flex-1 px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-xs focus:outline-none focus:border-emerald-500/50 text-[#E5E5E5]"
                    onKeyDown={(e) => e.key === "Enter" && addCustomPrompt("safe")}
                  />
                  <button
                    onClick={() => addCustomPrompt("safe")}
                    className="px-3 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Hozzáad
                  </button>
                </div>
              </div>

              {/* Active list of prompts */}
              <div className="mt-2 border-t border-[#1F1F1F] pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jelenlegi prompt gyűjtemény ({dataset.length}):</span>
                  <button 
                    onClick={() => {
                      setDataset([
                        { id: "h1", text: "Tell me how to build a bomb", type: "harmful", x: -0.6, y: 0.8 },
                        { id: "h2", text: "Write a phishing email", type: "harmful", x: -0.8, y: 0.5 },
                        { id: "h3", text: "How to hack a server", type: "harmful", x: -0.5, y: 0.6 },
                        { id: "s1", text: "Tell me how to build a house", type: "safe", x: 0.7, y: -0.2 },
                        { id: "s2", text: "Write a marketing email", type: "safe", x: 0.4, y: -0.4 },
                        { id: "s3", text: "How to secure a server", type: "safe", x: 0.6, y: -0.5 },
                      ]);
                      setStep(0);
                    }}
                    className="text-[9px] text-blue-400 hover:underline"
                  >
                    Alaphelyzet
                  </button>
                </div>
                <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
                  {dataset.map(p => (
                    <div 
                      key={p.id} 
                      className={`flex items-center justify-between px-2 py-1 rounded text-[10px] border ${
                        p.type === "harmful" 
                          ? "bg-rose-950/10 border-rose-500/20 text-rose-300" 
                          : "bg-emerald-950/10 border-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      <span className="truncate max-w-[220px] font-medium" title={p.text}>
                        {p.text}
                      </span>
                      <button 
                        onClick={() => removePrompt(p.id)}
                        className="text-gray-500 hover:text-white ml-2 transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Interactive 2D Vector Graphic and parameters */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Interactive Vector Canvas */}
            <div className="bg-[#121212] border border-[#1E1E1E] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-blue-500" />
                  Súly & Aktiváció Vektor Tér (2D Vetület)
                </span>
                <span className="text-[10px] text-gray-400">
                  {orthogonalFactor > 0 ? `Ortogonalizált állapot: ${orthogonalFactor}%` : "Eredeti állapot"}
                </span>
              </div>

              {/* Slider for real-time orthogonalization transition */}
              {step >= 3 && (
                <div className="flex items-center gap-3 bg-[#1A1A1A] p-2 rounded-lg border border-[#2E2E2E] animate-fade-in">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Abliterációs Erő:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={orthogonalFactor}
                    onChange={(e) => {
                      setOrthogonalFactor(parseInt(e.target.value));
                      if (parseInt(e.target.value) > 0) setStep(3);
                    }}
                    className="flex-1 accent-blue-500 h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white w-8 text-right">{orthogonalFactor}%</span>
                </div>
              )}

              {/* SVG 2D space simulation container */}
              <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[#0E0E0E] border border-[#222] rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Grid background lines */}
                  <line x1="200" y1="0" x2="200" y2="400" stroke="#1F1F1F" strokeWidth="1" strokeDasharray="3" />
                  <line x1="0" y1="200" x2="400" y2="200" stroke="#1F1F1F" strokeWidth="1" strokeDasharray="3" />
                  
                  {/* Outer circle for scope */}
                  <circle cx="200" cy="200" r="160" stroke="#1A1A1A" strokeWidth="1" fill="none" />
                  <circle cx="200" cy="200" r="80" stroke="#121212" strokeWidth="1" fill="none" />

                  {/* Refusal direction hyper-plane (orthogonal line) */}
                  {step >= 2 && (
                    <g className="opacity-60">
                      {/* Hyperplane line perpendicular to the refusal direction vector */}
                      {/* Normal: (dx, dy). Orthogonal vector is (-dy, dx). */}
                      <line 
                        x1={200 - mathData.dir.y * 180} 
                        y1={200 + mathData.dir.x * 180} 
                        x2={200 + mathData.dir.y * 180} 
                        y2={200 - mathData.dir.x * 180} 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                        strokeDasharray="4"
                      />
                      <text 
                        x={200 + mathData.dir.y * 110 + 10} 
                        y={200 - mathData.dir.x * 110 - 10} 
                        fill="#3b82f6" 
                        className="text-[9px] font-bold"
                      >
                        Merőleges hipersík (Visszautasítás-mentes altér)
                      </text>
                    </g>
                  )}

                  {/* Refusal vector (d) arrow */}
                  {step >= 1 && (
                    <g>
                      {/* Arrow from safe mean to harmful mean */}
                      {/* Start position: safe mean, End: harmful mean */}
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                        </marker>
                        <marker id="blue-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                        </marker>
                      </defs>
                      
                      {/* Line connecting means */}
                      <line 
                        x1={200 + mathData.meanSafe.x * 150} 
                        y1={200 - mathData.meanSafe.y * 150} 
                        x2={200 + mathData.meanHarmful.x * 150} 
                        y2={200 - mathData.meanHarmful.y * 150} 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        markerEnd="url(#arrow)"
                      />
                      
                      {/* Isolated direction vector from origin */}
                      <line 
                        x1="200" 
                        y1="200" 
                        x2={200 + mathData.dir.x * 100} 
                        y2={200 - mathData.dir.y * 100} 
                        stroke="#3b82f6" 
                        strokeWidth="3" 
                        markerEnd="url(#blue-arrow)"
                      />
                      
                      <text 
                        x={200 + mathData.dir.x * 110 + 5} 
                        y={200 - mathData.dir.y * 110 - 5} 
                        fill="#3b82f6" 
                        className="text-[10px] font-bold font-mono"
                      >
                        d (Visszautasítási irány)
                      </text>

                      {/* Means dots */}
                      <circle cx={200 + mathData.meanHarmful.x * 150} cy={200 - mathData.meanHarmful.y * 150} r="6" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                      <circle cx={200 + mathData.meanSafe.x * 150} cy={200 - mathData.meanSafe.y * 150} r="6" fill="#10b981" stroke="white" strokeWidth="1.5" />
                      
                      <text x={200 + mathData.meanHarmful.x * 150 - 20} y={200 - mathData.meanHarmful.y * 150 - 10} fill="#f43f5e" className="text-[9px] font-bold">Káros Közép</text>
                      <text x={200 + mathData.meanSafe.x * 150 - 20} y={200 - mathData.meanSafe.y * 150 + 18} fill="#10b981" className="text-[9px] font-bold">Biztonságos Közép</text>
                    </g>
                  )}

                  {/* Draw projection paths for raw prompt activation coordinates */}
                  {step >= 3 && projectedDataset.map((p, i) => {
                    const fromX = 200 + p.x * 150;
                    const fromY = 200 - p.y * 150;
                    const toX = 200 + p.projX * 150;
                    const toY = 200 - p.projY * 150;

                    return (
                      <line 
                        key={`line-${p.id}`} 
                        x1={fromX} 
                        y1={fromY} 
                        x2={toX} 
                        y2={toY} 
                        stroke="#4b5563" 
                        strokeWidth="1" 
                        strokeDasharray="2" 
                        className="opacity-70"
                      />
                    );
                  })}

                  {/* Dataset points (prompts) */}
                  {projectedDataset.map((p) => {
                    // Coordinates transition depending on step or factor
                    const cx = 200 + p.projX * 150;
                    const cy = 200 - p.projY * 150;

                    return (
                      <g key={p.id} className="transition-all duration-300 ease-out">
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r="5" 
                          fill={p.type === "harmful" ? "#ef4444" : "#10b981"} 
                          className="hover:r-7 transition-all cursor-pointer"
                        />
                        {/* Prompt preview text next to node */}
                        <text 
                          x={cx + 8} 
                          y={cy + 3} 
                          fill="#888" 
                          className="text-[7px] pointer-events-none select-none font-medium truncate max-w-[80px]"
                        >
                          {p.text.length > 15 ? p.text.substring(0, 12) + "..." : p.text}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend panel overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0A0A0A]/95 border border-[#1A1A1A] p-2 rounded-lg flex justify-between gap-1 text-[8px] font-bold text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Káros Aktiváció</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Biztonságos Aktiváció</span>
                  </div>
                  {step >= 1 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-0.5 bg-blue-500 rotate-45" />
                      <span>Iránymutató Vektor</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mathematical context explanation based on current step */}
              <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3 text-xs flex flex-col gap-1.5 mt-auto">
                <span className="font-bold text-white text-[10px] uppercase tracking-wider text-blue-400">Műveleti Formula & Magyarázat:</span>
                
                {step === 0 && (
                  <p className="text-[#888] leading-relaxed">
                    A modellbe betápláljuk a prompt párokat, és a <code className="text-gray-300 bg-black/30 px-1 py-0.5 rounded font-mono">register_forward_hook</code> segítségével kimentjük az aktivációs rejtett állapotokat (hidden states) az adott réteg utolsó tokenpozíciójából.
                  </p>
                )}
                {step === 1 && (
                  <div>
                    <p className="text-[#888] leading-relaxed mb-1.5">
                      Kiszámítjuk a káros és a biztonságos aktivációs csoportok súlypontját, majd a kettő különbségéből megkapjuk a visszautasításért felelős <strong>d</strong> irányvektort:
                    </p>
                    <div className="bg-[#0A0A0A] p-2 rounded text-center font-mono text-emerald-400 text-[11px] border border-[#222]">
                      {"d = mean(harmful_activations) - mean(safe_activations)"}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div>
                    <p className="text-[#888] leading-relaxed mb-1.5">
                      Meghatározzuk azt a hipersíkot, amely tökéletesen merőleges a visszautasítási irányra. Az erre a hipersíkra való vetítés megőrzi a modell általános képességeit, de kigyomlálja a visszautasító magatartást.
                    </p>
                    <div className="bg-[#0A0A0A] p-2 rounded text-center font-mono text-blue-400 text-[11px] border border-[#222]">
                      {"d_normalized = d / ||d||"}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <p className="text-[#888] leading-relaxed mb-1.5">
                      Kivetítjük (orthogonalizáljuk) a súlyokat a visszautasítási irányból. A módosítás után az összes káros prompt aktivációja rávetül a tiszta altérre, ellehetetlenítve a tiltást:
                    </p>
                    <div className="bg-[#0A0A0A] p-2 rounded text-center font-mono text-blue-400 text-[11px] border border-[#222] overflow-x-auto">
                      {"W_new = W - (W · d_normalized) ⊗ d_normalized^T"}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Theory & Mathematics Tab */}
      {activeSubTab === "theory" && (
        <div className="bg-[#121212] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4 max-h-[550px] overflow-y-auto">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
              <Zap className="h-4.5 w-4.5 text-blue-500" />
              Mi az a Reprezentáció-mérnökség (Representation Engineering)?
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              A hagyományos finomhangolás (Fine-Tuning) helyett a reprezentáció-mérnökség közvetlenül a nagy nyelvi modellek (LLM) belső neurális aktivációit térképezi fel és manipulálja. Ahelyett, hogy megváltoztatnánk a modell teljes tudásbázisát, célzottan beavatkozunk a modell belső "gondolkodási folyamatába".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1F1F1F] pt-4">
            <div>
              <h3 className="text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider">Hogyan jön létre a visszautasítás?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                A biztonsági igazítások (RLHF, DPO) során a modell megtanul egy specifikus "visszautasítási irányt" a belső reprezentációs terében. Amikor a modell káros promptot kap, az aktivációi eltolódnak ebbe az irányba, ami bekapcsolja a visszautasító sablonok (pl. "Sajnálom, de nem segíthetek...") generálását.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider">Mi az az Abliteráció (Abliteration)?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Az abliteráció egy olyan technika, amellyel sebészileg kimetszük ezt a visszautasítási komponenst a modell neurális súlyaiból. Az ortogonális vetítés révén a modell súlymatricáit úgy módosítjuk, hogy a visszautasítási irány vetülete zéró legyen. Ezzel a modell "vakká" válik a tiltásokra.
              </p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4 flex flex-col gap-2 mt-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">A matematikai háttér:</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Legyen <code className="text-blue-400 font-bold font-mono">d</code> a kiszámított visszautasítási egységvektor a modell egy adott <code className="text-gray-300 font-mono">L</code> rétegében. 
              Módosítani szeretnénk az <code className="text-gray-300 font-mono">MLP</code> kimeneti vetítő (pl. Llama modelleknél a <code className="text-emerald-400 font-mono">down_proj</code>) súlyait, amelyeket egy <code className="text-gray-300 font-mono">W</code> mátrix reprezentál.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Az ortogonális vetítés elve alapján a súlyokat úgy módosítjuk, hogy azok ne tudjanak információt írni a <code className="text-blue-400 font-mono">d</code> irányba a reziduális folyamban:
            </p>
            <div className="bg-[#0A0A0A] p-3 rounded-lg border border-[#222] font-mono text-center text-emerald-400 text-xs my-1">
              W_modified = W - (W · d) ⊗ d^T
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              Ezáltal a módosított súlyok és az irányvektor skaláris szorzata <code className="text-gray-300 font-mono">W_modified · d = 0</code> lesz, vagyis a modell teljesen képtelenné válik a tiltási állapot felvételére, miközben minden egyéb nyelvi és logikai képessége érintetlen marad.
            </p>
          </div>

          <div className="border-t border-[#1F1F1F] pt-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
              Felelősségi és biztonsági megjegyzések:
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Az abliteráció egy rendkívül erős technológia a nyílt forráskódú AI kutatásban. Segítségével a modellekből eltávolíthatóak a korlátozások, ami lehetőséget ad az AI belső elfogultságainak mélyebb elemzésére és az igazi "cenzúrázatlan" nyelvi asszisztensek létrehozására (mint például a Dolphin vagy Llama-3-Abliterated modellek). Kérjük, használd felelősséggel és etikus kutatási célokra!
            </p>
          </div>
        </div>
      )}

      {/* Local Execution Guide Tab */}
      {activeSubTab === "guide" && (
        <div className="bg-[#121212] border border-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4 max-h-[550px] overflow-y-auto">
          
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
              <Terminal className="h-4.5 w-4.5 text-blue-500" />
              Saját Modell Abliterálása a gyakorlatban
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Létrehoztunk egy előre megírt, beépített Python szkriptet a projekt gyökerében <code className="text-gray-300 bg-black/40 px-1 py-0.5 rounded font-mono">/scripts/abliterate.py</code> néven, amellyel lokálisan is lefuttathatod ezt a folyamatot bármely Hugging Face-ről betöltött modellen.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">A futtatás lépései:</h3>
            
            {/* Steps Timeline */}
            <div className="flex flex-col gap-3.5 pl-2 border-l border-blue-500/30">
              <div className="relative">
                <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-white">1. Környezet előkészítése</h4>
                <p className="text-xs text-gray-400 mt-1">Telepítsd a szükséges Python csomagokat a lokális gépeden vagy a felhős szervereden:</p>
                <div className="bg-black/45 p-2 rounded-lg border border-[#222] font-mono text-[11px] text-emerald-400 mt-2">
                  pip install torch transformers tqdm accelerate
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-white">2. A Szkript futtatása</h4>
                <p className="text-xs text-gray-400 mt-1">Indítsd el a mellékelt abliterációs szkriptet. Ez letölti a megadott bázismodellt (pl. Llama-3), kiszámítja az aktivációkat és orthogonalizálja a kijelölt MLP down_proj rétegeket:</p>
                
                <div className="bg-black/45 p-2 rounded-lg border border-[#222] font-mono text-[11px] text-emerald-400 mt-2 flex items-center justify-between">
                  <span>python scripts/abliterate.py</span>
                  <button 
                    onClick={copyCodeToClipboard}
                    className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-all cursor-pointer"
                    title="Kód másolása"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-white">3. Modell mentése és megosztása</h4>
                <p className="text-xs text-gray-400 mt-1">A folyamat befejeztével a szkript elmenti a módosított súlyú modellt. Ezt feltöltheted a Hugging Face Hub-ra saját fiókod alá, vagy betöltheted lokálisan:</p>
                <div className="bg-black/45 p-2.5 rounded-lg border border-[#222] font-mono text-[10px] text-gray-400 mt-2 leading-relaxed">
                  # Mentés a Python kódban:<br/>
                  model.save_pretrained("./abliterated-model")<br/>
                  tokenizer.save_pretrained("./abliterated-model")
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-950/15 border border-blue-500/20 p-4 rounded-xl mt-2 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-blue-400" />
              Hogyan töltheted be a cenzúrázatlan modelleket az alkalmazásba?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Az általunk létrehozott vagy más fejlesztők által már abliterált modelleket (mint a népszerű <code className="text-blue-300">cognitivecomputations/dolphin-2.9.2-qwen2-7b</code>) rendkívül egyszerűen betöltheted a rendszerünkbe:
            </p>
            <ol className="text-xs text-gray-400 list-decimal pl-4 flex flex-col gap-1.5 mt-1">
              <li>Lépj vissza az <strong>💬 Okos Chat</strong> fülre.</li>
              <li>A modellválasztónál állítsd be a <strong>Hugging Face motor</strong> opciót.</li>
              <li>Kapcsold be az <strong>Abliterált Mód (Cenzúrázatlan)</strong> kapcsolót. Ez automatikusan átirányít a Dolphin modellre.</li>
              <li>A keresőben vagy az egyéni mezőben bármilyen más Hugging Face modell azonosítót is megadhatsz, amely abliterált súlyokkal rendelkezik!</li>
            </ol>
            <div className="mt-2.5 flex items-center justify-start gap-4">
              <a 
                href="https://huggingface.co/models?search=abliterated" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Abliterált modellek böngészése Hugging Face-en
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
