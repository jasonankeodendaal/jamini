const fs = require('fs');

let file = 'src/components/StoryboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/(BRAND LOGO: \$\{editorState\.brandLogoAsset \? 'Provided' : 'None'\})/g,
  "$1\n        BRAND LOGO (LIGHT): ${editorState.brandLogoLightAsset ? 'Provided' : 'None'}");

content = content.replace(/(COMPANY LOGO: \$\{editorState\.companyLogoAsset \? 'Provided' : 'None'\})/g,
  "$1\n        COMPANY LOGO (LIGHT): ${editorState.companyLogoLightAsset ? 'Provided' : 'None'}");

content = content.replace(/\{ label: 'Brand Logo', key: 'brandLogoAsset' \},/g,
  "{ label: 'Brand Logo (Dark)', key: 'brandLogoAsset' },\n                { label: 'Brand Logo (Light)', key: 'brandLogoLightAsset' },");

content = content.replace(/\{ label: 'Company Logo', key: 'companyLogoAsset' \},/g,
  "{ label: 'Company Logo (Dark)', key: 'companyLogoAsset' },\n                { label: 'Company Logo (Light)', key: 'companyLogoLightAsset' },");

content = content.replace(/grid-cols-2 md:grid-cols-5/g, "grid-cols-2 md:grid-cols-7");

fs.writeFileSync(file, content);
