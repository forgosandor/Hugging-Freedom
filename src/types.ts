export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type EngineType = "gemini" | "huggingface";

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  engine: EngineType;
}

export interface ConfigStatus {
  hasGeminiKey: boolean;
  hasHfToken: boolean;
}
