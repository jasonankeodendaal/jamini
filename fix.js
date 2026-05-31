const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/new GoogleGenAI\(\{ apiKey \}\)/g, "new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })");
fs.writeFileSync('src/App.tsx', content);
