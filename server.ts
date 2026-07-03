import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client with standard telemetry headers
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Config check to let the UI know if keys are present
  app.get("/api/config", (req, res) => {
    res.json({
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasHfToken: !!process.env.HF_TOKEN,
    });
  });

  // API Chat Route with Streaming (SSE)
  app.post("/api/chat", async (req, res) => {
    const { engine, model, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Hiányzó vagy érvénytelen üzenet előzmény." });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      if (engine === "gemini") {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("Rendszerhiba: A GEMINI_API_KEY nincs beállítva a szerveren!");
        }

        // Map messages to Gemini Content type
        const contents = messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const responseStream = await ai.models.generateContentStream({
          model: model || "gemini-3.5-flash",
          contents: contents,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        // Hugging Face Engine
        const hfModel = model || "meta-llama/Meta-Llama-3.1-8B-Instruct";
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.HF_TOKEN ? { 'Authorization': `Bearer ${process.env.HF_TOKEN}` } : {})
          },
          body: JSON.stringify({
            model: hfModel,
            messages: messages,
            max_tokens: 800,
            stream: true
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`A kiválasztott Hugging Face modell jelenleg túlterhelt, nem érhető el ingyenesen vagy hitelesítést igényel. Hiba: ${errText || response.statusText}`);
        }

        const reader = response.body;
        if (!reader) {
          throw new Error("Sikertelen válaszcsatorna-nyitás a Hugging Face szerverrel.");
        }

        const decoder = new TextDecoder();
        const anyReader = reader as any;
        
        if (typeof anyReader[Symbol.asyncIterator] === 'function') {
          for await (const chunk of anyReader) {
            const chunkStr = decoder.decode(chunk, { stream: true });
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const text = data.choices?.[0]?.delta?.content;
                  if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                  }
                } catch (err) {
                  // Ignore partial parsing errors
                }
              }
            }
          }
        } else {
          // Fallback stream reader
          const streamReader = anyReader.getReader();
          while (true) {
            const { done, value } = await streamReader.read();
            if (done) break;
            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const text = data.choices?.[0]?.delta?.content;
                  if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                  }
                } catch (err) {
                  // Ignore
                }
              }
            }
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "Ismeretlen hiba történt a szerveren." })}\n\n`);
      res.end();
    }
  });

  // Serve static assets and SPA pages
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
