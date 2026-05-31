import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: '' });
async function run() {
  console.log("Calling generateContent...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello'
    });
    console.log("Success");
  } catch (e) {
    console.log("Error:", e.message);
  }
  console.log("Done");
}
run();
