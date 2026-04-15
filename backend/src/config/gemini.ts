import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_GEMINI_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('Warning: GOOGLE_GEMINI_KEY environment variable not set');
}

// Gemini 3 Flash (gemini-3-flash-preview) via the new @google/genai SDK
// Docs: https://ai.google.dev/gemini-api/docs/models
export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const ai = new GoogleGenAI({ apiKey });
