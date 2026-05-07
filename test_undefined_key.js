import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: undefined });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
