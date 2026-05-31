const fs = require('fs');

let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just replace the exact headings visually.
content = content.replace(/<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Brand Logo \(Product Brand\)<\/h3>/g, 
  '<h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo (Dark Background)</h3>');

content = content.replace(/<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Company Logo \(Secondary\)<\/h3>/g, 
  '<h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Company Logo (Dark Background)</h3>');

fs.writeFileSync(file, content);
