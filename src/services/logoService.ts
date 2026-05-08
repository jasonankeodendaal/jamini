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
  options: LogoOptions
) => {
  const modelToUse = options.model || 'gemini-2.0-flash';
  const referenceContext = options.referenceImages && options.referenceImages.length > 0 
    ? ` Influence the design using the visual style, shapes, or concepts from the provided reference images.`
    : '';

  const basePrompt = `Professional minimal logo for JAMINI Studio. Theme: ${options.style || 'Modern, AI-centric'}. Style: Minimalist, sophisticated. Color palette: Indigo, Neon Fuchsia, Deep Black. No text or very clean sans-serif text.${referenceContext}`;

  const generate = async (bgPrompt: string) => {
    const payload: any = {
      model: modelToUse,
      prompt: `${basePrompt} Background: ${bgPrompt}.`,
    };

    if (options.referenceImages && options.referenceImages.length > 0) {
      // Gemini image models might support conditioning, otherwise we describe them or use them as parts of multi-modal prompt if supported by the SDK
      // For now, we assume standard image generation but we can pass them if the model supports it.
      // If generateImages doesn't support seeds/references directly in this SDK version, we at least prepared the prompt.
    }

    const response = await ai.models.generateImages(payload);
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/jpeg;base64,${base64}` : null;
  };

  const [darkLogoUrl, lightLogoUrl] = await Promise.all([
    generate("Solid dark black background"),
    generate("Solid light white background")
  ]);

  return { darkLogoUrl, lightLogoUrl };
};

export const generateCIBible = async (
  darkLogoUrl: string | null,
  lightLogoUrl: string | null,
  brandName: string = "JAMINI Studio"
) => {
  const pdf = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;

  // --- PAGE 1: COVER ---
  pdf.setFillColor(10, 10, 12); // Deep Black
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative Accent
  pdf.setFillColor(79, 70, 229); // Indigo
  pdf.rect(0, 0, 5, pageHeight, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(48);
  pdf.setFont("helvetica", "bold");
  pdf.text(brandName, margin, 80);
  
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150, 150, 150);
  pdf.text("CORPORATE IDENTITY BIBLE", margin, 95);
  
  pdf.setDrawColor(255, 255, 255, 0.2);
  pdf.line(margin, 105, 100, 105);

  pdf.setFontSize(10);
  pdf.text("© 2026 JAMINI DIGITAL SYSTEMS", margin, 270);
  pdf.text("VERSION 1.0 (AI GENERATED)", margin, 275);

  // --- PAGE 2: LOGO ECOSYSTEM ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42); // Navy Dark
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("01. THE LOGO ECOSYSTEM", margin, 35);
  
  pdf.setFontSize(11);
  pdf.setTextColor(180, 180, 180);
  pdf.text("The visual mark represents the convergence of human creativity and synthetic intelligence.", margin, 45);

  // Dark Variant
  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, 60, 80, 80, 'F');
  if (darkLogoUrl) {
    pdf.addImage(darkLogoUrl, 'JPEG', margin + 5, 65, 70, 70);
  }
  pdf.setTextColor(255, 255, 255);
  pdf.text("PRIMARY DARK VARIANT", margin, 150);

  // Light Variant
  pdf.setFillColor(255, 255, 255);
  pdf.rect(110, 60, 80, 80, 'F');
  if (lightLogoUrl) {
    pdf.addImage(lightLogoUrl, 'JPEG', 115, 65, 70, 70);
  }
  pdf.setTextColor(255, 255, 255);
  pdf.text("SECONDARY LIGHT VARIANT", 110, 150);

  // --- PAGE 3: COLOR & TYPE ---
  pdf.addPage();
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("02. VISUAL DNA", margin, 35);

  // Color Palette
  const colors = [
    { name: "KINETIC GREEN", hex: "#00B359", r: 0, g: 179, b: 89, desc: "Action & Success" },
    { name: "NEON LIME", hex: "#A4FF00", r: 164, g: 255, b: 0, desc: "Interaction & Power" },
    { name: "ELECTRIC YELLOW", hex: "#FFFF00", r: 255, g: 255, b: 0, desc: "Detail & Highlight" },
    { name: "DEEP PURPLE", hex: "#4B0082", r: 75, g: 0, b: 130, desc: "Shadow & Depth" }
  ];

  colors.forEach((c, i) => {
    const y = 60 + (i * 35);
    pdf.setFillColor(c.r, c.g, c.b);
    pdf.rect(margin, y, 30, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text(c.name, margin + 40, y + 10);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`${c.hex} | RGB(${c.r}, ${c.g}, ${c.b})`, margin + 40, y + 18);
    pdf.text(c.desc, margin + 40, y + 25);
  });

  // Typography Section
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("TYPOGRAPHY", margin, 210);
  pdf.setFontSize(36);
  pdf.text("SPACE GROTESK", margin, 225);
  pdf.setFontSize(12);
  pdf.setTextColor(180, 180, 180);
  pdf.text("Modern geometric sans-serif. Used for all primary HUD elements", margin, 235);
  pdf.text("Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz", margin, 245);

  // --- PAGE 4: LOGO CONSTRUCTION ---
  pdf.addPage();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("03. GRID & CONSTRUCTION", margin, 35);

  // Simulated Grid
  pdf.setDrawColor(255, 255, 255, 0.1);
  for(let i=0; i<10; i++) {
    pdf.line(margin + (i*17), 60, margin + (i*17), 160);
    pdf.line(margin, 60 + (i*10), margin + 170, 60 + (i*10));
  }
  
  if (darkLogoUrl) {
    pdf.addImage(darkLogoUrl, 'JPEG', margin + 35, 75, 100, 70);
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text("The mark is centered on a 170x100 virtual grid. Clear space (X) is defined", margin, 180);
  pdf.text("as 1/4 of the total logo height on all sides.", margin, 186);

  // --- PAGE 5: BRAND VOICE ---
  pdf.addPage();
  pdf.setFillColor(10, 10, 12);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("04. BRAND VOICE", margin, 35);
  
  const voice = [
    { title: "INNOVATIVE", text: "Pushing the boundaries of generative art." },
    { title: "SOPHISTICATED", text: "Luxury-tier minimalism for tech elites." },
    { title: "PRECISE", text: "Pixel-perfect execution in every manifestation." },
    { title: "DYNAMIC", text: "Always evolving with the latent space." }
  ];

  voice.forEach((v, i) => {
    pdf.setFontSize(14);
    pdf.setTextColor(164, 255, 0); // Neon Lime
    pdf.text(v.title, margin, 70 + (i * 40));
    pdf.setFontSize(12);
    pdf.setTextColor(200, 200, 200);
    pdf.text(v.text, margin, 80 + (i * 40));
  });

  pdf.setFillColor(79, 70, 229, 0.1);
  pdf.rect(margin, 230, 170, 40, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text("MISSION STATEMENT", margin + 10, 245);
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text("To empower creators with an AI-native brand building ecosystem.", margin + 10, 255);

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
