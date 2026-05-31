import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface LogoOptions {
  prompt: string;
  style?: string;
  format?: 'png' | 'jpg';
  referenceImages?: string[]; // base64 strings
  model?: string;
}

export const generateLogo = async (
  ai: GoogleGenAI,
  options: LogoOptions,
  onRateLimit?: () => void
) => {
  const modelToUse = options.model || 'gemini-2.5-flash-image';
  const referenceContext = options.referenceImages && options.referenceImages.length > 0
    ? ` Influence the design using the visual style, shapes, or concepts from the provided reference images.`
    : '';

  const basePrompt = `Professional minimal logo for JAMINI Studio. Theme: ${options.style || 'Modern, AI-centric'}. Style: Minimalist, sophisticated. Color palette: Indigo, Neon Fuchsia, Deep Black. No text or very clean sans-serif text.${referenceContext}`;

  const generate = async (bgPrompt: string): Promise<string | null> => {
    const fullPrompt = `${basePrompt} Background: ${bgPrompt}.`;
    
    try {
      if (modelToUse.includes('gemini')) {
        const parts: any[] = [{ text: fullPrompt }];
        if (options.referenceImages) {
          options.referenceImages.forEach(ref => {
            const base64 = ref.includes(',') ? ref.split(',')[1] : ref;
            parts.push({ inlineData: { data: base64, mimeType: "image/jpeg" } });
          });
        }
        
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });
        
        let base64 = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64 = part.inlineData.data;
            break;
          }
        }
        return base64 ? `data:image/jpeg;base64,${base64}` : null;
      } else {
        const payload: any = {
          model: modelToUse,
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          }
        };

        const response = await ai.models.generateImages(payload);
        const base64 = response.generatedImages?.[0]?.image?.imageBytes;
        return base64 ? `data:image/jpeg;base64,${base64}` : null;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('429')) {
        console.warn("[JAMINI] Rate limit reached. Signaling key rotation.");
        if (onRateLimit) onRateLimit();
      }
      throw err;
    }
  };


  // Generate sequentially to avoid rate limits on free tiers
  const darkLogoUrl = await generate("Solid dark black background");
  // Short delay between requests
  await new Promise(resolve => setTimeout(resolve, 2000));
  const lightLogoUrl = await generate("Solid light white background");

  return { darkLogoUrl, lightLogoUrl };
};

