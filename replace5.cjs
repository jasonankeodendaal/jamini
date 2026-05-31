const fs = require('fs');

let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// The brand logo block
const brandLogoRegex = /<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Brand Logo \(Product Brand\)<\/h3>([\s\S]*?)<\/label>\s*<\/div>\s*<\/div>/;
const matchBrand = content.match(brandLogoRegex);
if (matchBrand) {
    let duplicate = matchBrand[0]
        .replace(/Brand Logo \(Product Brand\)/g, "Brand Logo (Light Background)")
        .replace(/brandLogoAsset/g, "brandLogoLightAsset")
        .replace(/'brandLogo'/g, "'brandLogoLight'")
        .replace(/"Brand Logo"/g, '"Brand Logo (Light)"');
    content = content.replace(brandLogoRegex, (match) => {
        return match.replace(/Brand Logo \(Product Brand\)/g, "Brand Logo (Dark Background)") + "\n\n                        <div className=\"space-y-2\">\n                            " + duplicate;
    });
}

// The company logo block
const companyLogoRegex = /<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Company Logo \(Secondary\)<\/h3>([\s\S]*?)<\/label>\s*<\/div>\s*<\/div>/;
const matchCompany = content.match(companyLogoRegex);
if (matchCompany) {
    let duplicate = matchCompany[0]
        .replace(/Company Logo \(Secondary\)/g, "Company Logo (Light Background)")
        .replace(/companyLogoAsset/g, "companyLogoLightAsset")
        .replace(/'companyLogo'/g, "'companyLogoLight'")
        .replace(/"Company Logo"/g, '"Company Logo (Light)"');
    content = content.replace(companyLogoRegex, (match) => {
        return match.replace(/Company Logo \(Secondary\)/g, "Company Logo (Dark Background)") + "\n\n                        <div className=\"space-y-2\">\n                            " + duplicate;
    });
}

fs.writeFileSync(file, content);
