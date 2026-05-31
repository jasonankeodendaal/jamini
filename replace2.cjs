const fs = require('fs');

let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update EditorState
content = content.replace(/(brandLogoAsset: Asset \| null;)/, "$1\n  brandLogoLightAsset?: Asset | null;");
content = content.replace(/(companyLogoAsset: Asset \| null;)/, "$1\n  companyLogoLightAsset?: Asset | null;");

// Update useState
content = content.replace(/(const \[brandLogoAsset, setBrandLogoAsset\].*)/, "$1\n  const [brandLogoLightAsset, setBrandLogoLightAsset] = useState<Asset | null>(null);");
content = content.replace(/(const \[companyLogoAsset, setCompanyLogoAsset\].*)/, "$1\n  const [companyLogoLightAsset, setCompanyLogoLightAsset] = useState<Asset | null>(null);");

// Update applyState
content = content.replace(/(setBrandLogoAsset\(state.brandLogoAsset\);)/, "$1\n    setBrandLogoLightAsset(state.brandLogoLightAsset || null);");
content = content.replace(/(setCompanyLogoAsset\(state.companyLogoAsset\);)/, "$1\n    setCompanyLogoLightAsset(state.companyLogoLightAsset || null);");

// Update Type Definitions
content = content.replace(/'product' \| 'brandLogo' \| 'companyLogo' \| 'character'/g, 
  "'product' | 'brandLogo' | 'companyLogo' | 'brandLogoLight' | 'companyLogoLight' | 'character'");
content = content.replace(/'product' \| 'brandLogo' \| 'companyLogo' \| 'character' \| 'example' \| 'companyCI'/g, 
  "'product' | 'brandLogo' | 'companyLogo' | 'brandLogoLight' | 'companyLogoLight' | 'character' | 'example' | 'companyCI'");

// Function Implementations updates

// updateAssetPrompt
content = content.replace(/(\} else if \(type === 'brandLogo'\) \{\n\s+setBrandLogoAsset\(prev => prev\?.id === id \? \{ \.\.\.prev, prompt \} : prev\);\n\s+\})/,
  "$1 else if (type === 'brandLogoLight') {\n      setBrandLogoLightAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);\n    }");
content = content.replace(/(\} else if \(type === 'companyLogo'\) \{\n\s+setCompanyLogoAsset\(prev => prev\?.id === id \? \{ \.\.\.prev, prompt \} : prev\);\n\s+\})/,
  "$1 else if (type === 'companyLogoLight') {\n      setCompanyLogoLightAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);\n    }");

// updateAssetDetails
content = content.replace(/(\} else if \(type === 'brandLogo'\) \{\n\s+setBrandLogoAsset\(prev => prev\?.id === id \? \{ \.\.\.prev, \.\.\.updates \} : prev\);\n\s+\})/,
  "$1 else if (type === 'brandLogoLight') {\n      setBrandLogoLightAsset(prev => prev?.id === id ? { ...prev, ...updates } : prev);\n    }");
content = content.replace(/(\} else if \(type === 'companyLogo'\) \{\n\s+setCompanyLogoAsset\(prev => prev\?.id === id \? \{ \.\.\.prev, \.\.\.updates \} : prev\);\n\s+\})/,
  "$1 else if (type === 'companyLogoLight') {\n      setCompanyLogoLightAsset(prev => prev?.id === id ? { ...prev, ...updates } : prev);\n    }");

// vividlyAnalyzeAsset logic
content = content.replace(/(else if \(type === 'brandLogo'\) setBrandLogoAsset\(prev => prev \? \{ \.\.\.prev, isRefining: val \} : prev\);)/,
  "$1\n      else if (type === 'brandLogoLight') setBrandLogoLightAsset(prev => prev ? { ...prev, isRefining: val } : prev);");