export const generateCIBible = async (
  darkLogoUrl: string | null,
  lightLogoUrl: string | null,
  brandName: string = "JAMINI Studio",
  ciMarkdown: string | null = null
) => {
  const pdf = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  let pageCounter = 0;

  const newPage = (backgroundColor: [number, number, number] = [10, 10, 12]) => {
    pageCounter++;
    if (pageCounter > 1) pdf.addPage();
    pdf.setFillColor(...backgroundColor);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${brandName.toUpperCase()} - BRAND IDENTITY BIBLE`, margin, 15);
    pdf.text(`PAGE ${pageCounter}`, pageWidth - margin - 20, 15);
    pdf.setDrawColor(255, 255, 255, 0.1);
    pdf.line(margin, 20, pageWidth - margin, 20);
    
    return pageCounter;
  };

  // --- PAGE 1: COVER ---
  newPage([10, 10, 12]);
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, 5, pageHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(48);
  pdf.setFont("helvetica", "bold");
  pdf.text(brandName, margin, 140);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150, 150, 150);
  pdf.text("CORPORATE IDENTITY BIBLE", margin, 155);
  pdf.setDrawColor(255, 255, 255, 0.2);
  pdf.line(margin, 165, 100, 165);
  pdf.setFontSize(10);
  pdf.text("© 2026 BRAND SYSTEMS - VERSION 2.0", margin, 270);

  // --- PAGE 2: TABLE OF CONTENTS ---
  newPage([15, 23, 42]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("CONTENTS", margin, 40);
  pdf.setFontSize(14);
  const contents = [
    "01. Logo Suite",
    "02. Brand Rules",
    "03. Color Palette",
    "04. Typography",
    "05. Iconography",
    "06. Imagery",
    "07. Application",
    "08. Strategic Specs"
  ];
  contents.forEach((item, i) => {
    pdf.text(item, margin, 70 + (i * 15));
  });

  // --- PAGE 3: LOGO SUITE ---
  newPage([15, 23, 42]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("01. LOGO SUITE", margin, 40);
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text("Primary logo, secondary variations, and monochrome/reversed versions.", margin, 50);

  // Dark/Primary
  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, 60, 60, 60, 'F');
  if (darkLogoUrl) pdf.addImage(darkLogoUrl, 'JPEG', margin + 5, 65, 50, 50);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.text("PRIMARY DARK VARIANT", margin, 126);

  // Light/Reversed
  pdf.setFillColor(255, 255, 255);
  pdf.rect(100, 60, 60, 60, 'F');
  if (lightLogoUrl) pdf.addImage(lightLogoUrl, 'JPEG', 105, 65, 50, 50);
  pdf.text("SECONDARY LIGHT VARIANT", 100, 126);

  // --- PAGE 4: BRAND BOOK RULES ---
  newPage([10, 10, 12]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("02. BRAND BOOK RULES", margin, 40);

  pdf.setFontSize(14);
  pdf.setTextColor(164, 255, 0);
  pdf.text("CLEAR SPACE & MINIMUM SIZING", margin, 60);
  pdf.setDrawColor(255, 255, 255, 0.1);
  for(let i=0; i<6; i++) {
    pdf.line(margin + (i*20), 70, margin + (i*20), 150);
    pdf.line(margin, 70 + (i*16), margin + 100, 70 + (i*16));
  }
  if (darkLogoUrl) pdf.addImage(darkLogoUrl, 'JPEG', margin + 20, 86, 60, 48);

  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  pdf.text("The visual mark must maintain a clear boundary of space equal to 1/4 the logo width.", margin, 165);
  pdf.text("Minimum digital sizing: 24px. Minimum print sizing: 10mm.", margin, 172);

  // --- PAGE 5: COLOR PALETTE ---
  newPage([15, 23, 42]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("03. COLOR PALETTE", margin, 40);

  const colors = [
    { name: "KINETIC GREEN", hex: "#00B359", r: 0, g: 179, b: 89, cmyk: "85, 0, 75, 0", pms: "PANTONE 340 C" },
    { name: "NEON LIME", hex: "#A4FF00", r: 164, g: 255, b: 0, cmyk: "35, 0, 100, 0", pms: "PANTONE 388 C" },
    { name: "ELECTRIC YELLOW", hex: "#FFFF00", r: 255, g: 255, b: 0, cmyk: "0, 0, 100, 0", pms: "PANTONE Yellow C" },
    { name: "DEEP PURPLE", hex: "#4B0082", r: 75, g: 0, b: 130, cmyk: "90, 100, 0, 0", pms: "PANTONE 2685 C" }
  ];

  colors.forEach((c, i) => {
    const y = 60 + (i * 45);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.rect(margin, y, 35, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text(c.name, margin + 45, y + 10);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`HEX: ${c.hex}  |  RGB: ${c.r}, ${c.g}, ${c.b}`, margin + 45, y + 20);
    pdf.text(`CMYK: ${c.cmyk}  |  PMS: ${c.pms}`, margin + 45, y + 27);
  });

  // --- PAGE 6: TYPOGRAPHY ---
  newPage([10, 10, 12]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("04. TYPOGRAPHY", margin, 40);

  pdf.setFontSize(14);
  pdf.text("PRIMARY DISPLAY: SPACE GROTESK", margin, 80);
  pdf.setFontSize(30);
  pdf.text("Aa Bb Cc 123", margin, 95);

  pdf.setFontSize(14);
  pdf.text("SECONDARY BODY: INTER", margin, 130);
  pdf.setFontSize(20);
  pdf.text("Aa Bb Cc Dd Ee Ff Gg 123456789", margin, 145);

  // --- PAGE 7: ICONOGRAPHY ---
  newPage([15, 23, 42]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("05. ICONOGRAPHY", margin, 40);
  
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1);
  pdf.circle(margin + 15, 90, 10, 'S');
  pdf.rect(margin + 40, 80, 20, 20, 'S');
  pdf.roundedRect(margin + 80, 80, 20, 20, 3, 3, 'S');
  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  pdf.text("Icons use uniform 2px stroke weights. Border radii match brand typography curves.", margin, 115);

  // --- PAGE 8: IMAGERY ---
  newPage([10, 10, 12]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("06. IMAGERY RULES", margin, 40);
  pdf.setFontSize(12);
  pdf.text("High-contrast, moody lighting, desaturated shadows.", margin, 60);

  // --- PAGE 9: APPLICATION & ASSETS ---
  newPage([15, 23, 42]);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("07. APPLICATION & ASSETS", margin, 40);
  pdf.setFontSize(12);
  pdf.setTextColor(0, 179, 89);
  pdf.text("STATIONERY, DIGITAL, UI ASSETS", margin, 70);

  // --- PAGE 10+: AI GENERATED STRATEGIC CI SPECIFICATIONS ---
  if (ciMarkdown) {
    const lines = ciMarkdown.split('\n');
    let y = 60;
    
    // We need a specific check for adding pages within the loop
    // Let's create a specialized render helper for the dynamic content
    const renderDynamicContent = (text: string) => {
        // ... (This part was tricky in the original)
        // I will simplify: just check overflow and add page if needed
         if (y + 10 > pageHeight - margin) {
            newPage([15, 23, 42]);
            y = 40;
         }
         pdf.text(text, margin, y);
         y += 10;
    };

    newPage([15, 23, 42]);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("08. STRATEGIC CI SPECS", margin, 40);
    y = 60;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim() === '') { y += 5; continue; }
        
        let fontSize = 10;
        if (line.startsWith('# ')) { fontSize = 20; y += 12; }
        else if (line.startsWith('## ')) { fontSize = 16; y += 10; }
        else if (line.startsWith('### ')) { fontSize = 13; y += 8; }
        
        if (y > pageHeight - margin) {
            newPage([15, 23, 42]);
            y = 40;
        }

        pdf.setFontSize(fontSize);
        pdf.text(line.replace(/#/g, '').trim(), margin, y);
    }
  }

  const pdfBlob = pdf.output('blob');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdfBlob);
  link.download = `${brandName.replace(/\s+/g, '_')}_CI_BIBLE_PRO_${Date.now()}.pdf`;
  link.click();
};

export const downloadAsSVG = (dataUrl: string, fileName: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <image width="1024" height="1024" href="${dataUrl}" />
  </svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const downloadAsEPS = (dataUrl: string, fileName: string) => {
  // EPS is complex to generate client-side, but PDF is often used as a substitute for "vector-ready" handoff
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [1024, 1024]
  });
  pdf.addImage(dataUrl, 'JPEG', 0, 0, 1024, 1024);
  pdf.save(`${fileName}.eps.pdf`); // Common practice to send PDF as EPS substitute for vector-contained bitmaps
};

export const extractColorsFromImage = async (ai: GoogleGenAI, dataUrl: string): Promise<string[]> => {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "Extract the dominant color palette from this logo. Return ONLY a JSON list of hex color codes, e.g., ['#RRGGBB', '#RRGGBB']. Do not include any other text." }
        ]
      }]
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Color extraction failed:", err);
    return [];
  }
};

export const generateAssetKitZip = async (
  brandName: string,
  darkLogoUrl: string | null,
  lightLogoUrl: string | null,
  ciMarkdown: string
) => {
  const zip = new JSZip();
  const folder = zip.folder(brandName.replace(/\s+/g, '_') + "_Asset_Kit");
  
  if (darkLogoUrl) {
    const base64 = darkLogoUrl.split(',')[1];
    folder?.file("logo_dark.png", base64, { base64: true });
    folder?.file("logo_dark.jpg", base64, { base64: true });
  }
  
  if (lightLogoUrl) {
    const base64 = lightLogoUrl.split(',')[1];
    folder?.file("logo_light.png", base64, { base64: true });
    folder?.file("logo_light.jpg", base64, { base64: true });
  }

  folder?.file("README_FIRST.txt", "This Asset Kit contains raster assets for reference.\n\nPLEASE NOTE: True vector files (.ai, .cdr) require manual recreation by a professional designer based on these assets.\n\nFor best results, use these high-resolution images as design guides.");
  
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${brandName.replace(/\s+/g, '_')}_Asset_Kit.zip`);
};
