const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const brandDarkRegex = /<div className="space-y-2">\s*<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Brand Logo \(Product Brand\)<\/h3>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
let brandMatches = content.match(brandDarkRegex);
if (!brandMatches) {
  const alternativeRegex = /<div className="space-y-2">\s*<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Brand Logo \(Product Brand\)<\/h3>([\s\S]*?)<input type="file" ref=\{brandLogoInputRef\}([\s\S]*?)<\/div>/;
  brandMatches = content.match(alternativeRegex);
}
console.log(brandMatches ? "Found brand logo block" : "Brand logo block not found");
if (brandMatches) {
    const brandDarkBlock = brandMatches[0];
    const brandDarkReady = brandDarkBlock.replace('Brand Logo (Product Brand)', 'Brand Logo (Dark Background)').replace('Add Brand Logo', 'Add Brand Logo (Dark Bg)');
    const brandLightBlock = brandDarkBlock
        .replace('Brand Logo (Product Brand)', 'Brand Logo (Light Background)')
        .replace(/brandLogoAsset/g, 'brandLogoLightAsset')
        .replace(/'brandLogo'/g, "'brandLogoLight'")
        .replace(/brandLogoInputRef/g, 'brandLogoLightInputRef')
        .replace('Add Brand Logo', 'Add Brand Logo (Light Bg)');
    
    content = content.replace(brandDarkBlock, brandDarkReady + '\\n\\n' + brandLightBlock);
}

const companyDarkRegex = /<div className="space-y-2">\s*<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Company Logo \(Your Retail Brand\)<\/h3>([\s\S]*?)<input type="file" ref=\{companyLogoInputRef\}([\s\S]*?)<\/div>/;
let companyMatches = content.match(companyDarkRegex);
console.log(companyMatches ? "Found company logo block" : "Company logo block not found");
if (companyMatches) {
    const companyDarkBlock = companyMatches[0];
    const companyDarkReady = companyDarkBlock.replace('Company Logo (Your Retail Brand)', 'Company Logo (Dark Background)').replace('Add Company Logo', 'Add Company Logo (Dark Bg)');
    const companyLightBlock = companyDarkBlock
        .replace('Company Logo (Your Retail Brand)', 'Company Logo (Light Background)')
        .replace(/companyLogoAsset/g, 'companyLogoLightAsset')
        .replace(/'companyLogo'/g, "'companyLogoLight'")
        .replace(/companyLogoInputRef/g, 'companyLogoLightInputRef')
        .replace('Add Company Logo', 'Add Company Logo (Light Bg)');
        
    content = content.replace(companyDarkBlock, companyDarkReady + '\\n\\n' + companyLightBlock);
}

// We define the refs near companyLogoInputRef
content = content.replace(/const companyLogoInputRef = useRef<HTMLInputElement>\(null\);/, 
  "const companyLogoInputRef = useRef<HTMLInputElement>(null);\n  const brandLogoLightInputRef = useRef<HTMLInputElement>(null);\n  const companyLogoLightInputRef = useRef<HTMLInputElement>(null);");

fs.writeFileSync(file, content);
