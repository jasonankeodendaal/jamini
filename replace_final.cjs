const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const brandDarkStr = `<h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo (Product Brand)</h3>`;
const copyBrandDarkToLight = content.substring(
    content.indexOf('<div className="space-y-2">', content.indexOf(brandDarkStr) - 50),
    content.indexOf('</div>', content.indexOf('brandLogoInputRef}')) + 6
);
const brandLightStr = copyBrandDarkToLight
    .replace('Brand Logo (Product Brand)', 'Brand Logo (Light Background)')
    .replace(/brandLogoAsset/g, 'brandLogoLightAsset')
    .replace(/'brandLogo'/g, "'brandLogoLight'")
    .replace(/brandLogoInputRef/g, 'brandLogoLightInputRef')
    .replace('Add Brand Logo', 'Add Brand Logo (Light Bg)');

const brandDarkReady = copyBrandDarkToLight.replace('Brand Logo (Product Brand)', 'Brand Logo (Dark Background)').replace('Add Brand Logo', 'Add Brand Logo (Dark Bg)');

content = content.replace(copyBrandDarkToLight, brandDarkReady + '\n\n' + brandLightStr);

const companyDarkStr = `<h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Company Logo (Your Retail Brand)</h3>`;
const copyCompanyDarkToLight = content.substring(
    content.indexOf('<div className="space-y-2">', content.indexOf(companyDarkStr) - 50),
    content.indexOf('</div>', content.indexOf('companyLogoInputRef}')) + 6
);

const companyLightStr = copyCompanyDarkToLight
    .replace('Company Logo (Your Retail Brand)', 'Company Logo (Light Background)')
    .replace(/companyLogoAsset/g, 'companyLogoLightAsset')
    .replace(/'companyLogo'/g, "'companyLogoLight'")
    .replace(/companyLogoInputRef/g, 'companyLogoLightInputRef')
    .replace('Add Company Logo', 'Add Company Logo (Light Bg)');
    
const companyDarkReady = copyCompanyDarkToLight.replace('Company Logo (Your Retail Brand)', 'Company Logo (Dark Background)').replace('Add Company Logo', 'Add Company Logo (Dark Bg)');

content = content.replace(copyCompanyDarkToLight, companyDarkReady + '\n\n' + companyLightStr);
fs.writeFileSync(file, content);
