import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ModelSelector, { HF_MODELS } from "./components/ModelSelector";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";
import { Message, EngineType, ConfigStatus } from "./types";
import { AlertCircle, Terminal, HelpCircle } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [engine, setEngine] = useState<EngineType>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [config, setConfig] = useState<ConfigStatus>({ hasGeminiKey: false, hasHfToken: false });
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("freeai_chat_history");
    const storedEngine = localStorage.getItem("freeai_chat_engine");
    const storedModel = localStorage.getItem("freeai_chat_model");
    
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
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

    fetchConfig();
  }, []);

  // Save conversation state when modified
  useEffect(() => {
    localStorage.setItem("freeai_chat_history", JSON.stringify(messages));
    localStorage.setItem("freeai_chat_engine", engine);
    localStorage.setItem("freeai_chat_model", selectedModel);
  }, [messages, engine, selectedModel]);

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

  const handleSend = async (content: string) => {
    if (isGenerating) return;

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
          messages: payloadMessages
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
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Biztosan törölni szeretnéd a beszélgetési előzményeket?")) {
      setMessages([]);
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

        {/* Configuration selectors */}
        <div className="px-4 md:px-6 pt-4 pb-2">
          <ModelSelector
            engine={engine}
            setEngine={setEngine}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onClearChat={handleClearChat}
            messageCount={messages.length}
          />
        </div>

        {/* Main Conversation viewport */}
        <div className="flex-1 flex flex-col px-4 md:px-6 min-h-[300px]">
          <ChatArea
            messages={messages}
            isGenerating={isGenerating}
            activeModelName={getActiveModelName()}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Input panel */}
        <ChatInput
          onSend={handleSend}
          isGenerating={isGenerating}
          disabled={!config.hasGeminiKey && engine === "gemini"}
        />
        
      </div>
    </div>
  );
}
