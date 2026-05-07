import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: 'dummy' });
async function run() {
  try {
    const parts = [{ text: "hello" }];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
    });
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
