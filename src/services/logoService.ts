import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";

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

  const renderHeader = (pageNumber: number, sectionTitle: string) => {
     pdf.setFontSize(8);
     pdf.setTextColor(100, 100, 100);
     pdf.text(`${brandName.toUpperCase()} - AUTOMATED BRAND IDENTITY BIBLE - PAGE ${pageNumber}`, margin, 15);
     pdf.setDrawColor(255, 255, 255, 0.1);
     pdf.line(margin, 20, pageWidth - margin, 20);
  };

  // --- PAGE 1: COVER ---
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
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
  pdf.text("© 2026 BRAND SYSTEMS", margin, 270);
  pdf.text("VERSION 2.0 (AI GENERATED)", margin, 275);

  // --- PAGE 2: LOGO SUITE ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(2, "LOGO SUITE");
  
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

  // Favicon + Small scale
  pdf.setFillColor(20, 20, 20);
  pdf.rect(margin, 140, 20, 20, 'F');
  if (darkLogoUrl) pdf.addImage(darkLogoUrl, 'JPEG', margin+2, 142, 16, 16);
  pdf.text("RESPONSIVE FAVICON (32x32px)", margin+25, 152);

  // --- PAGE 3: BRAND BOOK RULES (CLEAR SPACE) ---
  pdf.addPage();
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(3, "BRAND BOOK RULES");

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

  pdf.setFontSize(14);
  pdf.setTextColor(255, 100, 100);
  pdf.text("PROHIBITED MODIFICATIONS", margin, 200);
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text("1. Do not distort, stretch, or warp the logo.", margin, 215);
  pdf.text("2. Do not apply drop shadows, glows, or unapproved gradients.", margin, 222);
  pdf.text("3. Do not change the defined color palette or structural layout.", margin, 229);


  // --- PAGE 4: COLOR PALETTE ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(4, "COLOR PALETTE");

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

  // --- PAGE 5: TYPOGRAPHY ---
  pdf.addPage();
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(5, "TYPOGRAPHY");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("04. TYPOGRAPHY", margin, 40);

  pdf.setFontSize(12);
  pdf.setTextColor(180, 180, 180);
  pdf.text("Primary and secondary typefaces with structural rules.", margin, 50);

  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("PRIMARY DISPLAY: SPACE GROTESK (BOLD)", margin, 80);
  pdf.setFontSize(30);
  pdf.text("Aa Bb Cc 123", margin, 95);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Usage: Headers, hero titles. Tracking: +0.02em. Leading: 1.1.", margin, 105);

  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("SECONDARY BODY: INTER (REGULAR)", margin, 130);
  pdf.setFontSize(20);
  pdf.setFont("helvetica");
  pdf.text("Aa Bb Cc Dd Ee Ff Gg 123456789", margin, 145);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Usage: Body copy, long-form text. Tracking: 0em. Leading: 1.5. Fallback: Arial.", margin, 155);

  // --- PAGE 6: GRAPHIC DEVICES & ICONOGRAPHY ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(6, "ICONOGRAPHY & DEVICES");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("05. ICONOGRAPHY & DEVICES", margin, 40);
  
  pdf.setFontSize(14);
  pdf.setTextColor(164, 255, 0);
  pdf.text("VECTOR ALIGNMENT & STYLING", margin, 65);
  
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1);
  pdf.circle(margin + 15, 90, 10, 'S');
  pdf.rect(margin + 40, 80, 20, 20, 'S');
  pdf.roundedRect(margin + 80, 80, 20, 20, 3, 3, 'S');

  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  pdf.text("Icons use uniform 2px stroke weights. Border radii match brand typography curves.", margin, 115);

  pdf.setFontSize(14);
  pdf.setTextColor(164, 255, 0);
  pdf.text("GRAPHIC DEVICES / TEXTURES", margin, 150);
  
  // Custom texture 
  pdf.setDrawColor(255, 255, 255, 0.05);
  for(let i=0; i<15; i++) {
    pdf.line(margin, 160 + (i*4), margin + 60, 160 + (i*4));
    pdf.line(margin + (i*4), 160, margin + (i*4), 220);
  }
  pdf.setTextColor(180, 180, 180);
  pdf.text("Repeating architectural grid matrices represent technical stability.", margin, 235);


  // --- PAGE 7: IMAGERY GUIDELINES ---
  pdf.addPage();
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(7, "IMAGERY GUIDELINES");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("06. IMAGERY GUIDELINES", margin, 40);

  // We'll mimic an image guideline layout
  pdf.setFillColor(30, 30, 35);
  pdf.rect(margin, 60, 80, 50, 'F');
  pdf.rect(110, 60, 80, 50, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(200, 200, 200);
  pdf.text("PHOTOGRAPHY STYLE:", margin, 130);
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text("High-contrast, moody lighting, desaturated shadows with neon subject highlights. Composition usually features negative space on the left or top to allow for text.", margin, 140, { maxWidth: 170 });

  // --- PAGE 8: BRAND ASSETS (STATIONERY, DIGITAL, UI) ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  renderHeader(8, "BRAND ASSETS KITS");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("07. APPLICATION & ASSETS", margin, 40);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 179, 89);
  pdf.text("STATIONERY KIT", margin, 70);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Business Cards: 85x55mm, Printed on matte black 400gsm with clear spot UV logo.", margin, 80);
  pdf.text("Letterheads: A4 clean layout, typography anchored to left margin.", margin, 87);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 179, 89);
  pdf.text("DIGITAL COLLATERAL", margin, 115);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Social Avatars: Must use Primary Dark variant on #000000. No text overlays.", margin, 125);
  pdf.text("Email Signatures: HTML standard Roboto fallback, #A4FF00 accent line.", margin, 132);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 179, 89);
  pdf.text("UI/UX COMPONENT LIBRARY", margin, 160);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 150, 150);
  pdf.text("Buttons: Sharp corners (0px radius) for structural, 8px for fluid interactive elements.", margin, 170);
  pdf.text("Navigation: Glassmorphism / backdrop-blur with 15% white opacity.", margin, 177);

  // --- PAGE 9+: AI GENERATED CI SPECIFICATIONS ---
  if (ciMarkdown) {
    let pageNum = 9;
    pdf.addPage();
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    renderHeader(pageNum, "STRATEGIC CI SPECIFICATIONS");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("08. STRATEGIC CI SPECIFICATIONS", margin, 40);

    const lines = ciMarkdown.split('\n');
    let y = 60;
    
    for (let i = 0; i < lines.length; i++) {
       let line = lines[i];
       if (y > pageHeight - margin - 10) {
           pageNum++;
           pdf.addPage();
           pdf.setFillColor(15, 23, 42);
           pdf.rect(0, 0, pageWidth, pageHeight, 'F');
           renderHeader(pageNum, "STRATEGIC CI SPECIFICATIONS");
           y = 40;
       }

       if (line.trim() === '') {
           y += 5;
           continue;
       }

       if (line.startsWith('# ')) {
           pdf.setFontSize(20);
           pdf.setTextColor(255, 255, 255);
           pdf.text(line.replace('# ', ''), margin, y);
           y += 12;
       } else if (line.startsWith('## ')) {
           pdf.setFontSize(16);
           pdf.setTextColor(164, 255, 0);
           pdf.text(line.replace('## ', ''), margin, y);
           y += 10;
       } else if (line.startsWith('### ')) {
           pdf.setFontSize(13);
           pdf.setTextColor(0, 179, 89);
           pdf.text(line.replace('### ', ''), margin, y);
           y += 8;
       } else if (line.startsWith('- ') || line.startsWith('* ')) {
           pdf.setFontSize(10);
           pdf.setTextColor(200, 200, 200);
           const splitText = pdf.splitTextToSize(`• ${line.substring(2)}`, pageWidth - (margin * 2) - 5);
           pdf.text(splitText, margin + 5, y);
           y += (splitText.length * 5) + 3;
       } else {
           pdf.setFontSize(10);
           pdf.setTextColor(180, 180, 180);
           const cleanLine = line.replace(/\*\*/g, ''); // strip bold temporarily
           const splitText = pdf.splitTextToSize(cleanLine, pageWidth - (margin * 2));
           pdf.text(splitText, margin, y);
           y += (splitText.length * 5) + 3;
       }
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

export const downloadAllFormats = async (dataUrl: string, fileName: string) => {
  // Download PNG
  const pngLink = document.createElement('a');
  pngLink.href = dataUrl;
  pngLink.download = `${fileName}.png`;
  pngLink.click();

  // Download SVG
  downloadAsSVG(dataUrl, fileName);

  // Download PDF
  const pdf = new jsPDF();
  pdf.addImage(dataUrl, 'JPEG', 10, 10, 190, 190);
  pdf.save(`${fileName}.pdf`);
};
