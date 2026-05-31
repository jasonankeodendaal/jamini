const fs = require('fs');

let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/disabled=\{isExtractingColors \|\| \(!brandLogoAsset && !companyLogoAsset && characterAssets\.length === 0\)\}/g,
  "disabled={isExtractingColors || (!brandLogoAsset && !brandLogoLightAsset && !companyLogoAsset && !companyLogoLightAsset && characterAssets.length === 0)}");

content = content.replace(/\(!brandLogoAsset && !companyLogoAsset && !characterAsset\)/g,
  "(!brandLogoAsset && !brandLogoLightAsset && !companyLogoAsset && !companyLogoLightAsset && characterAssets.length === 0)");

fs.writeFileSync(file, content);
