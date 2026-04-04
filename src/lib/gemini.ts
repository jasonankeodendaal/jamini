import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    // Support multiple keys separated by commas
    const keysStr = 
      // @ts-ignore
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEYS) || 
      // @ts-ignore
      (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEYS) ||
      // @ts-ignore
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
      // @ts-ignore
      (typeof process !== 'undefined' && process.env && (process.env.API_KEY || process.env.GEMINI_API_KEY)) || 
      '';
    
    if (keysStr) {
      this.keys = keysStr.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    }
  }

  getCurrentKey(): string {
    return this.keys.length > 0 ? this.keys[this.currentIndex] : '';
  }

  rotateKey(): boolean {
    if (this.keys.length <= 1) return false;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return true;
  }
  
  getKeyCount(): number {
    return this.keys.length;
  }
}

export const apiKeyManager = new ApiKeyManager();

export async function executeWithKeyRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const maxAttempts = Math.max(apiKeyManager.getKeyCount(), 1);
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const key = apiKeyManager.getCurrentKey();
      const ai = new GoogleGenAI({ apiKey: key });
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message?.toLowerCase() || '';
      const isQuotaError = errorMessage.includes('quota') || 
                           error?.status === 429 || 
                           errorMessage.includes('too many requests') ||
                           errorMessage.includes('resource exhausted');
      
      if (isQuotaError && attempt < maxAttempts) {
        apiKeyManager.rotateKey();
        console.warn(`Quota exceeded. Retrying with next API key (Attempt ${attempt + 1} of ${maxAttempts})...`);
        // Add a small delay to avoid hammering the API and allow burst limits to reset
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`All API keys have exceeded their quota or failed. Last error: ${lastError?.message || 'Unknown error'}`);
}
