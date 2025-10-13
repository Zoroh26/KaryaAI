import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GEMINI_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('Warning: GOOGLE_GEMINI_KEY environment variable not set');
}

export const genAI = new GoogleGenerativeAI(apiKey);
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
