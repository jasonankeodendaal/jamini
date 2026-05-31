const fs = require('fs');

function replaceAll(file) {
  let content = fs.readFileSync(file, 'utf8');

  // EditorState
  content = content.replace(/brandLogoAsset: Asset \| null;/g, "brandLogoDarkAsset: Asset | null;\n  brandLogoLightAsset: Asset | null;");
  content = content.replace(/companyLogoAsset: Asset \| null;/g, "companyLogoDarkAsset: Asset | null;\n  companyLogoLightAsset: Asset | null;");

  // useState
  content = content.replace(/const \[brandLogoAsset, setBrandLogoAsset\] = useState<Asset \| null>\(null\);/g, 
    "const [brandLogoDarkAsset, setBrandLogoDarkAsset] = useState<Asset | null>(null);\n  const [brandLogoLightAsset, setBrandLogoLightAsset] = useState<Asset | null>(null);");
  content = content.replace(/const \[companyLogoAsset, setCompanyLogoAsset\] = useState<Asset \| null>\(null\);/g, 
    "const [companyLogoDarkAsset, setCompanyLogoDarkAsset] = useState<Asset | null>(null);\n  const [companyLogoLightAsset, setCompanyLogoLightAsset] = useState<Asset | null>(null);");

  // applyState
  content = content.replace(/setBrandLogoAsset\(state.brandLogoAsset\);/g, "setBrandLogoDarkAsset(state.brandLogoDarkAsset);\n    setBrandLogoLightAsset(state.brandLogoLightAsset);");
  content = content.replace(/setCompanyLogoAsset\(state.companyLogoAsset\);/g, "setCompanyLogoDarkAsset(state.companyLogoDarkAsset);\n    setCompanyLogoLightAsset(state.companyLogoLightAsset);");

  // type references
  content = content.replace(/'product' \| 'brandLogo' \| 'companyLogo'/g, "'product' | 'brandLogoDark' | 'brandLogoLight' | 'companyLogoDark' | 'companyLogoLight'");
  
  // updateAssetPrompt & updateAssetDetails & removeAsset
  content = content.replace(/else if \(type === 'brandLogo'\) \{\n      setBrandLogoAsset/g, 
    "else if (type === 'brandLogoDark') {\n      setBrandLogoDarkAsset");
  content = content.replace(/else if \(type === 'companyLogo'\) \{\n      setCompanyLogoAsset/g, 
    "else if (type === 'companyLogoDark') {\n      setCompanyLogoDarkAsset");
    
  // We're just appending the Light logic below existing blocks
  content = content.replace(/else if \(type === 'brandLogoDark'\) \{([\s\S]*?)\}/, 
    "else if (type === 'brandLogoDark') {$1} else if (type === 'brandLogoLight') {\n      setBrandLogoLightAsset$1".replace(/setBrandLogoDarkAsset/g, 'setBrandLogoLightAsset'));
  // Not reliable with regex. It's better to manually update the App.tsx with edits or a robust string search.

  fs.writeFileSync(file, content);
}

replaceAll('src/App.tsx');
