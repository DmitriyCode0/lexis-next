import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const _models = new Map<string, GenerativeModel>();

export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const FALLBACK_GEMINI_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";

export function getGeminiModel(modelName = DEFAULT_GEMINI_MODEL): GenerativeModel {
  const cached = _models.get(modelName);
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  _models.set(modelName, model);
  return model;
}
