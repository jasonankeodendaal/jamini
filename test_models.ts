import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello'
    });
    console.log("gemini-2.5-flash works");
  } catch (e: any) { console.log("gemini-2.5-flash failed", e.message); }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'hello'
    });
    console.log("gemini-2.5-flash-image works");
  } catch (e: any) { console.log("gemini-2.5-flash-image failed", e.message); }
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'hello',
      config: { numberOfImages: 1 }
    });
    console.log("imagen-3.0-generate-001 works");
  } catch (e: any) { console.log("imagen-3.0-generate-001 failed", e.message); }
}
run();
