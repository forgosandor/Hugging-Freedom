import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import ModelSelector, { HF_MODELS } from "./components/ModelSelector";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";
import ImageGenerator from "./components/ImageGenerator";
import VisionAnalyzer from "./components/VisionAnalyzer";
import MusicComposer from "./components/MusicComposer";
import TTSPlayer from "./components/TTSPlayer";
import AbliterationDashboard from "./components/AbliterationDashboard";
import { Message, EngineType, ConfigStatus } from "./types";
import { AlertCircle, MessageSquare, Image as ImageIcon, Eye, Music, Volume2, Cpu } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "image" | "vision" | "music" | "tts" | "abliteration">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [engine, setEngine] = useState<EngineType>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [config, setConfig] = useState<ConfigStatus>({ hasGeminiKey: false, hasHfToken: false });
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abliteratedMode, setAbliteratedMode] = useState<boolean>(false);
  const [trendingModels, setTrendingModels] = useState<any[]>([]);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);

  const activeReaderRef = useRef<any>(null);

  const handleStop = async () => {
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel();
      } catch (e) {
        console.error("Failed to cancel reader stream:", e);
      }
      activeReaderRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleRefreshStarters = async () => {
    await fetchSuggestedFollowUps([]);
  };

  // Load chat history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("freeai_chat_history");
    const storedEngine = localStorage.getItem("freeai_chat_engine");
    const storedModel = localStorage.getItem("freeai_chat_model");
    const storedAbliterated = localStorage.getItem("freeai_chat_abliterated");
    
    let loadedMessages: Message[] = [];
    if (stored) {
      try {
        loadedMessages = JSON.parse(stored);
        setMessages(loadedMessages);
      } catch (e) {
        console.error("Failed to load stored chat history", e);
      }
    }
    if (storedEngine === "gemini" || storedEngine === "huggingface") {
      setEngine(storedEngine);
    }
    if (storedModel) {
      setSelectedModel(storedModel);
    }
    if (storedAbliterated) {
      setAbliteratedMode(storedAbliterated === "true");
    }

    fetchConfig();
    fetchTrendingModels();
    
    if (loadedMessages.length > 0) {
      fetchSuggestedFollowUps(loadedMessages);
    }
  }, []);

  // Save conversation state when modified
  useEffect(() => {
    localStorage.setItem("freeai_chat_history", JSON.stringify(messages));
    localStorage.setItem("freeai_chat_engine", engine);
    localStorage.setItem("freeai_chat_model", selectedModel);
    localStorage.setItem("freeai_chat_abliterated", String(abliteratedMode));
  }, [messages, engine, selectedModel, abliteratedMode]);

  const handleAbliteratedModeChange = (enabled: boolean) => {
    setAbliteratedMode(enabled);
    if (enabled) {
      if (engine === "huggingface") {
        setSelectedModel("cognitivecomputations/dolphin-2.9.2-qwen2-7b");
      }
    } else {
      if (engine === "huggingface" && selectedModel === "cognitivecomputations/dolphin-2.9.2-qwen2-7b") {
        setSelectedModel("meta-llama/Meta-Llama-3.1-8B-Instruct");
      }
    }
  };

  const fetchSuggestedFollowUps = async (currentMessages: Message[]) => {
    if (!currentMessages) return;
    setIsGeneratingSuggestions(true);
    try {
      const res = await fetch("/api/suggested-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedFollowUps(data);
      }
    } catch (e) {
      console.error("Failed to fetch suggested follow-ups", e);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Failed to fetch backend configuration", e);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchTrendingModels = async () => {
    try {
      const res = await fetch("/api/trending-models");
      if (res.ok) {
        const data = await res.json();
        setTrendingModels(data);
      }
    } catch (e) {
      console.error("Failed to fetch trending models", e);
    }
  };

  const handleSend = async (content: string) => {
    if (isGenerating) return;

    // Clear previous suggestions so they don't show during AI response generation
    setSuggestedFollowUps([]);

    const userTime = new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: userTime
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      // Clean messages list to send to server (removing browser local properties if any, keeping role & content)
      const payloadMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine,
          model: selectedModel,
          messages: payloadMessages,
          abliteratedMode
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || `Szerver hiba: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Nem sikerült megnyitni a stream válaszcsatornát.");
      }
      activeReaderRef.current = reader;

      const decoder = new TextDecoder();
      let streamText = "";
      const assistantTime = new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });

      // Append initial blank assistant message for real-time updates
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "", timestamp: assistantTime }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.text) {
                streamText += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: streamText
                    };
                  }
                  return updated;
                });
              }
            } catch (err: any) {
              if (err.message && (err.message.includes("Hugging Face") || err.message.includes("Rendszerhiba"))) {
                throw err;
              }
            }
          }
        }
      }

      // Generation successful and completed! Fetch suggestions using complete context.
      const finalAssistantMessage: Message = {
        role: "assistant",
        content: streamText,
        timestamp: assistantTime
      };
      fetchSuggestedFollowUps([...updatedMessages, finalAssistantMessage]);

    } catch (error: any) {
      console.error("Transmission failed:", error);
      const errMsg = error.message || "Csatlakozási hiba történt a szerverrel.";
      
      // Append or replace assistant message with error information
      setMessages(prev => {
        // If the last message was a blank or incomplete assistant message, update it, otherwise create new
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        
        if (lastMsg && lastMsg.role === "assistant") {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: lastMsg.content 
              ? `${lastMsg.content}\n\n⚠️ **Hiba történt:** ${errMsg}`
              : `⚠️ **Sikertelen generálás:** ${errMsg}`
          };
          return updated;
        } else {
          return [
            ...updated,
            {
              role: "assistant",
              content: `⚠️ **Sikertelen generálás:** ${errMsg}`,
              timestamp: new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })
            }
          ];
        }
      });
    } finally {
      setIsGenerating(false);
      activeReaderRef.current = null;
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Biztosan törölni szeretnéd a beszélgetési előzményeket?")) {
      setMessages([]);
      setSuggestedFollowUps([]);
      localStorage.removeItem("freeai_chat_history");
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    handleSend(prompt);
  };

  // Get active model display name
  const getActiveModelName = () => {
    if (engine === "gemini") return "Google Gemini 3.5 Flash";
    const hf = HF_MODELS.find(m => m.id === selectedModel);
    return hf ? hf.name : "Hugging Face Modell";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] antialiased selection:bg-blue-500/20 selection:text-white flex items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-4xl min-h-screen md:min-h-[calc(100vh-3rem)] md:rounded-3xl bg-[#0A0A0A] md:shadow-2xl md:border md:border-[#262626] flex flex-col justify-between overflow-hidden">
        
        {/* Header section with branding and status */}
        <div className="px-4 md:px-6">
          <Header
            config={config}
            activeEngine={engine}
            isLoadingConfig={isLoadingConfig}
          />
        </div>

        {/* Server missing configurations alert banner */}
        {!isLoadingConfig && !config.hasGeminiKey && (
          <div className="mx-4 md:mx-6 mt-3 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
            <div>
              <strong>Rendszerfigyelmeztetés:</strong> A Gemini API kulcs nincs beállítva. Kérjük, nyisd meg a <strong>Settings &gt; Secrets</strong> menüpontot az AI Studio felületén és add meg a <code>GEMINI_API_KEY</code>-t.
            </div>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="px-4 md:px-6 mt-4 border-b border-[#262626] flex flex-wrap gap-2 md:gap-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>💬 Okos Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "image"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>🎨 Kép Generátor (Flux)</span>
          </button>
          <button
            onClick={() => setActiveTab("vision")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "vision"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>👁️ Kép Elemző (Vision)</span>
          </button>
          <button
            onClick={() => setActiveTab("music")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "music"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <Music className="h-4 w-4" />
            <span>🎵 AI Zeneszerző</span>
          </button>
          <button
            onClick={() => setActiveTab("tts")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "tts"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>🔊 Szöveg Felolvasó (TTS)</span>
          </button>
          <button
            onClick={() => setActiveTab("abliteration")}
            className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "abliteration"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-[#888888] hover:text-white"
            }`}
          >
            <Cpu className="h-4 w-4 text-blue-400 animate-pulse" />
            <span>⚡ Abliteráció (Rep-Eng)</span>
          </button>
        </div>

        {/* Dynamic Content Views based on activeTab */}
        {activeTab === "chat" && (
          <>
            {/* Configuration selectors */}
            <div className="px-4 md:px-6 pt-4 pb-2">
              <ModelSelector
                engine={engine}
                setEngine={setEngine}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                onClearChat={handleClearChat}
                messageCount={messages.length}
                abliteratedMode={abliteratedMode}
                onAbliteratedModeChange={handleAbliteratedModeChange}
                trendingModels={trendingModels}
              />
            </div>

            {/* Main Conversation viewport */}
            <div className="flex-1 flex flex-col px-4 md:px-6 min-h-[300px]">
              <ChatArea
                messages={messages}
                isGenerating={isGenerating}
                activeModelName={getActiveModelName()}
                onSuggestionClick={handleSuggestionClick}
                suggestedFollowUps={suggestedFollowUps}
                isGeneratingSuggestions={isGeneratingSuggestions}
                onRefreshStarters={handleRefreshStarters}
              />
            </div>

            {/* Input panel */}
            <ChatInput
              onSend={handleSend}
              isGenerating={isGenerating}
              disabled={!config.hasGeminiKey && engine === "gemini"}
              onStop={handleStop}
            />
          </>
        )}

        {activeTab === "image" && (
          <div className="flex-1 px-4 md:px-6 overflow-y-auto min-h-[400px]">
            <ImageGenerator config={config} abliteratedMode={abliteratedMode} />
          </div>
        )}

        {activeTab === "vision" && (
          <div className="flex-1 px-4 md:px-6 overflow-y-auto min-h-[400px]">
            <VisionAnalyzer config={config} />
          </div>
        )}

        {activeTab === "music" && (
          <div className="flex-1 px-4 md:px-6 overflow-y-auto min-h-[400px]">
            <MusicComposer config={config} />
          </div>
        )}

        {activeTab === "tts" && (
          <div className="flex-1 px-4 md:px-6 overflow-y-auto min-h-[400px]">
            <TTSPlayer />
          </div>
        )}

        {activeTab === "abliteration" && (
          <div className="flex-1 px-4 md:px-6 overflow-y-auto min-h-[400px]">
            <AbliterationDashboard />
          </div>
        )}
        
      </div>
    </div>
  );
}
