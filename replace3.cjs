const fs = require('fs');
let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/(if \(!brandLogoAsset && !companyLogoAsset && characterAssets\.length === 0\) return;)/,
  "if (!brandLogoAsset && !brandLogoLightAsset && !companyLogoAsset && !companyLogoLightAsset && characterAssets.length === 0) return;");

content = content.replace(/(if \(brandLogoAsset\) parts\.push\(\{ inlineData: \{ data: brandLogoAsset\.data, mimeType: brandLogoAsset\.mimeType \} \}\);)/g,
  "$1\n      if (brandLogoLightAsset) parts.push({ inlineData: { data: brandLogoLightAsset.data, mimeType: brandLogoLightAsset.mimeType } });");
content = content.replace(/(if \(companyLogoAsset\) parts\.push\(\{ inlineData: \{ data: companyLogoAsset\.data, mimeType: companyLogoAsset\.mimeType \} \}\);)/g,
  "$1\n      if (companyLogoLightAsset) parts.push({ inlineData: { data: companyLogoLightAsset.data, mimeType: companyLogoLightAsset.mimeType } });");

// Generate Logo stream - actually generate ci stream, references:
content = content.replace(/\.\.\.\(brandLogoAsset \? \[`Brand Logo Asset.*\] : \[\]\),/g,
  `...(brandLogoAsset ? [\`Brand Logo (Dark Bg) Asset: \${brandLogoAsset.prompt || ''} \${brandLogoAsset.material ? \`| Material: \${brandLogoAsset.material}\` : ''} \${brandLogoAsset.lightingInteraction ? \`| Lighting: \${brandLogoAsset.lightingInteraction}\` : ''} \${brandLogoAsset.position ? \`| Position: \${brandLogoAsset.position}\` : ''} -> CRITICAL: Use for Dark Background contexts. Use exactly as provided.\`] : []),
        ...(brandLogoLightAsset ? [\`Brand Logo (Light Bg) Asset: \${brandLogoLightAsset.prompt || ''} \${brandLogoLightAsset.material ? \`| Material: \${brandLogoLightAsset.material}\` : ''} \${brandLogoLightAsset.lightingInteraction ? \`| Lighting: \${brandLogoLightAsset.lightingInteraction}\` : ''} \${brandLogoLightAsset.position ? \`| Position: \${brandLogoLightAsset.position}\` : ''} -> CRITICAL: Use for Light Background contexts. Use exactly as provided.\`] : []),`);

content = content.replace(/\.\.\.\(companyLogoAsset \? \[`Company Logo Asset.*\] : \[\]\),/g,
  `...(companyLogoAsset ? [\`Company Logo (Dark Bg) Asset: \${companyLogoAsset.prompt || ''} \${companyLogoAsset.material ? \`| Material: \${companyLogoAsset.material}\` : ''} \${companyLogoAsset.lightingInteraction ? \`| Lighting: \${companyLogoAsset.lightingInteraction}\` : ''} \${companyLogoAsset.position ? \`| Position: \${companyLogoAsset.position}\` : ''} -> CRITICAL: Use for Dark Background contexts. Use exactly as provided.\`] : []),
        ...(companyLogoLightAsset ? [\`Company Logo (Light Bg) Asset: \${companyLogoLightAsset.prompt || ''} \${companyLogoLightAsset.material ? \`| Material: \${companyLogoLightAsset.material}\` : ''} \${companyLogoLightAsset.lightingInteraction ? \`| Lighting: \${companyLogoLightAsset.lightingInteraction}\` : ''} \${companyLogoLightAsset.position ? \`| Position: \${companyLogoLightAsset.position}\` : ''} -> CRITICAL: Use for Light Background contexts. Use exactly as provided.\`] : []),`);


content = content.replace(/setBrandLogoAsset\(null\);(\s+)setCompanyLogoAsset\(null\);/g,
  "setBrandLogoAsset(null);\n      setBrandLogoLightAsset(null);\n      setCompanyLogoAsset(null);\n      setCompanyLogoLightAsset(null);");

fs.writeFileSync(file, content);
