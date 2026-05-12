import { jsPDF } from "jspdf";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadVectorFormat = (dataUrl: string, fileName: string, format: string) => {
  // SVG wrapper logic for vector/XML based mock exports
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><image width="1024" height="1024" href="${dataUrl}" /></svg>`;
  
  if (format === 'svg' || format === 'svgz') {
    const blob = new Blob([svgContent], { type: format === 'svgz' ? 'application/gzip' : 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
    return;
  }

  if (format === 'pdf') {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1024, 1024] });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, 1024, 1024);
    pdf.save(`${fileName}.pdf`);
    return;
  }

  // Fallback for AI, CDR, DWG and other proprietary formats for preview capabilities
  // We use the raw buffer with the requested extension. For actual compatibility in the mock, 
  // embedded SVG or PDF payload is the closest universally readable "vector" container 
  // that legacy apps fallback to interpreting. We'll use PDF wrapper for EPS and AI.
  
  if (['ai', 'eps', 'cdr'].includes(format)) {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1024, 1024] });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, 1024, 1024);
    pdf.save(`${fileName}.${format}`); // Software like AI can interpret the PDF wrapper
    return;
  }

  // Other types: mock standard blob download
  fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => {
       const link = document.createElement('a');
       link.href = URL.createObjectURL(blob);
       link.download = `${fileName}.${format}`;
       link.click();
       URL.revokeObjectURL(link.href);
    });
};

export const downloadRasterFormat = (dataUrl: string, fileName: string, format: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${fileName}.${format}`;
  link.click();
};

export const ALL_ADOBE_FORMATS = ['ai', 'ait', 'dwg', 'dxf', 'emf', 'eps', 'fxg', 'pdf', 'svg', 'svgz', 'wmf'];
export const ALL_COREL_FORMATS = ['cdr', 'cdt', 'cgm', 'cmx', 'cpt', 'cpx', 'des', 'pat'];

export const FORMAT_DESCRIPTIONS: Record<string, string> = {
  ai: 'Native working file; retains all unflattened vector data, layers, and effects.',
  ait: 'Illustrator template file; used as a master blueprint to generate new AI files with consistent settings.',
  dwg: 'Native AutoCAD format; used for exporting vector paths to 2D/3D engineering and architectural software.',
  dxf: 'Drawing Exchange Format; an open-standard CAD file used to share drafting data across different platforms.',
  emf: 'Enhanced Metafile; a 32-bit Windows-native vector graphic format, generally used for Microsoft Office integration.',
  eps: 'Encapsulated PostScript; a legacy but highly stable vector format widely used in print production and cross-software exchange.',
  fxg: 'Flash XML Graphics; a deprecated format formerly used for exporting assets to Adobe Flash and Flex.',
  pdf: 'Portable Document Format; a universal standard for sharing and printing finalized artwork while preserving vector and raster elements.',
  svg: 'Scalable Vector Graphics; the premier, open-standard vector format built on XML, essential for responsive web design and UI/UX assets.',
  svgz: 'Compressed Scalable Vector Graphics; functionally identical to SVG but drastically reduced in file size, ideal for high-performance web deployment.',
  wmf: 'Windows Metafile; an older, 16-bit predecessor to EMF, mostly retained for backward compatibility with legacy Windows applications.',
  cdr: 'CorelDRAW native drawing format.',
  cdt: 'CorelDRAW template file.',
  cgm: 'Computer Graphics Metafile; 2D vector format.',
  cmx: 'Corel Presentation Exchange format.',
  cpt: 'Corel PHOTO-PAINT image.',
  cpx: 'Corel Presentation Exchange Compressed.',
  des: 'Corel Designer native format.',
  pat: 'CorelDRAW pattern file.'
};

export const handleUniversalDownload = (dataUrl: string, fileName: string, format: string) => {
   const lower = format.toLowerCase();
   if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'vif'].includes(lower)) {
       downloadRasterFormat(dataUrl, fileName, lower === 'vif' ? 'avif' : lower);
   } else {
       downloadVectorFormat(dataUrl, fileName, lower);
   }
};

export const zipAllFormats = async (dataUrl: string, baseFileName: string) => {
  const zip = new JSZip();
  const formats = ['png', ...ALL_ADOBE_FORMATS, ...ALL_COREL_FORMATS];
  
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    zip.file(`${baseFileName}.png`, blob);
    
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><image width="1024" height="1024" href="${dataUrl}" /></svg>`;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [1024, 1024] });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, 1024, 1024);
    const pdfArrayBuffer = pdf.output('arraybuffer');
    
    const remainingFormats = formats.filter(f => f !== 'png');
    for (const fmt of remainingFormats) {
      if (fmt === 'svg') {
        zip.file(`${baseFileName}.svg`, svgContent);
      } else if (fmt === 'svgz') {
        zip.file(`${baseFileName}.svgz`, svgContent); // Mocking svgz
      } else if (['pdf', 'ai', 'eps', 'cdr'].includes(fmt)) {
        zip.file(`${baseFileName}.${fmt}`, pdfArrayBuffer);
      } else {
        // Fallback for others
        zip.file(`${baseFileName}.${fmt}`, blob);
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${baseFileName}_AllFormats.zip`);
  } catch (err) {
    console.error("Failed to generate zip", err);
  }
};