content = content.replace(/(else if \(type === 'companyLogo'\) setCompanyLogoAsset\(prev => prev \? \{ \.\.\.prev, isRefining: val \} : prev\);)/,
  "$1\n      else if (type === 'companyLogoLight') setCompanyLogoLightAsset(prev => prev ? { ...prev, isRefining: val } : prev);");

// enhanceAllAssetPrompts
content = content.replace(/(if \(brandLogoAsset\) promises\.push\(vividlyAnalyzeAsset\(brandLogoAsset, 'brandLogo'\)\);)/,
  "$1\n    if (brandLogoLightAsset) promises.push(vividlyAnalyzeAsset(brandLogoLightAsset, 'brandLogoLight'));");
content = content.replace(/(if \(companyLogoAsset\) promises\.push\(vividlyAnalyzeAsset\(companyLogoAsset, 'companyLogo'\)\);)/,
  "$1\n    if (companyLogoLightAsset) promises.push(vividlyAnalyzeAsset(companyLogoLightAsset, 'companyLogoLight'));");

// refineSpecificAssetPrompt ternary
// from: type === 'brandLogo' ? brandLogoAsset : type === 'companyLogo' ? companyLogoAsset : characterAssets.find(a => a.id === id);
// to: type === 'brandLogo' ? brandLogoAsset : type === 'brandLogoLight' ? brandLogoLightAsset : type === 'companyLogo' ? companyLogoAsset : type === 'companyLogoLight' ? companyLogoLightAsset : characterAssets.find(a => a.id === id);
content = content.replace(/type === 'brandLogo' \? brandLogoAsset : type === 'companyLogo' \? companyLogoAsset :/g, 
  "type === 'brandLogo' ? brandLogoAsset : type === 'brandLogoLight' ? brandLogoLightAsset : type === 'companyLogo' ? companyLogoAsset : type === 'companyLogoLight' ? companyLogoLightAsset :");

// vividly processing switch inside refineSpecificAssetPrompt
content = content.replace(/(else if \(type === 'brandLogo'\) setBrandLogoAsset\(prev => prev \? \{ \.\.\.prev, isRefining: val \} : prev\);)/,
  "$1\n      else if (type === 'brandLogoLight') setBrandLogoLightAsset(prev => prev ? { ...prev, isRefining: val } : prev);");
content = content.replace(/(else if \(type === 'companyLogo'\) setCompanyLogoAsset\(prev => prev \? \{ \.\.\.prev, isRefining: val \} : prev\);)/,
  "$1\n      else if (type === 'companyLogoLight') setCompanyLogoLightAsset(prev => prev ? { ...prev, isRefining: val } : prev);");

// handleFileUpload
content = content.replace(/(else if \(type === 'brandLogo'\) setBrandLogoAsset\(asset\);)/,
  "$1\n        else if (type === 'brandLogoLight') setBrandLogoLightAsset(asset);");
content = content.replace(/(else if \(type === 'companyLogo'\) setCompanyLogoAsset\(asset\);)/,
  "$1\n        else if (type === 'companyLogoLight') setCompanyLogoLightAsset(asset);");

// trigger auto enhance in handleFileUpload
content = content.replace(/if \(type === 'product' \|\| type === 'brandLogo' \|\| type === 'companyLogo' \|\| type === 'character'\) \{/g,
  "if (type === 'product' || type === 'brandLogo' || type === 'companyLogo' || type === 'brandLogoLight' || type === 'companyLogoLight' || type === 'character') {");

// removeAsset
content = content.replace(/(else if \(type === 'brandLogo'\) setBrandLogoAsset\(null\);)/,
  "$1\n    else if (type === 'brandLogoLight') setBrandLogoLightAsset(null);");
content = content.replace(/(else if \(type === 'companyLogo'\) setCompanyLogoAsset\(null\);)/,
  "$1\n    else if (type === 'companyLogoLight') setCompanyLogoLightAsset(null);");

fs.writeFileSync(file, content);
