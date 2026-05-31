const fs = require('fs');
const files = ['src/lib/gemini.ts', 'src/components/StoryboardView.tsx', 'src/components/VoiceAssistant.tsx', 'src/App.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/new GoogleGenAI\(\{ apiKey: typeof key !== 'undefined' \? key : apiKey, httpOptions: \{ headers: \{ 'User-Agent': 'aistudio-build' \} \} \}\)/g, 
        "new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })");
    fs.writeFileSync(file, content);
  }
});
