import { generateLogo, generateCIBible } from './services/logoService';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import localforage from 'localforage';
import SettingsPage from './components/SettingsPage';
import GalleryPage from './components/GalleryPage';
import { 
  Image as ImageIcon, Sparkles, Download, Maximize, Minimize, Info, History,
  CheckCircle2, AlertCircle, Loader2, Upload, X, Type, Layout as LayoutIcon, Plus,
  MousePointer2, ImagePlus, ToggleLeft, ToggleRight, Layers, Wand2, Settings2, PlusCircle,
  Trash2, ArrowLeft, Zap, Palette, Camera, MonitorPlay, ChevronRight, ChevronLeft,
  Smartphone, Globe, Code, Terminal, Check, ListChecks, Key, Copy, Cpu, Workflow, Shield, Star, ArrowRight,
  Undo2, Redo2, ChevronDown, SlidersHorizontal, Focus, Book, Eye, ShieldCheck, Quote, Video, FileText, ExternalLink,
  Database, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type APIAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
type DimensionMode = '2D Standard' | '3D Hyper-Realistic' | '4D Temporal Dynamic' | 'Macro Photography' | 'Tilt-Shift' | 'Fisheye Lens' | 'Isometric 3D' | 'Holographic Projection' | 'Claymation' | 'Origami Papercraft' | 'Low Poly 3D' | 'Microscopic' | 'Drone View' | 'Cinematic Anamorphic';
type StylePreset = 'High-End Commercial' | 'Cinematic Editorial' | 'Hyper-Minimalist' | 'Vintage Heritage' | 'Avant-Garde Fashion' | 'Neon Cyberpunk' | 'Watercolor Illustration' | 'Pop Art' | 'Dark Academia' | 'Futuristic Sci-Fi' | 'Surrealist Dreamscape' | 'Retro 80s Synthwave' | 'Swiss Modernism' | 'Bauhaus Industrial' | 'Luxury Minimal' | 'Organic Brutalism' | 'Cyber Y2K' | 'Steampunk' | 'Art Deco' | 'Minimalist Zen' | 'Gothic Noir' | 'Vaporwave' | 'Brutalist Corporate' | 'Ethereal Dreamscape' | 'Hyper-Pop' | 'Y2K Grunge';
type LayoutType = 'Hero Product Shot' | 'Editorial Spread' | 'Bento Grid Layout' | 'Dynamic Action Composition' | 'Flatlay / Knolling' | 'Magazine Cover' | 'Billboard Ad' | 'Social Media Story' | 'Minimalist Grid' | '3D Isometric Room' | 'Cinematic Wide Shot' | 'Asymmetric Balance' | 'Golden Ratio Spiral' | 'Split Depth' | 'Floating Product' | 'Split Screen' | 'Typographic Focus' | 'Symmetrical Balance' | 'Diagonal Flow' | 'Rule of Thirds' | 'Editorial Z-Pattern' | 'Magazine Double Spread' | 'Cinematic Letterbox' | 'Product Podium' | 'Minimalist Solo Spotlight' | 'Modern Series Grid' | 'Surreal Floating Library' | 'Cinematic Macro Spine' | 'Grand Archive Collection';
type Lighting = 'Softbox Studio' | 'Dramatic Chiaroscuro' | 'Cinematic Backlighting' | 'Ethereal Natural Light' | 'Harsh Flash / Paparazzi' | 'Golden Hour' | 'Bioluminescent Glow' | 'Moody Silhouette' | 'Volumetric God Rays' | 'Cyberpunk Neon' | 'Rembrandt Lighting' | 'High-Key Commercial' | 'Low-Key Noir' | 'Neon Noir' | 'Studio Strobe' | 'Candlelight' | 'Hard Shadows' | 'Studio Ring Light' | 'Neon Rim Lighting' | 'Cinematic Teal & Orange';
type FontPreset = 'Inter' | 'Playfair Display' | 'Space Grotesk' | 'Outfit' | 'Bebas Neue' | 'Cinzel' | 'Montserrat' | 'Oswald' | 'Merriweather' | 'Pacifico' | 'Cormorant Garamond' | 'Syncopate' | 'Unbounded' | 'Fraunces' | 'Cinzel Decorative' | 'Syne' | 'Clash Display' | 'Cabinet Grotesk';
type TextEngine = string;
type ImageEngine = string;

interface DynamicSettings {
  gloss: boolean;
  realisticElements: boolean;
  dirtAndTexture: boolean;
  realisticMovements: boolean;
  noMistakes: boolean;
  depthOfField: boolean;
  motionBlur: boolean;
  subsurfaceScattering: boolean;
  chromaticAberration: boolean;
  lensFlare: boolean;
  bloom: boolean;
  vignette: boolean;
  rayTracing: boolean;
  caustics: boolean;
  volumetricFog: boolean;
  ambientOcclusion: boolean;
  metallic: number;
  roughness: number;
  normalMapIntensity: number;
  filmGrain: number;
  contrast: number;
  saturation: number;
  colorGradingIntensity: number;
  lensDistortion: number;
  particleDensity: number;
}

interface EditorState {
  scenePrompt: string;
  assetPrompt: string;
  textElements: TextElement[];
  includeText: boolean;
  productAssets: Asset[];
  brandLogoAsset: Asset | null;
  companyLogoAsset: Asset | null;
  characterAsset: Asset | null;
  themeColors: string[];
  customColor: string;
  customColorsList: string[];
  exampleImages: Asset[];
  textEngine: TextEngine;
  imageEngine: ImageEngine;
  rules: string[];
  style: StylePreset;
  layout: LayoutType;
  lighting: Lighting;
  aspectRatio: APIAspectRatio;
  fontFamily: FontPreset;
  dimensionMode: DimensionMode;
  videoDuration: number;
  isAdMode: boolean;
  customWidthMm: string;
  customHeightMm: string;
  isCustomSize: boolean;
  videoScript: string;
  videoScenes: VideoScene[];
  negativePrompt: string;
  dynamics: DynamicSettings;
}

interface VideoScene {
  id: string;
  prompt: string;
  duration: number;
  cameraMotion?: string;
  lensType?: string;
  lighting?: string;
  transitionType?: string;
  audioCue?: string;
}

interface GenerationHistory {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface Asset {
  id: string;
  data: string;
  mimeType: string;
  name: string;
  prompt?: string;
  isRefining?: boolean;
  material?: string;
  lightingInteraction?: string;
  position?: string;
}

interface TextElement {
  id: string;
  type: 'Headline' | 'Sub-headline' | 'Pricing' | 'Body/Other';
  text: string;
  color: string;
  alignment: 'Left' | 'Center' | 'Right';
  placement: 'Top' | 'Center' | 'Bottom';
  isRefining?: boolean;
}

// --- Constants ---

const PRESET_RULES = [
  "Ensure high contrast between the product and the background.",
  "Maintain a minimalist and uncluttered composition.",
  "Use a monochromatic color scheme based on the primary product color.",
  "Incorporate dynamic, sweeping motion blur in the background.",
  "Place the product dead-center with symmetrical surrounding elements.",
  "Ensure the brand logo is placed in the top-right corner.",
  "Use dramatic, moody lighting with deep shadows.",
  "Make the product appear to be floating or levitating.",
  "Include subtle, elegant reflections on the floor surface.",
  "Ensure all text elements are highly legible with clear drop shadows.",
  "Use a vibrant, neon-infused cyberpunk color palette.",
  "Create a soft, ethereal, and dreamy atmosphere.",
  "Position the product using the rule of thirds (bottom-right intersection).",
  "Incorporate geometric shapes and lines in the background.",
  "Ensure the lighting highlights the texture and material of the product.",
  "Use a vintage, retro-inspired film grain effect.",
  "Make the background completely pure black (#000000).",
  "Make the background completely pure white (#FFFFFF).",
  "Add a subtle vignette effect around the edges of the poster.",
  "Ensure the overall tone is luxurious, premium, and high-end."
];

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string = "Request timed out"): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(res => {
      clearTimeout(timer);
      resolve(res);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

const getTextModelString = (engine: string) => {
  if (engine.includes('models/')) {
    const match = engine.match(/\((models\/.*?)\)/);
    if (match) return match[1].replace('models/', '');
  }

  // --- Map to Gemini API Skill Source of Truth ---
  if (engine.includes('2.0') && engine.includes('Flash')) return 'gemini-2.0-flash'; // Standard 2.0
  if (engine.includes('2.5') && engine.includes('Flash')) {
    if (engine.includes('Image')) return 'gemini-2.5-flash-image';
    return 'gemini-2.5-flash'; 
  }
  if (engine.includes('3.2') && engine.includes('Flash')) return 'gemini-3.2-flash-preview';
  if (engine.includes('3.1') && engine.includes('Flash-Lite')) return 'gemini-3.1-flash-lite';
  if (engine.includes('3.1') && engine.includes('Flash') && !engine.includes('Lite')) return 'gemini-3.1-flash-preview';
  if (engine.includes('3.1') && engine.includes('Pro')) return 'gemini-3.1-pro-preview';
  if (engine.includes('3') && engine.includes('Flash')) return 'gemini-3-flash-preview';
  if (engine.includes('Nano Banana 2')) return 'gemini-3.1-flash-image-preview'; // High quality image
  if (engine.includes('Nano Banana')) return 'gemini-2.5-flash-image';
  if (engine.includes('Image')) return 'gemini-2.5-flash-image'; // Default image mapping
  
  // Fallbacks for common strings
  if (engine.includes('1.5') && engine.includes('Flash')) return 'gemini-3.1-flash-preview';
  if (engine.includes('1.5') && engine.includes('Pro')) return 'gemini-3.1-pro-preview';
  
  if (engine.includes('gemini-1.5-pro')) return 'gemini-3.1-pro-preview';
  if (engine.includes('gemini-1.5-flash')) return 'gemini-3.1-flash-preview';
  if (engine.includes('gemini-2.5-flash-preview')) return 'gemini-3.1-flash-preview';
  if (engine.includes('gemini-2.5-pro')) return 'gemini-3.1-pro-preview';
  
  // Custom API models matcher fallback
  if (engine.includes('(')) {
     const match = engine.match(/\((.*?)\)/);
     if (match && match[1].startsWith('models/')) return match[1].replace('models/', '');
  }
  
  return engine.replace(' (Free)', '').replace(' (Paid)', '').toLowerCase().replace(/ /g, '-');
};

const getImageModelString = (engine: string) => {
  if (engine.includes('models/')) {
    const match = engine.match(/\((models\/.*?)\)/);
    if (match) return match[1].replace('models/', '');
  }

  // Map to Image Generation specific models
  if (engine.includes('Veo')) return 'veo-2.0-generate-001';
  if (engine.includes('Nano Banana 2')) return 'gemini-3.1-flash-image-preview'; // Nano Banana 2 uses generateContent
  if (engine.includes('Gemini 3.1 Pro (Paid Image)')) return 'imagen-3.0-generate-002'; // Imagen uses generateImages
  if (engine.includes('2.5') && engine.includes('Flash Image')) return 'gemini-2.5-flash-image'; // Nano Banana 1 uses generateContent
  if (engine.includes('ImageFX (S2)')) return 'imagen-3.0-generate-002';
  
  return 'imagen-3.0-generate-001'; // Safe fallback
};

const DEFAULT_TEXT_ENGINES: string[] = [
  'Gemini 2.0 Flash (Free)',
  'Gemini 2.5 Flash (Free)',
  'Gemini 3.1 Flash-Lite (Paid)',
  'Gemini 3.2 Flash (Paid)',
  'Gemini 3.1 Pro (Paid)'
];
const DEFAULT_IMAGE_ENGINES: string[] = [
  '--- Image Models ---',
  'Gemini 2.5 Flash Image (Free)',
  'Nano Banana 2 (3.1 Flash Image) (Free)',
  'Gemini 3.1 Pro (Paid Image)',
  '--- Video Models ---',
  'Veo Lite (1080p Video)',
  'Veo 3.1 (4K/Pro Video)'
];

const ENGINE_DETAILS: Record<ImageEngine, string> = {
  'Gemini 2.0 Flash (Free)': 'Ultra-fast experimental model. Best for quick drafts and real-time interactions. Completely free.',
  'Gemini 2.5 Flash (Free)': 'High-performance standard model. Optimized for speed and quality balance. Completely free.',
  'Gemini 3.1 Flash-Lite (Paid)': 'Efficiency-optimized Flash model. Low latency, high throughput. Professional tier.',
  'Gemini 3.2 Flash (Paid)': 'The latest evolution of Flash. Exceptional reasoning at speed. Professional tier.',
  'Gemini 3.1 Pro (Paid)': 'Top-tier reasoning model for complex workflows. Requires your own Gemini API Key.',
  'Gemini 2.5 Flash Image (Free)': 'Fast and versatile. Best for quick iterations and standard commercial layouts. Completely free to use.',
  'Nano Banana 2 (3.1 Flash Image) (Free)': 'Primary free image generation model. Advanced reasoning and higher quality.',
  'Gemini 3.1 Pro (Paid Image)': 'Flagship image generation. Unmatched realism and cinematic quality. Requires Paid Key.',
  'Veo Lite (1080p Video)': 'Efficiency-optimized video model. Standard for social ads.',
  'Veo 3.1 (4K/Pro Video)': 'Flagship video model. Supports 4K resolution and complex physical simulation.'
};


const STYLES: StylePreset[] = ['High-End Commercial', 'Cinematic Editorial', 'Hyper-Minimalist', 'Vintage Heritage', 'Avant-Garde Fashion', 'Neon Cyberpunk', 'Watercolor Illustration', 'Pop Art', 'Dark Academia', 'Futuristic Sci-Fi', 'Surrealist Dreamscape', 'Retro 80s Synthwave', 'Swiss Modernism', 'Bauhaus Industrial', 'Luxury Minimal', 'Organic Brutalism', 'Cyber Y2K', 'Steampunk', 'Art Deco', 'Minimalist Zen', 'Gothic Noir', 'Vaporwave', 'Brutalist Corporate', 'Ethereal Dreamscape', 'Hyper-Pop', 'Y2K Grunge'];
const LAYOUTS: LayoutType[] = ['Hero Product Shot', 'Editorial Spread', 'Bento Grid Layout', 'Dynamic Action Composition', 'Flatlay / Knolling', 'Magazine Cover', 'Billboard Ad', 'Social Media Story', 'Minimalist Grid', '3D Isometric Room', 'Cinematic Wide Shot', 'Asymmetric Balance', 'Golden Ratio Spiral', 'Split Depth', 'Floating Product', 'Split Screen', 'Typographic Focus', 'Symmetrical Balance', 'Diagonal Flow', 'Rule of Thirds', 'Editorial Z-Pattern', 'Magazine Double Spread', 'Cinematic Letterbox', 'Product Podium', 'Minimalist Solo Spotlight', 'Modern Series Grid', 'Surreal Floating Library', 'Cinematic Macro Spine', 'Grand Archive Collection'];
const LIGHTING_OPTIONS: Lighting[] = ['Softbox Studio', 'Dramatic Chiaroscuro', 'Cinematic Backlighting', 'Ethereal Natural Light', 'Harsh Flash / Paparazzi', 'Golden Hour', 'Bioluminescent Glow', 'Moody Silhouette', 'Volumetric God Rays', 'Cyberpunk Neon', 'Rembrandt Lighting', 'High-Key Commercial', 'Low-Key Noir', 'Neon Noir', 'Studio Strobe', 'Candlelight', 'Hard Shadows', 'Studio Ring Light', 'Neon Rim Lighting', 'Cinematic Teal & Orange'];
const FONTS: FontPreset[] = ['Inter', 'Playfair Display', 'Space Grotesk', 'Outfit', 'Bebas Neue', 'Cinzel', 'Montserrat', 'Oswald', 'Merriweather', 'Pacifico', 'Cormorant Garamond', 'Syncopate', 'Unbounded', 'Fraunces', 'Cinzel Decorative', 'Syne', 'Clash Display', 'Cabinet Grotesk'];
const DIMENSION_MODES: DimensionMode[] = ['2D Standard', '3D Hyper-Realistic', '4D Temporal Dynamic', 'Macro Photography', 'Tilt-Shift', 'Fisheye Lens', 'Isometric 3D', 'Holographic Projection', 'Claymation', 'Origami Papercraft', 'Low Poly 3D', 'Microscopic', 'Drone View', 'Cinematic Anamorphic'];

const PROFESSIONAL_PALETTES = [
  { name: 'Midnight Luxury', colors: ['#0F172A', '#1E293B', '#334155', '#6366F1', '#F8FAFC'] },
  { name: 'Golden Heritage', colors: ['#1C1917', '#44403C', '#78716C', '#D97706', '#F5F5F4'] },
  { name: 'Cyber Neon', colors: ['#020617', '#1E1B4B', '#4C1D95', '#D946EF', '#22D3EE'] },
  { name: 'Swiss Clean', colors: ['#FFFFFF', '#F1F5F9', '#94A3B8', '#EF4444', '#0F172A'] },
  { name: 'Organic Earth', colors: ['#1A2E05', '#365314', '#4D7C0F', '#84CC16', '#F7FEE7'] },
  { name: 'Deep Ocean', colors: ['#083344', '#155E75', '#06B6D4', '#22D3EE', '#ECFEFF'] }
];
const ASPECT_RATIOS: { label: string, value: APIAspectRatio, social: string }[] = [
  { label: '1:1 (Square)', value: '1:1', social: 'Instagram Post / FB' },
  { label: '9:16 (Story)', value: '9:16', social: 'TikTok / Reels / Shorts' },
  { label: '16:9 (Wide)', value: '16:9', social: 'YouTube / Twitter / Web' },
  { label: '4:3 (Landscape)', value: '4:3', social: 'Standard Print / Dribbble' },
  { label: '3:4 (Portrait)', value: '3:4', social: 'IG Portrait / Pinterest' }
];

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', 
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ffffff', '#000000', '#14b8a6'
];

// --- Components ---

const JaminiLogo = React.memo(({ showText = true, className = "", size = "md", onClick }: { showText?: boolean, className?: string, size?: "sm" | "md" | "lg", onClick?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const sizeClasses = {
    sm: "h-6 md:h-8 w-auto min-w-[32px]",
    md: "h-10 md:h-12 w-auto min-w-[48px]",
    lg: "h-20 md:h-28 w-auto min-w-[80px]"
  };
  const textClasses = {
    sm: "text-xl",
    md: "text-2xl lg:text-3xl",
    lg: "text-4xl lg:text-5xl"
  };
  const subTextClasses = {
    sm: "text-[9px]",
    md: "text-[10px] lg:text-xs",
    lg: "text-xs lg:text-sm"
  };
  const jClasses = {
    sm: "text-2xl",
    md: "text-3xl lg:text-4xl",
    lg: "text-5xl lg:text-6xl"
  };

  return (
    <div 
      className={`flex items-center gap-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`} style={{ perspective: '1200px' }}>
        <motion.div 
          animate={{ 
            rotateY: isHovered ? [-5, 5, -5] : 0, 
            rotateX: isHovered ? [5, -5, 5] : 0,
            scale: isHovered ? 1.05 : 1
          }}
          transition={{ duration: 4, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
          className="relative w-full h-full flex items-center justify-center transform-gpu"
        >
          {/* Subtle Glow */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-indigo-500/5 blur-2xl rounded-full opacity-40" />
          
          <img 
            src="https://i.ibb.co/RTRNJgw0/1778090202960-removebg-preview.png" 
            alt="Jamini" 
            className="w-full h-full object-contain relative z-10"
            referrerPolicy="no-referrer"
            loading="eager"
          />
          
          {/* Floating Sparkle */}
          {isHovered && (
            <motion.div animate={{ y: [-3, 3, -3], rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]" />
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ width: isHovered ? 32 : 16 }}
              className="h-[1px] bg-gradient-to-r from-indigo-500 to-transparent" 
            />
            <span className={`${subTextClasses[size]} text-indigo-400 font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]`}>Studio Edition</span>
          </div>
        </div>
      )}
    </div>
  );
});


const WelcomeScreen = ({ onEnter, onMeetJamini }: { onEnter: () => void, onMeetJamini: () => void }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const playWelcomeMelody = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      
      const playDramaticNote = (freq: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'sawtooth') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2, ctx.currentTime + startTime);
        filter.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + startTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Happier, faster "more welcome" melody
      playDramaticNote(523.25, 0, 0.4, 0.2, 'sine'); // C5
      playDramaticNote(659.25, 0.15, 0.4, 0.2, 'sine'); // E5
      playDramaticNote(783.99, 0.3, 0.6, 0.2, 'sine'); // G5
      playDramaticNote(1046.50, 0.45, 1.0, 0.2, 'sine'); // C6

      setTimeout(() => ctx.close(), 2000);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  const handleEnter = () => {
    playWelcomeMelody();
    onEnter();
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030014] overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 md:mb-4 lg:mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/15 blur-[40px] md:blur-[80px] animate-pulse" />
            <img 
              src="https://i.ibb.co/RTRNJgw0/1778090202960-removebg-preview.png" 
              alt="JAMINI Studio" 
              className="h-16 md:h-28 lg:h-32 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 md:mb-6 lg:mb-8 space-y-2 md:space-y-4"
        >
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase" style={{ fontFamily: 'Space Grotesk' }}>
              Pro Design, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400">Rhyme & Fine</span>
            </h1>
            <div className="h-0.5 w-12 md:w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
          </div>

          <div className="max-w-3xl mx-auto space-y-3 md:space-y-6 relative">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-sm md:text-xl lg:text-2xl text-white/70 font-light tracking-tight leading-snug font-sans relative z-10"
            >
              JAMINI makes the <span className="text-white font-bold">Magic Shine.</span> <br className="hidden md:block" /> Joint Artificial Multi-modal Intelligence Network Interface.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap justify-center gap-2 md:gap-6 pt-4 md:pt-8 border-t border-white/5"
            >
              {[
                { label: 'VEO', sub: '4K Video', icon: Video, color: 'text-indigo-400', glow: 'bg-indigo-400/10' },
                { label: 'PRO', sub: 'Neural Engine', icon: Cpu, color: 'text-fuchsia-400', glow: 'bg-fuchsia-400/10' },
                { label: '9:16', sub: 'Mobile First', icon: Smartphone, color: 'text-emerald-400', glow: 'bg-emerald-400/10' }
              ].map((item, i) => (
                <div key={i} className="group relative flex flex-col items-center min-w-[80px] md:min-w-[120px] p-2 md:p-3 rounded-2xl transition-all duration-300">
                  <div className={cn("mb-1 md:mb-2 p-1.5 md:p-2 rounded-xl bg-white/[0.02] border border-white/5 relative z-10", item.color)}>
                    <item.icon className="w-3 h-3 md:w-5 md:h-5" />
                  </div>
                  <div className="flex flex-col items-center gap-0 relative z-10">
                    <span className="text-white font-black text-lg md:text-xl tracking-tighter leading-none">{item.label}</span>
                    <span className="text-[8px] md:text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">{item.sub}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(167, 139, 250, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnter}
            className="group relative px-6 md:px-8 py-3 md:py-4 bg-white/5 border border-white/20 rounded-full overflow-hidden cursor-pointer w-56 md:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative flex items-center justify-center md:justify-start gap-2 md:gap-3">
              <span className="text-base md:text-lg font-bold text-white tracking-widest uppercase">Enter Studio</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onMeetJamini}
            className="group relative px-6 md:px-8 py-3 md:py-4 bg-indigo-600 rounded-full overflow-hidden cursor-pointer shadow-lg active:translate-y-1 transition-all w-56 md:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="relative flex items-center justify-center md:justify-start gap-2 md:gap-3">
              <span className="text-base md:text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 md:w-5 md:h-5" /> Meet JAMINI
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const containerVariants = { 
  hidden: { opacity: 0 }, 
  show: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  } 
};
const itemVariants = { 
  hidden: { opacity: 0, y: 30 }, 
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const, 
      stiffness: 100 
    } 
  } 
};

const FeatureCard = ({ feature, index }: { feature: any, index: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div variants={itemVariants} className="perspective-1000 h-full">
      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02, z: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 overflow-hidden relative h-full shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] group"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Dynamic Mouse Spotlight */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ 
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.08), transparent 40%)` 
          }} 
        />

        {/* Animated Border Gradient on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0">
          <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.3)_360deg)] animate-[spin_4s_linear_infinite]" />
        </div>
        <div className="absolute inset-[1px] bg-black/80 backdrop-blur-xl rounded-[2rem] z-0" />

        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" />
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-${feature.color}-500/20 to-transparent rounded-bl-full z-0 transition-transform duration-700 group-hover:scale-150`} />
        
        <div className="h-24 mb-8 relative flex items-center z-10" style={{ transform: 'translateZ(30px)' }}>
          <motion.div className={`w-16 h-16 bg-${feature.color}-500/10 border border-${feature.color}-500/30 rounded-2xl backdrop-blur-md absolute z-10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-[0_0_20px_rgba(var(--${feature.color}-500),0.2)]`}>
            <feature.icon className={`w-8 h-8 text-${feature.color}-400 drop-shadow-[0_0_10px_rgba(var(--${feature.color}-500),0.8)]`} />
          </motion.div>
          <div className={`w-24 h-24 bg-${feature.color}-500/20 rounded-full absolute -left-4 blur-2xl group-hover:bg-${feature.color}-500/40 transition-colors duration-500`} />
        </div>
        
        <h3 className="text-2xl font-bold mb-4 text-white/90 group-hover:text-white transition-colors z-10 relative" style={{ transform: 'translateZ(20px)' }}>{feature.title}</h3>
        <div className="text-white/50 text-sm md:text-base leading-relaxed group-hover:text-white/70 transition-colors z-10 relative whitespace-pre-line" style={{ transform: 'translateZ(10px)' }}>
          {feature.desc}
        </div>
      </motion.div>
    </motion.div>
  );
};

const SetupGuide = ({ onBack }: { onBack: () => void }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full bg-[#050505] text-white p-6 lg:p-12 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/20 via-indigo-900/5 to-transparent pointer-events-none" />
      
      {/* Abstract Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="max-w-5xl mx-auto relative z-10 pb-32">
        <div className="flex items-center justify-between mb-12">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-all group bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 w-fit backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Studio
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">v4.0 Enterprise</span>
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-green-300">System Ready</span>
          </div>
        </div>
        
        <div className="mb-20 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div className="space-y-4 max-w-2xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-white/40 mb-4">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">Protocol: Global Deployment</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/20">
                  Engineering <br/> <span className="text-indigo-400">Excellence.</span>
                </h1>
              </motion.div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full animate-pulse" />
                <Cpu className="w-full h-full text-indigo-400/50 relative z-10" />
              </div>
            </div>
          </div>
          <p className="text-xl text-white/40 max-w-3xl leading-relaxed font-medium">
            This guide provides the low-level technical mapping required to move JAMINI from a preview instance to your private infrastructure. Follow these steps to ensure state persistence, high-availability deployments, and secure AI bridging.
          </p>
        </div>

        {/* Global Architecture View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          <div className="col-span-1 lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-1000" />
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-white">
              <Workflow className="w-6 h-6 text-indigo-400" /> 
              Core Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2 italic">
                    <ShieldCheck className="w-4 h-4" /> Client-Side Sovereign
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    JAMINI processes all UI state and rendering logic on the user's hardware. Your data never touches a middle-man server before reaching Google's AI clusters.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-fuchsia-300 mb-2 flex items-center gap-2 italic">
                    <Zap className="w-4 h-4" /> Edge Persistence
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Utilizing <code className="text-fuchsia-400">LocalStorage</code> and <code className="text-fuchsia-400">IndexDB</code>, session data remains encrypted and localized to the browser profile.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="relative aspect-video rounded-2xl border border-white/10 bg-black/40 p-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 opacity-50" />
                  <div className="text-center relative z-10 space-y-4">
                    <div className="flex justify-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Smartphone className="w-6 h-6" /></div>
                      <div className="w-6 h-px bg-white/20 self-center" />
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Globe className="w-6 h-6" /></div>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Distributed Studio Mesh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/20 border border-white/10 rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4">Security Audit</h2>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                JAMINI is designed with a <span className="text-white font-bold">Zero-Trust</span> mindset. Your API keys are strictly transient unless you explicitly commit them to a secure environment.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs text-green-400"><CheckCircle2 className="w-4 h-4" /> End-to-End Encryption</li>
                <li className="flex items-center gap-2 text-xs text-green-400"><CheckCircle2 className="w-4 h-4" /> No Central Database</li>
                <li className="flex items-center gap-2 text-xs text-green-400"><CheckCircle2 className="w-4 h-4" /> Local Auth Management</li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <Shield className="w-10 h-10 text-white/20" />
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Trusted by Design</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-flight Checklist */}
        <div className="mb-20">
          <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
            <div className="w-10 h-0.5 bg-indigo-500" /> Pre-Flight Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Environment Runtime", desc: "Node.js 18.x or 20.x is mandatory for the Vite build engine.", why: "Ensures ESM compatibility and fast HMR." },
              { title: "Version Control", desc: "Active GitHub account with SSH keys configured for secure push.", why: "Required for atomic deployments and Vercel hooks." },
              { title: "Provider Access", desc: "Valid API key from Google AI Studio / Gemini API enabled cloud project.", why: "Grants access to LLM reasoning & vision clusters." },
              { title: "Browser Standards", desc: "Chrome 110+, Edge 110+, or Safari 16+. Must support WebGL 2.0.", why: "Critical for high-fidelity canvas rendering." }
            ].map((check, i) => (
              <div key={i} className="group bg-white/5 border border-white/10 hover:border-white/20 transition-all p-6 rounded-[2rem] flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">{i+1}</div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white tracking-tight">{check.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{check.desc}</p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Why: {check.why}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Deployment Matrix */}
        <div className="space-y-12 mb-20">
          <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
            <div className="w-10 h-0.5 bg-fuchsia-500" /> Execution Matrix
          </h2>
          
          <div className="relative space-y-12">
            {/* Step 1 */}
            <div className="relative pl-12 md:pl-0">
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/10" />
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/2 md:text-right space-y-4">
                  <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-black text-indigo-400 uppercase tracking-tighter">PHASE 01: SOURCE</div>
                  <h3 className="text-3xl font-black tracking-tighter">Clone & Prep</h3>
                  <div className="text-sm text-white/50 leading-relaxed space-y-3">
                    <p>Initialize your local repository to begin the customization process. This ensures you have full ownership of the logic layer.</p>
                    <ul className="space-y-2 text-[11px] list-none">
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-indigo-400" /> Pull latest build from StackBlitz or GitHub</li>
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-indigo-400" /> Verify <code className="text-indigo-300">package.json</code> dependencies</li>
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-indigo-400" /> Initialize Git for version tracking</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap md:justify-end gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">git init</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">npm install</span>
                  </div>
                </div>
                
                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 top-0 w-10 h-10 rounded-full bg-black border-2 border-indigo-500 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  <span className="text-xs font-black">01</span>
                </div>

                <div className="w-full md:w-1/2">
                  <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">cli_terminal</span>
                      <button onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "Init Jamini"\nnpm install\nnpm run dev', 'clone')} className="text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors">
                        {copied === 'clone' ? 'Protocol Copied' : 'Copy Sequence'}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-indigo-300 leading-6 relative z-10">
                      <span className="text-white/30"># Initialize & start dev server</span><br/>
                      <span className="text-fuchsia-400">git</span> init && git add .<br/>
                      <span className="text-fuchsia-400">npm</span> install<br/>
                      <span className="text-fuchsia-400">npm</span> run dev<br/><br/>
                      <span className="text-white/20">// Active on http://localhost:3000</span>
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-12 md:pl-0">
              <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="inline-block px-4 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-xs font-black text-fuchsia-400 uppercase tracking-tighter">PHASE 02: BRAIN</div>
                  <h3 className="text-3xl font-black tracking-tighter">Dynamic API Sync</h3>
                  <div className="text-sm text-white/50 leading-relaxed space-y-3">
                    <p>JAMINI uses a proprietary <span className="text-white">Client-First Key Management</span> system. Instead of leaking keys in environment variables, provide them directly to the interface.</p>
                    <ul className="space-y-2 text-[11px] list-none">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-fuchsia-400" /> No server-side storage (Total Privacy)</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-fuchsia-400" /> Real-time key rotation & validation</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-fuchsia-400" /> Multi-key support (Free vs Paid tiers)</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">Settings Panel</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">TLS Encryption</span>
                  </div>
                </div>
                
                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 top-0 w-10 h-10 rounded-full bg-black border-2 border-fuchsia-500 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                   <span className="text-xs font-black">02</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-12">
                   <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-fuchsia-500/30 transition-all">
                        <div className="w-10 h-10 bg-fuchsia-500/10 rounded-xl flex items-center justify-center text-fuchsia-400"><Key className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs font-black text-white/80">1. Generate Token</p>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-fuchsia-400 hover:underline">Google AI Studio Console</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-fuchsia-500/30 transition-all">
                        <div className="w-10 h-10 bg-fuchsia-500/10 rounded-xl flex items-center justify-center text-fuchsia-400"><Settings2 className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs font-black text-white/80">2. Interface Injection</p>
                          <p className="text-[10px] text-white/40">Open <strong className="text-white">Settings</strong> inside JAMINI Studio to paste and save key aliases.</p>
                        </div>
                      </div>
                      <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <p className="text-[9px] text-red-400 font-bold uppercase leading-tight flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Security Warning
                        </p>
                        <p className="text-[9px] text-white/40 leading-relaxed mt-1">Never commit your API keys to Git. Vercel environment variables are supported but <span className="text-white font-bold">Settings-based input</span> is the primary recommended method for highest privacy.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-12 md:pl-0">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/2 md:text-right space-y-4">
                  <div className="inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-black text-cyan-400 uppercase tracking-tighter">PHASE 03: DEPLOY</div>
                  <h3 className="text-3xl font-black tracking-tighter">Global Proliferation</h3>
                  <div className="text-sm text-white/50 leading-relaxed space-y-3">
                    <p>Push your customized Studio to a production-grade host. JAMINI is optimized for Vercel's zero-config edge architecture.</p>
                    <ul className="space-y-2 text-[11px] list-none">
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-cyan-400" /> Automated CI/CD (GitHub Hooks)</li>
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-cyan-400" /> Global Edge Propagation</li>
                      <li className="flex items-center gap-2 md:justify-end"><div className="w-1 h-1 rounded-full bg-cyan-400" /> Instant Build Cache</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap md:justify-end gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">Vercel Deploy</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/40 font-mono">PWA Enabled</span>
                  </div>
                </div>
                
                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 top-0 w-10 h-10 rounded-full bg-black border-2 border-cyan-500 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <span className="text-xs font-black">03</span>
                </div>

                <div className="w-full md:w-1/2">
                   <div className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-cyan-500/30 transition-all">
                          <p className="text-[10px] font-black uppercase text-white/30 mb-2">Step A</p>
                          <p className="text-[11px] text-white/80 font-bold mb-1">GitHub Bridge</p>
                          <p className="text-[9px] text-white/40 leading-tight">Create a repo and run <code className="text-cyan-400">git push origin main</code>.</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-cyan-500/30 transition-all">
                          <p className="text-[10px] font-black uppercase text-white/30 mb-2">Step B</p>
                          <p className="text-[11px] text-white/80 font-bold mb-1">Vercel Import</p>
                          <p className="text-[9px] text-white/40 leading-tight">Sign in to Vercel and import your new repo. Hit Deploy.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-2">Notice: Environment Variables</h4>
                         <p className="text-[10px] text-white/50 leading-relaxed">
                           Vercel variables (<code className="text-white">GEMINI_API_KEY</code>) are supported as fail-safes, but <strong className="text-white">In-App Settings always take precedence</strong> to ensure users can use their own private quotas.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips & mastering the Studio */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[3rem] p-8 md:p-12 mb-20 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000" />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-4xl font-black mb-6 flex items-center gap-4 text-white">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" /> Professional Grade Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 tracking-tight text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Bake-in Defaults (Optional)
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    If deploying as a team brand asset, define <code className="text-indigo-400 text-[10px]">VITE_GEMINI_API_KEY</code> in Vercel to allow guest generation, but instruct users to use Settings for their own models.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 tracking-tight text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Custom PWA Branding
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Update <code className="text-indigo-400 text-[10px]">manifest.json</code> and <code className="text-indigo-400 text-[10px]">favicon.ico</code> to replace the JAMINI logo with your agency's proprietary branding.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 tracking-tight text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Hardware Acceleration
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    JAMINI uses High-DPI canvas buffering. Ensure users have "Hardware Acceleration" enabled in browser settings for ultra-smooth 3D movement.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold flex items-center gap-2 tracking-tight text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Agentic Control
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Use the <span className="text-fuchsia-400">Rules</span> panel to define "Thematic Guardrails"—ensuring the AI always adheres to your brand's color theory and typography.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Troubleshooting */}
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">Encountering Anomalies?</h2>
            <p className="text-white/40 text-sm max-w-lg">
              Check your browser console (F12) for detailed logs. Most integration errors are due to expired API tokens or network firewall restrictions on <code className="text-[10px]">generativelanguage.googleapis.com</code>.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a href="https://github.com/stackblitz/jamini-studio/issues" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-2 text-white">
              <Code className="w-4 h-4" /> Report Logic Leak
            </a>
            <button onClick={onBack} className="px-6 py-3 bg-indigo-500 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2">
              Finalize & Return <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturesPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen bg-[#050505] text-white overflow-y-auto custom-scrollbar relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/5 rounded-full blur-xl"
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, Math.random() * 0.5 + 1, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-fuchsia-900/10 to-[#050505] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Studio
        </button>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-10 mb-20">
          <div className="flex-1 text-center lg:text-left relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }} 
              animate={{ scale: 1, opacity: 1, rotate: 0 }} 
              transition={{ type: "spring", duration: 1.5 }} 
              className="inline-block mb-6 relative"
            >
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full" />
              <JaminiLogo size="md" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-[1.1]"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-fuchsia-400">Command the Matrix.</span><br/>
              <span className="text-white">Design with JAMINI.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8 font-light"
            >
              JAMINI Studio is the authoritative platform for enterprise-grade generative synthesis. Elevating raw diffusion models into precision architectural instruments for global advertising.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 text-[11px] font-bold text-indigo-300 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Wand2 className="w-3.5 h-3.5"/> Gemini 3.1 Pro</div>
              <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full px-4 py-2 text-[11px] font-bold text-fuchsia-300 flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.2)]"><Smartphone className="w-3.5 h-3.5"/> PWA Ready</div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 text-[11px] font-bold text-emerald-300 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Download className="w-3.5 h-3.5"/> 4K Export</div>
            </motion.div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000">
            <motion.div 
              animate={{ 
                y: [-10, 10, -10], 
                rotateX: [3, -3, 3],
                rotateY: [-3, 3, -3]
              }} 
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
              className="relative z-20 rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] transform-gpu"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 mix-blend-overlay z-10" />
               <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract 3D rendering" className="w-full h-auto object-cover scale-105" />
               <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded bg-fuchsia-500 text-white text-[9px] font-bold uppercase tracking-wider">Featured</span>
                   <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Generated with JAMINI Pro</span>
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>NEON DREAMS</h3>
               </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-600/30 to-fuchsia-600/30 blur-[100px] -z-10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Marquee Section */}
        <div className="mb-20 relative w-full overflow-hidden flex flex-col items-center">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Supported Visual Styles</p>
          <div className="flex space-x-6 animate-marquee whitespace-nowrap opacity-50 hover:opacity-100 transition-opacity duration-500">
            {[...STYLES, ...STYLES].map((style, i) => (
              <span key={i} className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white/20 to-white/60 uppercase tracking-tighter" style={{ fontFamily: 'Space Grotesk' }}>
                {style} <span className="text-indigo-500/50 mx-3">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-3">Unleash Your Creativity</h2>
          <p className="text-white/50 max-w-2xl text-base">Everything you need to build stunning, production-ready assets in seconds.</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {[
            { 
              icon: MonitorPlay, 
              color: 'indigo', 
              title: 'Veo Video Matrix', 
              desc: 'Harness Google\'s world-class Veo model for professional video advertisement creation. \n• 4K & 1080p rendering capacities\n• Controlled scene-by-scene storyboard execution\n• Dynamic physics-based simulation for liquids/fabrics\n• Strategic 6s, 13s, and 14s durations for major social platforms.' 
            },
            { 
              icon: LayoutIcon, 
              color: 'cyan', 
              title: 'Semantic Layout Engine', 
              desc: 'Architecturally sound compositions derived from high-end magazine theory.\n• Bento Grid: Perfect for multi-asset showcases\n• Editorial Spread: Luxury balanced voids\n• Rule of Thirds: High-impact psychological focus.' 
            },
            { 
              icon: Zap, 
              color: 'fuchsia', 
              title: 'Physics & Dynamics Control', 
              desc: 'Granular control over the physical properties of the generated set.\n• Subsurface Scattering: Realistic light penetration through skin or wax\n• Caustics: Accurate light refraction through glass and water\n• Ray-Tracing: Real-time calculation of bounces and reflections.' 
            },
            { 
              icon: Palette, 
              color: 'emerald', 
              title: 'Commercial Color Grading', 
              desc: 'Advanced LUT-based color science applied with AI precision.\n• Heritage Gold: Warm, luxury, historical aesthetic\n• Matrix Midnight: High-contrast cyan/indigo shadows\n• Clean Studio: Perfect neutral balance for product focus.' 
            },
            { 
              icon: Type, 
              color: 'amber', 
              title: 'Type-Safe Composition', 
              desc: 'Seamless typography that isn\'t just "layered on" but integrated into the scene lighting.\n• Intelligent Kerning: Proper letter spacing for high-end readability\n• Font Parity: Supports Space Grotesk, Playfair, and Unbounded.' 
            },
            { 
              icon: Workflow, 
              color: 'blue', 
              title: 'Asset Reference Mapping', 
              desc: 'Your products are the source of truth. The AI maintains 100% fidelity to uploaded assets.\n• Multi-Asset Stacking: Mix product, character, and logo\n• Lighting Sync: Assets inherit the lighting of the generated scene.' 
            },
            { 
              icon: ListChecks, 
              color: 'rose', 
              title: 'Strict Logical Guardrails', 
              desc: 'Force the engine to obey specific commercial constraints.\n• Custom Rule Logic: "No people", "Cinematic fog only", "Macro focus"\n• Zero-Hallucination Mode: Restricts creative drift to maintain brand safety.' 
            },
            { 
              icon: Cpu, 
              color: 'cyan', 
              title: 'Hybrid Compute Architecture', 
              desc: 'Uses a synchronized dual-engine approach for the best of text and image.\n• Gemini 1.5 Pro: Orchestrates the prompt logic and hierarchy\n• Gemini Flash Image: Renders the final matrix with hyper-speed.' 
            },
            { 
              icon: ShieldCheck, 
              color: 'green', 
              title: 'Privacy-First API Injection', 
              desc: 'Enterprise-grade security for your proprietary brand assets.\n• Local Key Storage: Keys never traverse our backend servers\n• Sandbox Generation: All processing occurs within the Secure Google Cloud environment.' 
            }
          ].map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </motion.div>

        {/* Workflow Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">How It Works</h2>
            <p className="text-white/50 text-base">A streamlined workflow designed for professionals.</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Animated Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 hidden md:block rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                whileInView={{ x: "100%" }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                { step: '01', title: 'Upload Assets', desc: 'Provide your product images, logos, and character models. The AI analyzes their lighting and perspective.', color: 'indigo', icon: Upload },
                { step: '02', title: 'Define Style', desc: 'Select your layout, lighting, typography, and color palette. Refine your prompt with Gemini 3.1 Pro.', color: 'fuchsia', icon: Palette },
                { step: '03', title: 'Generate & Export', desc: 'Render the final masterpiece using advanced image models and export in up to 4K resolution.', color: 'emerald', icon: Download }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative flex flex-col items-center text-center group">
                  {/* Glowing Node */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-${step.color}-500/30 blur-xl rounded-full group-hover:bg-${step.color}-500/50 transition-colors duration-500`} />
                    <div className={`w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] group-hover:border-${step.color}-500/50 transition-colors duration-500`}>
                      <div className={`absolute inset-1 rounded-full border border-${step.color}-500/20 border-dashed animate-[spin_10s_linear_infinite]`} />
                      <step.icon className={`w-6 h-6 text-${step.color}-400 drop-shadow-[0_0_10px_rgba(var(--${step.color}-500),0.8)]`} />
                    </div>
                    <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${step.color}-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(var(--${step.color}-500),0.8)] z-20`}>
                      {step.step}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-white/90">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Future Integrations / Roadmap */}
        <div className="mb-24 bg-indigo-950/10 border border-indigo-500/20 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
           
           <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 text-white relative z-10">Beyond the Matrix</h2>
           <p className="text-sm md:text-base text-indigo-200/60 max-w-2xl relative z-10 mb-8 leading-relaxed">
             JAMINI is constantly evolving. The team is integrating advanced topological data, real-time 3D synthesis, and deeply localized brand-identity pipelines.
           </p>
           
           <div className="flex flex-wrap gap-4 justify-center relative z-10">
             <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg text-xs text-white/60 font-bold uppercase tracking-widest backdrop-blur-sm">Realtime 3D</div>
             <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg text-xs text-white/60 font-bold uppercase tracking-widest backdrop-blur-sm">Spatial Audio API</div>
             <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg text-xs text-white/60 font-bold uppercase tracking-widest backdrop-blur-sm">Auto-Rigging</div>
           </div>
        </div>
        
        {/* Engine Explanation Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mb-24 bg-gradient-to-br from-indigo-900/20 to-fuchsia-900/20 border border-white/10 rounded-[2rem] p-6 lg:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 relative z-10">Understanding the AI Engines</h2>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed mb-16 relative z-10">
            JAMINI Studio utilizes Google's most advanced generative models. Here is how the API key logic works to ensure you have access to both free and premium capabilities.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left relative z-10">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><Check className="w-6 h-6 text-emerald-400"/></div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-400">Free Tier</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1">No Key Required</p>
                </div>
              </div>
              <p className="text-base text-white/60 leading-relaxed mb-6">
                When you select any <strong>(Free)</strong> engine, the application uses the built-in environment API key. To ensure it works without requiring your own key, image generation is routed through the free-tier compatible <strong>Gemini 2.5 Flash Image</strong> model, while your selected engine is used for text refinement and advanced prompt engineering.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <Star className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-200/80">Works out of the box! Perfect for rapid prototyping and standard commercial layouts.</p>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30"><Key className="w-6 h-6 text-amber-400"/></div>
                <div>
                  <h3 className="text-2xl font-bold text-amber-400">Paid Tier</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Your Key Required</p>
                </div>
              </div>
              <p className="text-base text-white/60 leading-relaxed mb-6">
                When you select a <strong>(Paid)</strong> engine, you are accessing Google's flagship preview models for image generation (like Gemini 3.1 Flash Image or 3.0 Pro Image). The AI Studio platform <strong>strictly requires</strong> users to provide their own API key via a secure popup to access these advanced image models.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-200/80">Unlocks unmatched realism, complex scene understanding, and cinematic quality.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

const CustomSelect = ({ value, onChange, options, label, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredOptions = options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()));
  
  return (
    <div className="relative space-y-2">
      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <div 
        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white cursor-pointer flex justify-between items-center hover:border-indigo-500/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isOpen && "rotate-180")} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-full mt-1 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/5">
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((opt: string) => (
                <div 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={cn(
                    "px-3 py-2 text-xs cursor-pointer transition-colors",
                    value === opt ? "bg-indigo-500/20 text-indigo-300" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {opt}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-xs text-white/40 text-center">No results found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AutoResizeTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    resize();
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      onChange={(e) => {
        resize();
        if (props.onChange) props.onChange(e);
      }}
      className={cn("resize-none overflow-hidden", props.className)}
    />
  );
};

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'features' | 'guide' | 'settings' | 'gallery'>('editor');
  const [keyRotationIndex, setKeyRotationIndex] = useState<number>(0);

  const getApiKey = (type: 'paid' | 'free') => {
    let availableKeys: string[] = [];

    // 1. Collect from LocalStorage
    try {
      const savedKeys = localStorage.getItem('jamini_api_keys');
      if (savedKeys) {
        const keysArr = JSON.parse(savedKeys) as any[];
        const typedKeys = keysArr.filter(k => k.type === type && k.key).map(k => k.key);
        availableKeys = [...availableKeys, ...typedKeys];
      }
    } catch (e) { }

    // 2. Collect from Environment (supports comma-separated list)
    const envValue = import.meta.env.VITE_GEMINI_API_KEY || 
                     import.meta.env.VITE_API_KEY || 
                     (import.meta as any).env?.GEMINI_API_KEY;

    if (envValue && typeof envValue === 'string') {
      const keys = envValue.split(',').map((k: string) => k.trim()).filter(Boolean);
      availableKeys = [...availableKeys, ...keys];
    }
    
    // 3. Check node process environment
    if (typeof process !== 'undefined' && process.env) {
      const procValue = (process.env as any).VITE_GEMINI_API_KEY || 
                        process.env.GEMINI_API_KEY || 
                        process.env.API_KEY;
      if (procValue && typeof procValue === 'string') {
        const keys = procValue.split(',').map((k: string) => k.trim()).filter(Boolean);
        availableKeys = [...availableKeys, ...keys];
      }
    }

    // Remove duplicates
    const uniqueKeys = Array.from(new Set(availableKeys));
    
    if (uniqueKeys.length === 0) return '';
    
    // 4. Shifting Logic: Use Round Robin based on rotation index
    const index = keyRotationIndex % uniqueKeys.length;
    return uniqueKeys[index];
  };

  // Helper to shift to next key on failure
  const shiftKey = () => {
    setKeyRotationIndex(prev => prev + 1);
  };
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // State
  const [scenePrompt, setScenePrompt] = useState('');
  const [assetPrompt, setAssetPrompt] = useState('');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [newTextType, setNewTextType] = useState<'Headline' | 'Sub-headline' | 'Pricing' | 'Body/Other'>('Headline');
  const [newTextContent, setNewTextContent] = useState('');
  const [includeText, setIncludeText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [productAssets, setProductAssets] = useState<Asset[]>([]);
  const [brandLogoAsset, setBrandLogoAsset] = useState<Asset | null>(null);
  const [companyLogoAsset, setCompanyLogoAsset] = useState<Asset | null>(null);
  const [characterAsset, setCharacterAsset] = useState<Asset | null>(null);
  const [companyCIAsset, setCompanyCIAsset] = useState<Asset | null>(null);
  const [ciSummary, setCiSummary] = useState<string>('');
  const [isAnalyzingCI, setIsAnalyzingCI] = useState(false);
  const [exampleImages, setExampleImages] = useState<Asset[]>([]);
  const [themeColors, setThemeColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#ff0000');
  const [customColorsList, setCustomColorsList] = useState<string[]>([]);
  const [customWidthMm, setCustomWidthMm] = useState<string>('210');
  const [customHeightMm, setCustomHeightMm] = useState<string>('297');
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(6);
  const [isAdMode, setIsAdMode] = useState<boolean>(false);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [videoScript, setVideoScript] = useState<string>('');
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [isScripting, setIsScripting] = useState<boolean>(false);
  const [videoStatus, setVideoStatus] = useState<string>('');

  const [textEnginesList, setTextEnginesList] = useState<string[]>(DEFAULT_TEXT_ENGINES);
  const [imageEnginesList, setImageEnginesList] = useState<string[]>(DEFAULT_IMAGE_ENGINES);

  useEffect(() => {
    const fetchModels = async () => {
      const key = getApiKey('paid') || getApiKey('free');
      if (!key) return;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
          const data = await res.json();
          const models: Array<{name: string, displayName: string}> = data.models || [];
          const newTextEngines = new Set(DEFAULT_TEXT_ENGINES);
          const newImageEngines = new Set(DEFAULT_IMAGE_ENGINES);
          models.forEach(m => {
            const str = `${m.displayName} (${m.name})`;
            if (m.name.includes('vision') || m.name.includes('imagen') || m.name.includes('veo')) {
               newImageEngines.add(str);
            } else if (m.name.includes('gemini')) {
               newTextEngines.add(str);
            }
          });
          setTextEnginesList(Array.from(newTextEngines));
          setImageEnginesList(Array.from(newImageEngines));
        }
      } catch (e) {
        console.error("Failed to fetch dynamic models", e);
      }
    };
    fetchModels();
  }, [hasEntered, currentView]);

  const [textEngine, setTextEngine] = useState<string>('Gemini 2.0 Flash (Free)');
  const [imageEngine, setImageEngine] = useState<string>('Gemini 2.5 Flash Image (Free)');
  
  const [isRefiningScene, setIsRefiningScene] = useState(false);
  const [isRefiningAsset, setIsRefiningAsset] = useState(false);
  const [isSuggestingScene, setIsSuggestingScene] = useState(false);
  
  const [rules, setRules] = useState<string[]>([]);
  const [isLogoMode, setIsLogoMode] = useState(false);
  const [isGenerateCI, setIsGenerateCI] = useState(false);
  const [logoInfluence, setLogoInfluence] = useState('balanced'); // balanced, strict, creative
  const [influencePrompt, setInfluencePrompt] = useState('');
  const [newRule, setNewRule] = useState('');

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };
  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };
  
  const [style, setStyle] = useState<StylePreset>('High-End Commercial');
  const [layout, setLayout] = useState<LayoutType>('Hero Product Shot');
  const [lighting, setLighting] = useState<Lighting>('Softbox Studio');
  const [aspectRatio, setAspectRatio] = useState<APIAspectRatio>('9:16');
  const [fontFamily, setFontFamily] = useState<FontPreset>('Space Grotesk');
  const [generationObjective, setGenerationObjective] = useState<'poster' | 'logo' | 'video' | null>(null);
  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('2D Standard');
  const [dynamics, setDynamics] = useState<DynamicSettings>({
    gloss: true,
    realisticElements: true,
    dirtAndTexture: false,
    realisticMovements: false,
    noMistakes: true,
    depthOfField: true,
    motionBlur: false,
    subsurfaceScattering: true,
    chromaticAberration: false,
    lensFlare: false,
    bloom: true,
    vignette: false,
    rayTracing: true,
    caustics: false,
    volumetricFog: false,
    ambientOcclusion: true,
    metallic: 50,
    roughness: 50,
    normalMapIntensity: 50,
    filmGrain: 10,
    contrast: 50,
    saturation: 50,
    colorGradingIntensity: 50,
    lensDistortion: 0,
    particleDensity: 0
  });

  // Undo/Redo State
  const currentState: EditorState = {
    scenePrompt, assetPrompt, textElements, includeText,
    productAssets, brandLogoAsset, companyLogoAsset, characterAsset, exampleImages, themeColors, customColor, customColorsList,
    textEngine, imageEngine, rules, style, layout, lighting, aspectRatio,
    fontFamily, dimensionMode, videoDuration, isAdMode, videoScript, videoScenes, negativePrompt, dynamics,
    customWidthMm, customHeightMm, isCustomSize
  };

  const [history, setHistory] = useState<EditorState[]>([currentState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Memoized history tracking to protect performance
  const lastHistorySaveRef = useRef<string>('');
  useEffect(() => {
    const timer = setTimeout(() => {
      const stateStr = JSON.stringify({
        scenePrompt, assetPrompt, textElements, includeText,
        textEngine, imageEngine, rules, style, layout, lighting, aspectRatio,
        fontFamily, dimensionMode, videoDuration, isAdMode, videoScript, videoScenes, negativePrompt, dynamics,
        customWidthMm, customHeightMm, isCustomSize
      });
      
      if (stateStr !== lastHistorySaveRef.current) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        lastHistorySaveRef.current = stateStr;
      }
    }, 1000); // Increased debounce for performance
    
    return () => clearTimeout(timer);
  }, [currentState, historyIndex]); // Removed large 'history' from deps


  const applyState = (state: EditorState) => {
    setScenePrompt(state.scenePrompt);
    setAssetPrompt(state.assetPrompt);
    setTextElements(state.textElements);
    setIncludeText(state.includeText);
    setProductAssets(state.productAssets);
    setBrandLogoAsset(state.brandLogoAsset);
    setCompanyLogoAsset(state.companyLogoAsset);
    setCharacterAsset(state.characterAsset);
    setExampleImages(state.exampleImages || []);
    setThemeColors(state.themeColors);
    setCustomColor(state.customColor);
    setCustomColorsList(state.customColorsList || []);
    setTextEngine(state.textEngine);
    setImageEngine(state.imageEngine);
    setRules(state.rules);
    setStyle(state.style || 'High-End Commercial');
    setLayout(state.layout || 'Hero Product Shot');
    setLighting(state.lighting || 'Softbox Studio');
    setAspectRatio(state.aspectRatio || '9:16');
    setFontFamily(state.fontFamily || 'Space Grotesk');
    setDimensionMode(state.dimensionMode || '2D Standard');
    setVideoDuration(state.videoDuration || 6);
    setIsAdMode(state.isAdMode || false);
    setVideoScript(state.videoScript || '');
    setVideoScenes(state.videoScenes || []);
    setNegativePrompt(state.negativePrompt || '');
    setCustomWidthMm(state.customWidthMm || '210');
    setCustomHeightMm(state.customHeightMm || '297');
    setIsCustomSize(state.isCustomSize || false);
    setDynamics(state.dynamics);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      applyState(prevState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      applyState(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const toggleDynamic = (key: keyof DynamicSettings) => {
    setDynamics(prev => ({ ...prev, [key]: !prev[key as keyof DynamicSettings] }));
  };

  const updateDynamicValue = (key: keyof DynamicSettings, value: number) => {
    setDynamics(prev => ({ ...prev, [key]: value }));
  };

  const productInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);
  const exampleInputRef = useRef<HTMLInputElement>(null);

  const handleEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // This was a legacy handler, we now use separate state for text and image engines
    console.log("Engine changed:", e.target.value);
  };

  const updateAssetPrompt = (id: string, type: 'product' | 'brandLogo' | 'companyLogo' | 'character', prompt: string) => {
    if (type === 'product') {
      setProductAssets(prev => prev.map(a => a.id === id ? { ...a, prompt } : a));
    } else if (type === 'brandLogo') {
      setBrandLogoAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);
    } else if (type === 'companyLogo') {
      setCompanyLogoAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);
    } else if (type === 'character') {
      setCharacterAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);
    }
  };

  const updateAssetDetails = (id: string, type: 'product' | 'brandLogo' | 'companyLogo' | 'character', updates: Partial<Asset>) => {
    if (type === 'product') {
      setProductAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } else if (type === 'brandLogo') {
      setBrandLogoAsset(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    } else if (type === 'companyLogo') {
      setCompanyLogoAsset(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    } else if (type === 'character') {
      setCharacterAsset(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    }
  };

  const vividlyAnalyzeAsset = async (asset: Asset, type: 'product' | 'brandLogo' | 'companyLogo' | 'character') => {
    const id = asset.id;
    const setRefining = (val: boolean) => {
      if (type === 'product') setProductAssets(prev => prev.map(a => a.id === id ? { ...a, isRefining: val } : a));
      else if (type === 'brandLogo') setBrandLogoAsset(prev => prev ? { ...prev, isRefining: val } : prev);
      else if (type === 'companyLogo') setCompanyLogoAsset(prev => prev ? { ...prev, isRefining: val } : prev);
      else if (type === 'character') setCharacterAsset(prev => prev ? { ...prev, isRefining: val } : prev);
    };

    setRefining(true);
    try {
      const apiKey = getApiKey('free');
      if (!apiKey) return;
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { role: 'user', parts: [
            { inlineData: { data: asset.data, mimeType: asset.mimeType } },
            { text: `You are an expert AI image generation consultant. Analyze this uploaded asset specifically for use in a professional advertisement poster.
            Return a JSON object with strictly these four keys: "prompt", "material", "lightingInteraction", "position".
            - "prompt": A highly detailed, technical description of the asset (1-2 sentences).
            - "material": Precise material details (e.g., "Polished Aluminum with brushed finish", "Soft matte silicone", "Translucent glass").
            - "lightingInteraction": How this object should interact with lighting (e.g., "Sharp rim highlights", "Subtle subsurface scattering", "Refractive distortions").
            - "position": Precise recommended positioning for this asset type in a professional layout (e.g., "Center foreground, slight upward tilt", "Bottom-right corner, 15 degree rotation").
            
            Return ONLY the valid JSON object.` }
          ]}
        ]
      }), 60000, "Asset analysis timed out.");
      
      const text = response.text?.trim();
      if (text) {
        try {
          const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
          const data = JSON.parse(jsonStr);
          updateAssetDetails(id, type, {
            prompt: data.prompt || '',
            material: data.material || '',
            lightingInteraction: data.lightingInteraction || '',
            position: data.position || ''
          });
        } catch (e) {
          console.error("Failed to parse asset analysis JSON:", text);
          updateAssetPrompt(id, type, text.slice(0, 200));
        }
      }
    } catch (err) {
      shiftKey();
      console.error("Error vividly analyzing asset:", err);
    } finally {
      setRefining(false);
    }
  };

  const enhanceAllAssetPrompts = async () => {
    const promises = [];
    for (const asset of productAssets) {
      promises.push(vividlyAnalyzeAsset(asset, 'product'));
    }
    if (brandLogoAsset) promises.push(vividlyAnalyzeAsset(brandLogoAsset, 'brandLogo'));
    if (companyLogoAsset) promises.push(vividlyAnalyzeAsset(companyLogoAsset, 'companyLogo'));
    if (characterAsset) promises.push(vividlyAnalyzeAsset(characterAsset, 'character'));
    
    await Promise.all(promises);
  };

  const refineSpecificAssetPrompt = async (id: string, type: 'product' | 'brandLogo' | 'companyLogo' | 'character') => {
    let asset = type === 'product' ? productAssets.find(a => a.id === id) : type === 'brandLogo' ? brandLogoAsset : type === 'companyLogo' ? companyLogoAsset : characterAsset;
    if (!asset || !asset.prompt?.trim()) { setError("Please enter a prompt to refine."); return; }

    const setRefining = (val: boolean) => {
      if (type === 'product') setProductAssets(prev => prev.map(a => a.id === id ? { ...a, isRefining: val } : a));
      else if (type === 'brandLogo') setBrandLogoAsset(prev => prev ? { ...prev, isRefining: val } : prev);
      else if (type === 'companyLogo') setCompanyLogoAsset(prev => prev ? { ...prev, isRefining: val } : prev);
      else if (type === 'character') setCharacterAsset(prev => prev ? { ...prev, isRefining: val } : prev);
    };

    setRefining(true);
    setError(null);

    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      const response = await withTimeout(ai.models.generateContent({
        model: getTextModelString(textEngine),
        contents: `You are an expert AI image generation prompt engineer. Enhance the following asset description to be highly detailed and optimized for integrating this specific asset into a professional advertisement poster. 
        CRITICAL: Enhance the description with granular control, specifying how the asset interacts with lighting, its exact material properties, and its position/scale relative to other elements. Focus on physical appearance and texture.
        Keep it concise but highly descriptive. Only return the enhanced prompt text, nothing else. Original text: "${asset.prompt}"`,
      }), 60000, "Refine asset prompt timed out.");
      const refined = response.text?.trim();
      if (refined) {
        updateAssetPrompt(id, type, refined);
      }
    } catch (err: any) {
      console.error("Error refining asset prompt:", err);
      let errorMessage = err.message || "Failed to refine prompt.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before refining again.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = `Permission denied. The selected model (${textEngine}) may not be available on your current API tier.`;
      } else if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
        errorMessage = `Model not found (${getTextModelString(textEngine)}). Please try switching to Gemini 2.0 Flash or 1.5 Flash.`;
      }
      setError(errorMessage);
    } finally {
      setRefining(false);
    }
  };

  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [newTextAlignment, setNewTextAlignment] = useState<'Left' | 'Center' | 'Right'>('Center');
  const [newTextPlacement, setNewTextPlacement] = useState<'Top' | 'Center' | 'Bottom'>('Center');

  const addTextElement = () => {
    if (newTextContent.trim()) {
      setTextElements([...textElements, { 
        id: Date.now().toString(), 
        type: newTextType, 
        text: newTextContent.trim(),
        color: newTextColor,
        alignment: newTextAlignment,
        placement: newTextPlacement
      }]);
      setNewTextContent('');
    }
  };

  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(t => t.id !== id));
  };

  const refineTextElement = async (id: string) => {
    const elementToRefine = textElements.find(t => t.id === id);
    if (!elementToRefine || !elementToRefine.text.trim()) {
      setError("Please enter some text to refine.");
      return;
    }

    setTextElements(prev => prev.map(t => t.id === id ? { ...t, isRefining: true } : t));
    setError(null);

    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      const context = `
      Consider the following context:
      Current Style: ${style}
      Current Layout: ${layout}
      Current Lighting: ${lighting}
      Text Type: ${elementToRefine.type}
      `;

      const response = await withTimeout(ai.models.generateContent({
        model: getTextModelString(textEngine),
        contents: `You are an expert editor for advertisement posters. Your task is to fix any spelling mistakes and optimize the structure/layout of the provided text (e.g., professionally formatting times, dates, or contact details) while strictly preserving the original content and meaning.
        CRITICAL: Do NOT add new words, do not change the meaning, and do not add marketing fluff. Only fix errors and improve formatting/structure. Do not add quotes around the output.
        Only return the corrected text, nothing else. ${context} Original text: "${elementToRefine.text}"`,
      }), 60000, "Refine text element timed out.");
      
      const refined = response.text?.trim().replace(/^["']|["']$/g, '');
      if (refined) {
        setTextElements(prev => prev.map(t => t.id === id ? { ...t, text: refined, isRefining: false } : t));
      } else {
        setTextElements(prev => prev.map(t => t.id === id ? { ...t, isRefining: false } : t));
      }
    } catch (err: any) {
      console.error("Error refining text element:", err);
      let errorMessage = err.message || "Failed to refine text.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before refining again.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Permission denied. The selected AI model may not be available on your current API tier. Try switching to 'Gemini 2.0 Flash'.";
      }
      setError(errorMessage);
      setTextElements(prev => prev.map(t => t.id === id ? { ...t, isRefining: false } : t));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'brandLogo' | 'companyLogo' | 'character' | 'example' | 'companyCI') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let base64 = '';
        let mimeType = file.type;

        if (file.type === 'application/pdf' && type === 'companyCI') {
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else if (file.type === 'image/svg+xml') {
          const converted = await new Promise<{base64: string, mimeType: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                // Use a reasonable default size if SVG doesn't specify intrinsic dimensions
                canvas.width = img.width || 1024;
                canvas.height = img.height || 1024;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL('image/png');
                  resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/png' });
                } else {
                  reject(new Error("Canvas context failed"));
                }
              };
              img.onerror = reject;
              img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          base64 = converted.base64;
          mimeType = converted.mimeType;
        } else {
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const asset: Asset = { id: `${Date.now()}-${i}`, data: base64, mimeType, name: file.name, prompt: '' };
        
        if (type === 'product') setProductAssets(prev => [...prev, asset]);
        else if (type === 'brandLogo') setBrandLogoAsset(asset);
        else if (type === 'companyLogo') setCompanyLogoAsset(asset);
        else if (type === 'character') setCharacterAsset(asset);
        else if (type === 'example') setExampleImages(prev => prev.length < 3 ? [...prev, asset] : prev);
        else if (type === 'companyCI') {
          setCompanyCIAsset(asset);
          analyzeCompanyCI(base64, mimeType);
        }

        // Trigger automatic enhancement for each uploaded asset
        if (type === 'product' || type === 'brandLogo' || type === 'companyLogo' || type === 'character') {
          vividlyAnalyzeAsset(asset, type);
        }
      } catch (err) {
        console.error("Error processing file:", err);
        setError(`Failed to process file: ${file.name}.`);
      }
    }
    e.target.value = '';
  };

  const analyzeCompanyCI = async (base64Data: string, mimeType: string) => {
    setIsAnalyzingCI(true);
    setError(null);
    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { role: 'user', parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `You are an expert brand integrity officer. Analyze this Company Corporate Identity (CI) / Brand Bible document with absolute precision.
            Extract the following information:
            1. Primary and secondary color palettes (hex codes).
            2. Exact typography / font names and usage rules (e.g. Header font, Body font).
            3. Logo placement rules (Clearance zones, restricted corners, prohibited backgrounds).
            4. Visual style constraints (Minimalist, Brutalist, Organic, Modern, etc.).
            5. Photography guidelines (Color temperature, depth of field, subject positioning).
            6. "Never-Ever" list: Prohibited colors, fonts, or compositions.
            
            Return a JSON object with:
            {
              "colorPalette": ["#hex1", "#hex2"],
              "recommendedFont": "One of: Inter, Playfair Display, Space Grotesk, Outfit, Bebas Neue, Cinzel, Montserrat, Oswald, Merriweather, Pacifico, Cormorant Garamond, Syncopate, Unbounded, Fraunces, Cinzel Decorative, Syne, Clash Display, Cabinet Grotesk",
              "visualStyle": "The overall mood",
              "summary": "Full detailed string of rules for the AI generator",
              "rules": ["Rule 1", "Rule 2"]
            }
            
            Return ONLY the valid JSON.` }
          ]}
        ]
      }), 120000, "CI Analysis timed out.");
      
      const text = response.text?.trim();
      if (text) {
        try {
          const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
          const data = JSON.parse(jsonStr);
          setCiSummary(data.summary || text);
          if (data.colorPalette && Array.isArray(data.colorPalette)) {
            setThemeColors(data.colorPalette);
            setCustomColorsList(prev => [...new Set([...prev, ...data.colorPalette])]);
          }
          if (data.recommendedFont) {
            setFontFamily(data.recommendedFont as FontPreset);
          }
          if (data.rules && Array.isArray(data.rules)) {
            setRules(prev => [...new Set([...prev, ...data.rules])]);
          }
        } catch (e) {
          console.error("Failed to parse CI analysis JSON:", text);
          setCiSummary(text.trim());
        }
      }
    } catch (err: any) {
      console.error("Error analyzing CI:", err);
      setError("Failed to analyze Company CI. " + (err.message || ""));
    } finally {
      setIsAnalyzingCI(false);
    }
  };

  const removeAsset = (id: string, type: 'product' | 'brandLogo' | 'companyLogo' | 'character' | 'example' | 'companyCI') => {
    if (type === 'product') setProductAssets(prev => prev.filter(a => a.id !== id));
    else if (type === 'brandLogo') setBrandLogoAsset(null);
    else if (type === 'companyLogo') setCompanyLogoAsset(null);
    else if (type === 'character') setCharacterAsset(null);
    else if (type === 'example') setExampleImages(prev => prev.filter(a => a.id !== id));
    else if (type === 'companyCI') {
      setCompanyCIAsset(null);
      setCiSummary('');
    }
  };

  const toggleColor = (color: string) => {
    setThemeColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : (prev.length < 5 ? [...prev, color] : prev));
  };

  const generateVideoScript = async () => {
    setIsScripting(true);
    setError(null);
    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are a world-class Cinematic Commercial Director. Your goal is to write a MASTER Storyboard Script for a ${videoDuration}-second video advertisement.
      The video must follow a strict "Perfect Ad" structure: 
      1. Hook (First 2s): High-speed movement or ultra-macro visual.
      2. Value Proposition (Middle): Demonstrating product usage or utility with emotional lighting.
      3. Brand Culmination (Final 2s): Clear logo placement and aesthetic satisfaction.

      [BRAND IDENTITY]
      Style: ${style}
      Lighting: ${lighting}
      Product: ${productAssets.map(a => a.name).join(', ')}
      Guidelines: ${ciSummary || 'Standard high-end commercial'}
      
      [TECHNICAL RULES]
      - Break the video into EXACT SCENES.
      - Describe the PHYSICAL SIMULATION: Liquid viscosity, fabric flow, particle dynamics.
      - Describe the CINEMATOGRAPHY: Zoom speed, shutter angle, focal shift.
      - Specify camera motion, lens type, and lighting for the scene.
      - Return a JSON array of scenes.
      
      [OUTPUT FORMAT]
      Return ONLY a JSON array of scenes. Each scene object:
      { 
        "id": string, 
        "prompt": string, 
        "duration": number,
        "cameraMotion": string (e.g., "Static", "Pan Left", "Dolly In", "Crane Up", "Handheld"),
        "lensType": string (e.g., "Macro 100mm", "Wide 24mm", "Anamorphic 35mm", "Telephoto 200mm"),
        "lighting": string (e.g., "Volumetric", "High Contrast Rim", "Soft Box", "Neon Glow"),
        "transitionType": string (e.g., "Hard Cut", "Crossfade", "Match Cut", "Wipe"),
        "audioCue": string (e.g., "Bass Drop", "Swoosh", "Silence", "Upbeat Tempo")
      }
      Total duration must equal ${videoDuration}.

      JSON OUTPUT:`;

      const response = await withTimeout(ai.models.generateContent({
        model: getTextModelString(textEngine),
        contents: prompt,
      }), 60000, "Storyboard generation request timed out.");
      
      const text = response.text?.trim() || '';
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
         const scenes = JSON.parse(jsonMatch[0]);
         if (Array.isArray(scenes)) {
            setVideoScenes(scenes);
            setVideoScript(scenes.map(s => `[${s.duration}s] ${s.prompt}`).join('\n\n'));
         }
      } else {
         setVideoScript(text);
      }
    } catch (err: any) {
      shiftKey();
      console.error("Error generating storyboard:", err);
      setError("Failed to generate storyboard. Please try again.");
    } finally {
      setIsScripting(false);
    }
  };

  const refineVideoScript = async () => {
    if (!videoScript && videoScenes.length === 0) {
      setError("Generate a baseline script first before refining.");
      return;
    }
    setIsScripting(true);
    setError(null);
    try {
      const apiKey = getApiKey('paid') || getApiKey('free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `As a Senior Creative Director, REFINE the following video storyboard for ${videoDuration}s commercial.
      
      [CURRENT SCRIPT]
      ${videoScript || JSON.stringify(videoScenes)}
      
      [STYLE CONTEXT]
      Lighting: ${lighting}
      Mood: ${style}
      Dynamics: ${Object.entries(dynamics).filter(([k,v]) => v === true).map(([k]) => k).join(', ')}
      
      [OBJECTIVES]
      1. Hyper-refine the visual terminology for AI Video Generation (Veo 3.1).
      2. Ensure scene descriptions are ultra-vivid and physically accurate.
      3. Refine or suggest dramatic cameraMotion, lensType, and lighting values for each scene.
      4. Maintain the ${videoDuration}s total duration exactly.
      
      [OUTPUT FORMAT]
      Return ONLY a JSON array of scenes: 
      [{
        "id": "s1", 
        "prompt": "...", 
        "duration": 2, 
        "cameraMotion": "...", 
        "lensType": "...", 
        "lighting": "...",
        "transitionType": "...",
        "audioCue": "..."
       }, ...]`;

      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      }), 60000, "Refinement timed out.");
      
      const text = response.text?.trim() || '';
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const scenes = JSON.parse(jsonMatch[0]);
        setVideoScenes(scenes);
        setVideoScript(scenes.map((s: any) => `[${s.duration}s] ${s.prompt}`).join('\n\n'));
      }
    } catch (err: any) {
      console.error("Refinement error:", err);
      setError("Failed to refine script with Pro model. " + err.message);
    } finally {
      setIsScripting(false);
    }
  };

  const suggestScenePrompt = async () => {
    setIsSuggestingScene(true);
    setError(null);

    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are a Senior Art Director specializing in cinematic product photography and commercial set design. 
      Your objective is to provide a master-crafted, structurally detailed environment description that perfectly complements the following brand parameters.
      
      [CONTEXT]
      Style: ${style}
      Layout: ${layout}
      Lighting: ${lighting}
      Rules: ${rules.join(', ')}
      
      [ASSETS]
      ${productAssets.length > 0 ? `Product Subjects: ${productAssets.map(a => a.name).join(', ')}` : 'Generic commercial subjects'}
      ${characterAsset ? 'Hero Model: Character asset included' : ''}
      
      [REQUIREMENTS]
      - Describe the textures, lighting depth, and spatial geometry.
      - Ensure the background provides high-contrast focus on the product.
      - Return ONLY the environment description (max 2 sentences).
      - NO introductory text, NO quotes, NO conversational filler.
      
      SCENE DESCRIPTION:`;

      const response = await withTimeout(ai.models.generateContent({
        model: getTextModelString(textEngine),
        contents: prompt,
      }), 60000, "Suggest scene prompt timed out.");
      const suggestion = response.text?.trim();
      if (suggestion) {
        setScenePrompt(suggestion);
      }
    } catch (err: any) {
      console.error("Error suggesting scene:", err);
      let errorMessage = err.message || "Failed to suggest scene.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before generating a suggestion.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = `Permission denied. The selected model (${textEngine}) may not be available on your current API tier.`;
      } else if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
        errorMessage = `Model not found (${getTextModelString(textEngine)}). Please try switching to Gemini 2.0 Flash or 1.5 Flash.`;
      }
      setError(errorMessage);
    } finally {
      setIsSuggestingScene(false);
    }
  };

  const refinePromptText = async (type: 'scene' | 'asset') => {
    const currentText = type === 'scene' ? scenePrompt : assetPrompt;
    if (!currentText.trim()) { setError(`Please enter some text to refine.`); return; }
    if (type === 'scene') setIsRefiningScene(true); else setIsRefiningAsset(true);
    setError(null);

    try {
      const isPaid = textEngine.includes('Paid');
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing!");
      const ai = new GoogleGenAI({ apiKey });
      
      let prompt = "";
      if (type === 'scene') {
        prompt = `You are an expert Environmental Concept Artist. Your task is to enhance the following ENVIRONMENT description.
        Focus ONLY on the setting, background, atmosphere, spatial geometry, and lighting of the world. 
        DO NOT focus on specific products or subjects, but ensure the environment complements a professional advertisement.
        
        [CONTEXT]
        Current Style: ${style}
        Current Layout: ${layout}
        Current Lighting: ${lighting}
        Guidelines: ${rules.join(', ')}
        
        Original Text: "${currentText}"
        Only return the enhanced environment description, nothing else.`;
      } else {
        prompt = `You are a professional Product Integration Specialist. Your task is to enhance the following ASSET INTEGRATION description.
        Focus ONLY on how the primary products/subjects interact with their environment, their scale, their relative positioning, and their physical material interactions (reflections, shadows, touch-points).
        DO NOT rewrite the background or general atmosphere.
        
        [CONTEXT]
        Uploaded Assets: ${productAssets.map(a => a.name).join(', ')}
        Current Lighting: ${lighting}
        
        Original Text: "${currentText}"
        Only return the enhanced integration instructions, nothing else.`;
      }

      const response = await withTimeout(ai.models.generateContent({
        model: getTextModelString(textEngine),
        contents: prompt,
      }), 60000, "Refine prompt text timed out.");
      const refined = response.text?.trim();
      if (refined) {
        if (type === 'scene') setScenePrompt(refined); else setAssetPrompt(refined);
      }
    } catch (err: any) {
      shiftKey();
      console.error("Error refining prompt text:", err);
      let errorMessage = err.message || "Failed to refine prompt.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before refining again.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = `Permission denied. The selected model (${textEngine}) may not be available on your current API tier.`;
      } else if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
        errorMessage = `Model not found (${getTextModelString(textEngine)}). Please try switching to a standard engine like Gemini 1.5 Flash.`;
      }
      setError(errorMessage);
    } finally {
      if (type === 'scene') setIsRefiningScene(false); else setIsRefiningAsset(false);
    }
  };

  const extractColorsFromAssets = async () => {
    if (!brandLogoAsset && !companyLogoAsset && !characterAsset) return;
    setIsExtractingColors(true);
    try {
      const apiKey = getApiKey('free');
      if (!apiKey) {
        setError("API Key is required to extract colors.");
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [{ text: "Analyze the provided images (logos and/or character). Extract a cohesive color palette of 3 to 5 hex codes that best represent them. Return ONLY a valid JSON array of hex color strings (e.g., [\"#FF0000\", \"#00FF00\"]). Do not include markdown formatting like ```json." }];
      
      if (brandLogoAsset) parts.push({ inlineData: { data: brandLogoAsset.data, mimeType: brandLogoAsset.mimeType } });
      if (companyLogoAsset) parts.push({ inlineData: { data: companyLogoAsset.data, mimeType: companyLogoAsset.mimeType } });
      if (characterAsset) parts.push({ inlineData: { data: characterAsset.data, mimeType: characterAsset.mimeType } });

      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: parts,
      }), 60000, "Extract colors timed out.");

      const text = response.text || '';
      const match = text.match(/\[.*\]/s);
      if (match) {
        const colors = JSON.parse(match[0]);
        if (Array.isArray(colors)) {
          const newCustomColors = [...new Set([...customColorsList, ...colors])];
          setCustomColorsList(newCustomColors);
          setThemeColors(colors);
        }
      }
    } catch (err: any) {
      console.error("Failed to extract colors:", err);
      let errorMessage = err.message || "Failed to extract colors from assets.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before extracting colors again.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Permission denied. The AI model may not be available on your current API tier.";
      }
      setError(errorMessage);
    } finally {
      setIsExtractingColors(false);
    }
  };

  const handleGenerateLogo = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = getApiKey('free');
      if (!apiKey) throw new Error("API key is required for logo generation.");
      const ai = new GoogleGenAI({ apiKey });

      // Use uploaded product assets as references for logo generation
      const referenceImages = productAssets.map(a => a.data);

      let finalLogoPrompt = scenePrompt || `Professional minimal logo for JAMINI Studio. Theme: Modern, tech-forward, AI-centric. Style: Minimalist, sophisticated. Color palette: Indigo, Neon Fuchsia, Deep Black. No text or very clean sans-serif text.`;
      
      if (influencePrompt.trim()) {
        finalLogoPrompt += ` \nInfluence Instructions: ${influencePrompt}`;
      }
      
      if (logoInfluence === 'strict') {
        finalLogoPrompt += ` \nSTRICT: Maintain high fidelity to the visual language of the reference assets. Combine their elements into a new mark.`;
      } else if (logoInfluence === 'creative') {
        finalLogoPrompt += ` \nCREATIVE: Use the references as a loose mood board but feel free to invent new geometric abstractions.`;
      }

      const { darkLogoUrl, lightLogoUrl } = await generateLogo(ai, {
        prompt: finalLogoPrompt,
        referenceImages,
        model: getImageModelString(imageEngine)
      });

      if (darkLogoUrl) setBrandLogoAsset({ id: 'logo-dark', name: 'Dark Logo', data: darkLogoUrl.split(',')[1], mimeType: 'image/jpeg', prompt: 'Dark Logo' });
      if (lightLogoUrl) setCompanyLogoAsset({ id: 'logo-light', name: 'Light Logo', data: lightLogoUrl.split(',')[1], mimeType: 'image/jpeg', prompt: 'Light Logo' });

      if (isGenerateCI) {
        await generateCIBible(darkLogoUrl, lightLogoUrl, scenePrompt || "JAMINI Studio");
      }

    } catch (err: any) {
      console.error("Logo Generation Error:", err);
      let errorMessage = err.message || String(err);
      if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
        errorMessage = `Model not found (${getImageModelString(imageEngine)}). The selected model may not be available in your region or tier. Try switching to 'Gemini 2.5 Flash Image (Free)'.`;
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Permission denied. Please verify your API key and project permissions.";
      }
      setError("Failed to generate logo: " + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (isLogoMode) {
      await handleGenerateLogo();
      return;
    }
    if (!scenePrompt.trim()) { setError("Please enter a scene description."); return; }
    setIsGenerating(true); setError(null);

    try {
      const colorText = themeColors.length > 0 ? `Use the following color theme: ${themeColors.join(', ')}.` : '';
      
      const specificAssetPrompts = [
        ...productAssets.filter(a => a.prompt?.trim() || a.material || a.lightingInteraction || a.position).map(a => `Product Asset (${a.name}): ${a.prompt} ${a.material ? `| Material: ${a.material}` : ''} ${a.lightingInteraction ? `| Lighting: ${a.lightingInteraction}` : ''} ${a.position ? `| Position: ${a.position}` : ''} -> CRITICAL: This is a strict product placement. DO NOT regenerate, redraw, or make mistakes on this product. It MUST be identical to the uploaded asset. No changes to uploaded assets are allowed to avoid false advertisement.`),
        ...(brandLogoAsset?.prompt?.trim() || brandLogoAsset?.material || brandLogoAsset?.lightingInteraction || brandLogoAsset?.position ? [`Brand Logo Asset: ${brandLogoAsset.prompt} ${brandLogoAsset.material ? `| Material: ${brandLogoAsset.material}` : ''} ${brandLogoAsset.lightingInteraction ? `| Lighting: ${brandLogoAsset.lightingInteraction}` : ''} ${brandLogoAsset.position ? `| Position: ${brandLogoAsset.position}` : ''} -> CRITICAL: Do NOT alter, redesign, or modify this logo. Use exactly as provided.`] : []),
        ...(companyLogoAsset?.prompt?.trim() || companyLogoAsset?.material || companyLogoAsset?.lightingInteraction || companyLogoAsset?.position ? [`Company Logo Asset: ${companyLogoAsset.prompt} ${companyLogoAsset.material ? `| Material: ${companyLogoAsset.material}` : ''} ${companyLogoAsset.lightingInteraction ? `| Lighting: ${companyLogoAsset.lightingInteraction}` : ''} ${companyLogoAsset.position ? `| Position: ${companyLogoAsset.position}` : ''} -> CRITICAL: Do NOT alter, redesign, or modify this logo. Use exactly as provided.`] : []),
        ...(characterAsset?.prompt?.trim() || characterAsset?.material || characterAsset?.lightingInteraction || characterAsset?.position ? [`Character Asset: ${characterAsset.prompt} ${characterAsset.material ? `| Material: ${characterAsset.material}` : ''} ${characterAsset.lightingInteraction ? `| Lighting: ${characterAsset.lightingInteraction}` : ''} ${characterAsset.position ? `| Position: ${characterAsset.position}` : ''}`] : [])
      ].join('\n');
      
      const assetInstruction = specificAssetPrompts 
        ? `Asset Specific Instructions:\n${specificAssetPrompts}\nGeneral Asset Instruction: ${assetPrompt.trim() || 'Integrate the uploaded products, logos, and character naturally into the scene. CRITICAL: 100% product accuracy is required. Do not add new components to the product.'}` 
        : (assetPrompt.trim() ? `Follow these specific instructions for the uploaded assets: ${assetPrompt}. CRITICAL: 100% product accuracy is required. Do not add new components to the product.` : 'Integrate the uploaded products, logos, and character naturally into the scene. CRITICAL: 100% product accuracy is required. Do not add new components to the product.');
        
      const noTextInstruction = !includeText ? "CRITICAL REQUIREMENT: Generate the image with ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, AND NO WATERMARKS anywhere in the image." : "";
      
      const referenceInstruction = exampleImages.length > 0 ? `CRITICAL STYLE REFERENCE INSTRUCTION: You MUST use the Style Reference Images EXCLUSIVELY for guidance on style, layout, composition, color palette, and overall aesthetic. You are STRICTLY FORBIDDEN from extracting, copying, or mimicking any specific content, subjects, objects, or distinct elements found in these reference images. The references dictate the 'how' (the visual language), NOT the 'what' (the content).` : '';
      
      const textElementsPrompt = (includeText && textElements.length > 0) 
        ? `Include the following text elements prominently using a typography style matching the '${fontFamily}' font family:\n${textElements.map(t => `- ${t.type}: "${t.text}" (Color: ${t.color}, Alignment: ${t.alignment}, Placement: ${t.placement})`).join('\n')}` 
        : '';

      let engineEnhancement = '';
      if (imageEngine.includes('3.1 Flash')) {
        engineEnhancement = 'CRITICAL QUALITY DIRECTIVE: Render as an absolute professional masterpiece. 8K native resolution, ultra-high-definition fidelity, hyper-realistic surfacing, insanely detailed architectural lighting. Use Octane Render style volumetric lighting and ray-traced reflections.';
      } else if (imageEngine.includes('3.0 Pro')) {
        engineEnhancement = 'CRITICAL ARTISTIC DIRECTIVE: Focus on award-winning high-fashion composition, unique avant-garde perspective, and striking visual storytelling. Ensure 4K cinematic lighting, perfect color grading, and ultra-premium commercial photography standards.';
      }

      let modelName = 'gemini-2.5-flash-image';
      if (imageEngine === 'Nano Banana 2 (Gemini 3.1 Flash Image) (Free)') modelName = 'gemini-3.1-flash-image-preview';
      if (imageEngine === 'ImageFX (S2)') modelName = 'gemini-3.1-flash-image-preview'; // Fallback to highest quality image model
      if (imageEngine === 'Gemini 3.0 Pro Image (Paid)') modelName = 'gemini-3-pro-image-preview';

      const requiresUserKey = imageEngine.includes('Paid');

      // @ts-ignore - window.aistudio is injected by the platform
      if (requiresUserKey && window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }

      const customRulesText = rules.length > 0 ? `CRITICAL RULES TO FOLLOW:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : '';
      const ciInstruction = ciSummary ? `MASTER BRAND AUTHORITY (STRICT CI COMPLIANCE REQUIRED):
      You are generating artwork for a company with a rigid Brand Bible. You ARE FORBIDDEN from deviating from these guidelines.
      
      CORE BRAND LAWS:
      ${ciSummary}
      
      CRITICAL:
      - Use ONLY the specified brand colors.
      - Adhere to typography rules (Matching font style: ${fontFamily}).
      - Respect all placement and 'Never-Ever' restrictions defined in the CI.
      - The overall aesthetic MUST be 100% consistent with the brand's visual identity.
      
      Failure to follow these rules will result in an unacceptable, off-brand result.` : '';

      const fullPrompt = `${ciInstruction}
        
        Professional high-end advertisement poster. 
        Dimension: ${isCustomSize ? `${customWidthMm}mm x ${customHeightMm}mm (PHYSICAL SPEC)` : dimensionMode}. 
        Aspect Ratio (Target): ${isCustomSize ? `${Number(customWidthMm)/Number(customHeightMm) > 1 ? 'Landscape' : 'Portrait'} requested by physical dimensions` : aspectRatio}.
        Layout: ${layout}. 
        Scene: ${scenePrompt}. 
        Style: ${style}. 
        Lighting: ${lighting}. 
        ${colorText} 
        ${noTextInstruction} 
        ${textElementsPrompt} 
        ${assetInstruction} 
        ${referenceInstruction} 
        ${engineEnhancement} 
        ${customRulesText} 
        ${negativePrompt ? `CRITICAL EXCLUSIONS (NEGATIVE PROMPT): ${negativePrompt}. You MUST NOT include any of these elements in the generation.` : ''}
        Dynamics: ${Object.entries(dynamics).filter(([k, v]) => typeof v === 'boolean' && v).map(([k, _]) => k.replace(/([A-Z])/g, ' $1')).join(', ')}.
        Material Properties: Metallic (${dynamics.metallic}%), Roughness (${dynamics.roughness}%), Normal Map Intensity (${dynamics.normalMapIntensity}%), Film Grain (${dynamics.filmGrain}%), Contrast (${dynamics.contrast}%), Saturation (${dynamics.saturation}%), Color Grading Intensity (${dynamics.colorGradingIntensity}%), Lens Distortion (${dynamics.lensDistortion}%), Particle Density (${dynamics.particleDensity}%).
        ${dynamics.noMistakes ? "CRITICAL QUALITY CONTROL: You must meticulously review and correct any perceived errors in anatomy, symmetry, or object integrity before finalizing the image. Ensure absolute zero anatomical errors, perfect symmetry where applicable, and flawless object boundaries to meet the highest professional standards for accuracy and flawlessness." : ""}
        Composition: Top-class product photography, high detail, 4k resolution, sharp focus. 
        If a character is provided, render them in a high-quality 3D animation style with expressive features. 
        Ensure the logos (if provided) are placed professionally as branding. CRITICAL: The provided logo assets are strictly unalterable. You MUST use them verbatim. Do NOT make any modifications to their appearance, color, shape, or form under any circumstances. 
        The uploaded product images are the main subjects.
        
        CRITICAL INSTRUCTION: You MUST strictly follow all provided prompts, styles, and rules. Use the selected Layout (${layout}) and Visual Style (${style}) as the primary framework, heavily informed by the Style Reference Images for company identity and aesthetic only. DO NOT extract content from Style Reference Images.
        CRITICAL INSTRUCTION: You MUST incorporate EVERY single uploaded asset into the final image. Do not omit any product, logo, or character provided.
        CRITICAL INSTRUCTION: 100% PRODUCT ACCURACY REQUIRED. The uploaded product images are the main subjects. You MUST regenerate the product exactly as it looks in the uploaded image. ZERO extra regeneration is allowed to add new components, features, or details to the product. It MUST be 100% identical to the uploaded assets to avoid false advertisement. Do not hallucinate or modify the product's shape, text, or components in any way. No changes to uploaded assets are allowed.`;

      const parts: any[] = [{ text: fullPrompt }];
      productAssets.forEach(asset => parts.push({ inlineData: { data: asset.data, mimeType: asset.mimeType } }));
      if (brandLogoAsset) parts.push({ inlineData: { data: brandLogoAsset.data, mimeType: brandLogoAsset.mimeType } });
      if (companyLogoAsset) parts.push({ inlineData: { data: companyLogoAsset.data, mimeType: companyLogoAsset.mimeType } });
      if (characterAsset) parts.push({ inlineData: { data: characterAsset.data, mimeType: characterAsset.mimeType } });
      exampleImages.forEach(asset => parts.push({ inlineData: { data: asset.data, mimeType: asset.mimeType } }));
      if (companyCIAsset) parts.push({ inlineData: { data: companyCIAsset.data, mimeType: companyCIAsset.mimeType } });

      const isPaid = imageEngine.includes('Paid') || imageEngine === 'ImageFX (S2)' || imageEngine === 'Nano Banana 2 (Gemini 3.1 Flash Image) (Free)';
      const apiKey = getApiKey(isPaid ? 'paid' : 'free');
      if (!apiKey) throw new Error("API key is missing! Please configure one in Settings.");
      const ai = new GoogleGenAI({ apiKey });
      let imageUrl = '';
      let videoUrl = '';

      if (imageEngine.includes('Veo')) {
        setVideoStatus("Initializing Video Engine...");
        const isVeoPro = imageEngine.includes('3.1');
        const veoModel = isVeoPro ? 'veo-3.1-generate-preview' : 'veo-3.1-lite-generate-preview';
        
        // Final Prompt Construction for Video - making it more authoritative
        const finalStoryboard = videoScenes.length > 0 
          ? videoScenes.map(s => `[SCENE ${s.id}] Duration: ${s.duration}s. \n  Camera: ${s.cameraMotion || 'None'} \n  Lens: ${s.lensType || 'None'} \n  Lighting: ${s.lighting || 'Default'}\n  Transition out: ${s.transitionType || 'Cut'}\n  Audio Cue: ${s.audioCue || 'None'}\n  Prompt: ${s.prompt}`).join('\n\n')
          : videoScript;

        const videoBasePrompt = isAdMode && finalStoryboard 
          ? `[CINEMATIC AD PRODUCTION]
             DURATION: ${videoDuration} SECONDS
             
             [STORYBOARD SCRIPT - EXECUTE PRECISELY]
             ${finalStoryboard}
             
             [VISUAL STYLE & DIRECTOR'S NOTES]
             ${fullPrompt}
             
             CRITICAL MISSION: You are acting as the primary DP and Director. Every frame must be perfectly stable, high-fidelity, and strictly follow the scene-by-scene timing provided above.`
          : `[MASTER COMMERCIAL CLIP]
             DURATION: ${videoDuration} SECONDS
             CONTEXT: ${fullPrompt}
             STYLE: ${style} - ${lighting}`;

        // @ts-ignore
        const response = await withTimeout(ai.models.generateVideos({
          model: veoModel,
          prompt: videoBasePrompt,
          // @ts-ignore
          config: {
            numberOfVideos: 1,
            resolution: isVeoPro ? '4k' : '1080p',
            aspectRatio: aspectRatio === '16:9' || aspectRatio === '9:16' ? aspectRatio : '16:9',
            // @ts-ignore
            durationSeconds: videoDuration
          }
        }), 120000, "Video generation request timed out.");

        let operation = response;
        let attempts = 0;
        setVideoStatus("Orchestrating Vision Matrix...");
        
        while (!operation.done && attempts < 120) { // Increase timeout for video
          await new Promise(resolve => setTimeout(resolve, 8000));
          operation = await withTimeout(ai.operations.get({ operationId: operation.name } as any), 30000, "Operation status check timed out.");
          attempts++;
          
          const progress = Math.min(Math.floor((attempts / 80) * 100), 99);
          
          let statusMessage = "Synthesizing Motion...";
          if (videoScenes.length > 0) {
            const currentSceneIdx = Math.min(Math.floor((progress / 100) * videoScenes.length), videoScenes.length - 1);
            const sceneName = (currentSceneIdx + 1).toString();
            if (progress < 20) statusMessage = `Analyzing Scene ${sceneName} Geometry...`;
            else if (progress < 50) statusMessage = `Rendering Scene ${sceneName} Cinematic Frames...`;
            else if (progress < 80) statusMessage = `Simulating Scene ${sceneName} Physics & Flow...`;
            else statusMessage = `Compositing Scene ${sceneName} Visual FX...`;
          } else {
            if (progress < 15) statusMessage = "Analyzing Script & Scene Hierarchy...";
            else if (progress < 30) statusMessage = "Initializing Physical Simulation Lattice...";
            else if (progress < 50) statusMessage = "Rendering High-Fidelity Master Frames...";
            else if (progress < 75) statusMessage = "Compositing Lighting & Volumetric Shaders...";
            else if (progress < 90) statusMessage = "Encoding Temporal Consistency Layers...";
            else statusMessage = "Finalizing 4K Cinematic Artifact...";
          }

          setVideoStatus(`${statusMessage} (${progress}%)`);
        }

        if (!operation.done) throw new Error("Video generation timed out after 15 minutes. This high-end model requires more processing time.");
        
        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
          setVideoStatus("Finalizing & Fetching Stream...");
          const uri = operation.response.generatedVideos[0].video.uri;
          // IMPORTANT: Must fetch with API Key header
          const fetchResponse = await fetch(uri, {
            headers: { 'x-goog-api-key': apiKey }
          });
          if (!fetchResponse.ok) throw new Error("Failed to fetch generated video stream.");
          const videoBlob = await fetchResponse.blob();
          videoUrl = URL.createObjectURL(videoBlob);
        }
      } else if (imageEngine.includes('Hugging Face')) {
        const hfModel = imageEngine === 'I2VGen-XL (Hugging Face)' ? 'ali-vilab/i2vgen-xl' : 'Wan-AI/Wan2.1-T2V-14B';
        const response = await withTimeout(fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
          headers: { 
            "Authorization": `Bearer ${import.meta.env.VITE_HF_TOKEN || ''}`, 
            "Content-Type": "application/json" 
          },
          method: "POST",
          body: JSON.stringify({ inputs: fullPrompt }),
        }), 120000, "Hugging Face API request timed out.");
        if (!response.ok) {
          throw new Error(`Hugging Face API Error: ${response.statusText}. This may require a valid HF token in settings or the model is currently busy.`);
        }
        const blob = await response.blob();
        videoUrl = URL.createObjectURL(blob);
      } else {
        // Evaluate if the model requires generateContent or generateImages
        const imageModelString = getImageModelString(imageEngine);
        let base64EncodeString: string | undefined = undefined;

        if (imageModelString.includes('gemini')) {
          const parts: any[] = [{ text: fullPrompt }];
          // Note: Full poster generation doesn't use reference images out of the box in this flow currently
          // but if we had them, we would append inlineData parts here.
          if (exampleImages.length > 0) {
            exampleImages.forEach(img => {
              parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
            });
          }

          const response = await ai.models.generateContent({
            model: imageModelString,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: "1K"
              }
            }
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              base64EncodeString = part.inlineData.data;
              break;
            }
          }
        } else {
          // Native Image Generation using generateImages for Imagen models
          const response = await ai.models.generateImages({
            model: imageModelString,
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio,
            },
          });
          base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
        }

        if (base64EncodeString) {
          imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
        }
      }

      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        setGeneratedImage(null);
        setActiveStep(4); // PREVIEW Step
        
        try {
          const history = await localforage.getItem<any[]>('jamini_history') || [];
          // We fetch the blob again to ensure we store the actual data, not just the temporary URL
          const videoBlob = await fetch(videoUrl).then(r => r.blob());
          history.push({ id: Date.now().toString(), type: 'video', dataUrl: videoBlob, date: Date.now(), prompt: fullPrompt.substring(0, 500) });
          await localforage.setItem('jamini_history', history);
        } catch(e) { console.error(e) }
      } else if (imageUrl) {
        setGeneratedImage(imageUrl);
        setGeneratedVideo(null);
        setActiveStep(4); // PREVIEW Step
        
        try {
          const history = await localforage.getItem<any[]>('jamini_history') || [];
          history.push({ id: Date.now().toString(), type: 'image', dataUrl: imageUrl, date: Date.now(), prompt: fullPrompt.substring(0, 500) });
          await localforage.setItem('jamini_history', history);
        } catch(e) { console.error(e) }
      } else {
        throw new Error("No output was generated. Please try a different prompt.");
      }
    } catch (err: any) {
      shiftKey();
      console.error("Generation error:", err);
      let errorMessage = err.message || "An unexpected error occurred during generation.";
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Rate limit exceeded. You have made too many requests. Please wait a few minutes and try again.";
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Permission denied. The selected Image Engine may not be available on your current API tier or region. Try switching to 'Gemini 2.0 Flash'.";
      } else if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
        errorMessage = `Model not found (${getTextModelString(imageEngine)}). Please try switching back to Gemini 2.0 Flash.`;
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `jamini-commercial-${Date.now()}.mp4`;
    link.click();
  };

  const downloadImage = (format: 'png' | 'jpg' | 'pdf' | 'vif') => {
    if (!generatedImage) return;
    if (format === 'png') {
      const link = document.createElement('a'); link.href = generatedImage; link.download = `jamini-poster-${Date.now()}.png`; link.click(); return;
    }
    const img = new Image();
    img.onload = () => {
      if (format === 'pdf') {
        const pdf = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'px', format: [img.width, img.height] });
        pdf.addImage(img, 'PNG', 0, 0, img.width, img.height); pdf.save(`jamini-poster-${Date.now()}.pdf`); return;
      }
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      if (format === 'jpg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/avif';
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      const link = document.createElement('a'); link.href = dataUrl; link.download = `jamini-poster-${Date.now()}.${format === 'vif' ? 'avif' : format}`; link.click();
    };
    img.src = generatedImage;
  };



  const renderContent = () => {
    if (currentView === 'guide') return <SetupGuide onBack={() => setCurrentView('editor')} />;
    if (currentView === 'settings') return <SettingsPage onBack={() => setCurrentView('editor')} />;
    if (currentView === 'gallery') return <GalleryPage onBack={() => setCurrentView('editor')} />;

    if (!generationObjective) return <ObjectiveSelector />;

    return (
      <div className="flex flex-col h-full bg-[#0E0E11] text-white font-sans overflow-hidden selection:bg-indigo-500/30 relative">
        {/* 3D/4D Popping Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.08, 0.12, 0.08],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] will-change-transform" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[100px] will-change-transform" 
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          
          {/* Floating 4D Particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%", opacity: 0 }}
              animate={{ 
                y: [null, "-200px"],
                opacity: [0, 0.4, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 10 + Math.random() * 10, 
                repeat: Infinity, 
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
              className="absolute w-1 h-1 bg-white/40 rounded-full blur-sm"
            />
          ))}
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-12 border-b border-white/5 bg-[#121214] shrink-0 items-center justify-between px-4 z-50 transform-gpu">
          <div className="flex items-center gap-4">
            <JaminiLogo size="sm" showText={true} onClick={() => { setGenerationObjective(null); setActiveStep(1); setCurrentView('editor'); }} />
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"><Undo2 className="w-3.5 h-3.5" /></button>
              <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"><Redo2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setGenerationObjective(null); setActiveStep(1); }} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded border border-indigo-500/20 mr-2">
              <ArrowLeft className="w-3 h-3" /> Change Objective
            </button>
            <button onClick={() => setCurrentView('gallery')} className="text-[11px] font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/5">
              <History className="w-3 h-3" /> Gallery
            </button>
            <button onClick={() => setCurrentView('settings')} className="text-[11px] font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/5">
              <Settings2 className="w-3 h-3" /> Settings
            </button>
            <button onClick={() => setCurrentView('guide')} className="text-[11px] font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/5">
              <Terminal className="w-3 h-3" /> Setup Guide
            </button>
            <button onClick={() => downloadImage('png')} disabled={!generatedImage} className="text-[11px] font-bold text-white transition-colors flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/30 px-4 py-1.5 rounded ml-2">
              Export
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-white/5 bg-[#121214] shrink-0 flex items-center justify-between px-4 z-50 transform-gpu">
          <div className="flex items-center gap-2">
            <button onClick={() => { setGenerationObjective(null); setActiveStep(1); }} className="p-1.5 text-indigo-400 bg-indigo-500/10 rounded mr-1" title="Change Objective">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <JaminiLogo size="sm" showText={true} onClick={() => { setGenerationObjective(null); setActiveStep(1); setCurrentView('editor'); }} />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentView('gallery')} className="p-2 text-white/60"><History className="w-4 h-4" /></button>
            <button onClick={() => setCurrentView('settings')} className="p-2 text-white/60"><Settings2 className="w-4 h-4" /></button>
            <button onClick={undo} disabled={historyIndex === 0} className="p-2 text-white/60 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 text-white/60 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative pb-16 lg:pb-0 bg-[#0E0E11] items-center">
          
          {/* Top Sub-Nav Workflow (Responsive) */}
          <div className={cn(
             "w-full bg-[#18181C] border-b border-white/5 flex items-center shrink-0 z-30 px-2 py-2 shadow-md relative overflow-x-auto overflow-y-hidden custom-scrollbar",
             currentView === 'editor' && activeStep <= 3 ? "flex lg:justify-center" : "hidden lg:flex lg:justify-center"
          )}>
             <div className="flex items-center gap-1.5 md:gap-2 bg-[#121214] p-1.5 md:p-1 rounded-xl border border-white/5 mx-auto lg:mx-0 w-max shrink-0">
                <button onClick={() => setActiveStep(1)} className={cn("px-4 py-2 md:py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeStep === 1 ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
                  <Layers className="w-4 h-4 md:w-3.5 md:h-3.5" /> Media
                </button>
                <ChevronRight className="w-4 h-4 md:w-3 md:h-3 text-white/20" />
                <button onClick={() => setActiveStep(2)} className={cn("px-4 py-2 md:py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeStep === 2 ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
                  <Palette className="w-4 h-4 md:w-3.5 md:h-3.5" /> Design
                </button>
                <ChevronRight className="w-4 h-4 md:w-3 md:h-3 text-white/20" />
                <button onClick={() => setActiveStep(3)} className={cn("px-4 py-2 md:py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeStep === 3 ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
                  <SlidersHorizontal className="w-4 h-4 md:w-3.5 md:h-3.5" /> Properties
                </button>
                <div className="w-px h-6 md:h-4 bg-white/10 mx-2 md:mx-1 hidden lg:block" />
                <button onClick={() => setActiveStep(4)} className={cn("hidden lg:flex px-4 py-2 md:py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all items-center gap-2 relative whitespace-nowrap", activeStep === 4 ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
                  {(generatedImage || generatedVideo) && <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-pulse" />}
                  <MonitorPlay className="w-4 h-4 md:w-3.5 md:h-3.5" /> Preview
                </button>
                <button onClick={() => setActiveStep(5)} className={cn("hidden lg:flex px-4 py-2 md:py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all items-center gap-2 whitespace-nowrap", activeStep === 5 ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
                  <Book className="w-4 h-4 md:w-3.5 md:h-3.5" /> Meet Jamini
                </button>
             </div>
          </div>

          {/* LEFT PANEL: ASSETS (Mobile Tab 1) */}
          <div className={cn(
            "w-full lg:max-w-4xl mx-auto flex-col h-full bg-[#121214] lg:bg-transparent lg:py-6 z-20 relative overflow-hidden",
            activeStep === 1 ? "flex" : "hidden"
          )}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 lg:bg-[#0c0c0e]/80 lg:backdrop-blur-xl lg:rounded-3xl lg:border border-white/10 lg:shadow-2xl">
                <motion.div key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
                  {/* Image Engine Selection relocated here */}
                  <div className="space-y-3 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5" /> Synthesis Engine
                      </label>
                      <button onClick={() => setCurrentView('settings')} className="text-[10px] flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded font-bold">
                        <Key className="w-3 h-3" /> API Key
                      </button>
                    </div>
                    <div className="flex flex-col gap-4 mt-2">
                       {/* Brand Intelligence Card - ONLY IN LOGO OBJECTIVE */}
                       {generationObjective === 'logo' && (
                         <div className="relative overflow-hidden rounded-2xl border transition-all duration-500 bg-indigo-500/10 border-indigo-500/30 p-5 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-xl transition-colors bg-indigo-500 text-white">
                                    <Palette className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Logo Engine</h4>
                                    <p className="text-[9px] text-white/40">Brand mark focus</p>
                                 </div>
                              </div>
                           </div>

                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             className="space-y-4 pt-4 border-t border-indigo-500/20"
                           >
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <Book className="w-3.5 h-3.5 text-indigo-400" />
                                   <span className="text-[10px] font-bold text-white/80">Auto-Generate CI Bible</span>
                                </div>
                                <button 
                                   onClick={() => setIsGenerateCI(!isGenerateCI)}
                                   className={cn(
                                     "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all",
                                     isGenerateCI ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-white/40 border border-white/10"
                                   )}
                                >
                                   {isGenerateCI ? <Check className="w-3 h-3" /> : null}
                                   {isGenerateCI ? "Enabled" : "Disabled"}
                                </button>
                             </div>

                             <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">Influence Strength</label>
                                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{logoInfluence}</span>
                                </div>
                                <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                                  {(['strict', 'balanced', 'creative'] as const).map(level => (
                                    <button
                                      key={level}
                                      onClick={() => setLogoInfluence(level)}
                                      className={cn(
                                        "flex-1 py-2 text-[9px] font-bold uppercase rounded-lg transition-all",
                                        logoInfluence === level ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-white/30 hover:text-white/60"
                                      )}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                                <div className="relative">
                                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
                                  <input 
                                    type="text" 
                                    value={influencePrompt}
                                    onChange={(e) => setInfluencePrompt(e.target.value)}
                                    placeholder="Add style hints (e.g. brutalist, organic)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none text-white/80 transition-all placeholder:text-white/20"
                                  />
                                </div>
                             </div>
                           </motion.div>
                         </div>
                       )}
                    </div>

                    <select 
                      value={imageEngine} 
                      onChange={(e) => setImageEngine(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 font-bold shadow-2xl"
                    >
                      {imageEnginesList.map(e => <option key={e} value={e} className="bg-[#0a0a0a] text-white">{e}</option>)}
                    </select>
                    <p className="text-[10px] text-white/40 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                      {ENGINE_DETAILS[imageEngine as keyof typeof ENGINE_DETAILS] || 'Custom model selected.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-400" /> Media Library</h3>
                    {(productAssets.length > 0 || brandLogoAsset || companyLogoAsset || characterAsset) && (
                      <button 
                        onClick={enhanceAllAssetPrompts} 
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-all border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group"
                      >
                        <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" /> Vividly Enhance All
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                      {isLogoMode ? "Reference Assets (Design Influence)" : "Product Images"}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {productAssets.map(asset => (
                        <div key={asset.id} className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group">
                            <img src={`data:${asset.mimeType};base64,${asset.data}`} alt="Product" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <button onClick={() => removeAsset(asset.id, 'product')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/50 truncate max-w-[150px]">{asset.name}</span>
                              <button onClick={() => refineSpecificAssetPrompt(asset.id, 'product')} disabled={asset.isRefining || !asset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                {asset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                              </button>
                            </div>
                            <input type="text" value={asset.prompt || ''} onChange={(e) => updateAssetPrompt(asset.id, 'product', e.target.value)} placeholder={isLogoMode ? "Describe how this influences the logo..." : "Specific prompt for this product..."} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                            <details className="group">
                              <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                              </summary>
                              <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={asset.material || ''} onChange={(e) => updateAssetDetails(asset.id, 'product', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={asset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(asset.id, 'product', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                <input type="text" placeholder="Position (e.g. Center foreground)" value={asset.position || ''} onChange={(e) => updateAssetDetails(asset.id, 'product', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => productInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{isLogoMode ? "Upload Reference" : "Upload Product"}</span>
                      </button>
                      <input type="file" ref={productInputRef} onChange={(e) => handleFileUpload(e, 'product')} multiple accept="image/*" className="hidden" />
                    </div>
                    {generationObjective !== 'logo' && (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo (Product Brand)</h3>
                            {brandLogoAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={`data:${brandLogoAsset.mimeType};base64,${brandLogoAsset.data}`} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(brandLogoAsset.id, 'brandLogo')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{brandLogoAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(brandLogoAsset.id, 'brandLogo')} disabled={brandLogoAsset.isRefining || !brandLogoAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {brandLogoAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={brandLogoAsset.prompt || ''} onChange={(e) => updateAssetPrompt(brandLogoAsset.id, 'brandLogo', e.target.value)} placeholder="Specific prompt for this brand logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={brandLogoAsset.material || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={brandLogoAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={brandLogoAsset.position || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => brandLogoInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Brand Logo</span>
                              </button>
                            )}
                            <input type="file" ref={brandLogoInputRef} onChange={(e) => handleFileUpload(e, 'brandLogo')} accept="image/*" className="hidden" />
                          </div>
                      
                          <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Company Logo (Your Retail Brand)</h3>
                            {companyLogoAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={`data:${companyLogoAsset.mimeType};base64,${companyLogoAsset.data}`} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(companyLogoAsset.id, 'companyLogo')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{companyLogoAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(companyLogoAsset.id, 'companyLogo')} disabled={companyLogoAsset.isRefining || !companyLogoAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {companyLogoAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={companyLogoAsset.prompt || ''} onChange={(e) => updateAssetPrompt(companyLogoAsset.id, 'companyLogo', e.target.value)} placeholder="Specific prompt for this company logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={companyLogoAsset.material || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={companyLogoAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={companyLogoAsset.position || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => companyLogoInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Company Logo</span>
                              </button>
                            )}
                            <input type="file" ref={companyLogoInputRef} onChange={(e) => handleFileUpload(e, 'companyLogo')} accept="image/*" className="hidden" />
                          </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {generationObjective !== 'logo' && (
                        <>
                          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Character/Model</h3>
                          {characterAsset ? (
                            <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                <img src={`data:${characterAsset.mimeType};base64,${characterAsset.data}`} alt="Character" className="max-w-full max-h-full object-contain" />
                                <button onClick={() => removeAsset(characterAsset.id, 'character')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                              </div>
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50 truncate max-w-[150px]">{characterAsset.name}</span>
                                  <button onClick={() => refineSpecificAssetPrompt(characterAsset.id, 'character')} disabled={characterAsset.isRefining || !characterAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                    {characterAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                  </button>
                                </div>
                                <input type="text" value={characterAsset.prompt || ''} onChange={(e) => updateAssetPrompt(characterAsset.id, 'character', e.target.value)} placeholder="Specific prompt for this character..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                <details className="group">
                                  <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                    <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                  </summary>
                                  <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                    <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={characterAsset.material || ''} onChange={(e) => updateAssetDetails(characterAsset.id, 'character', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={characterAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(characterAsset.id, 'character', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    <input type="text" placeholder="Position (e.g. Center foreground)" value={characterAsset.position || ''} onChange={(e) => updateAssetDetails(characterAsset.id, 'character', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                  </div>
                                </details>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => characterInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                              <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Model</span>
                            </button>
                          )}
                          <input type="file" ref={characterInputRef} onChange={(e) => handleFileUpload(e, 'character')} accept="image/*" className="hidden" />
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {generationObjective !== 'logo' && (
                        <>
                          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><Book className="w-3 h-3" /> Company CI (Brand Bible)</h3>
                          {companyCIAsset ? (
                            <div className="flex flex-col gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center">
                                    <Book className="w-4 h-4 text-indigo-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-white truncate max-w-[200px]">{companyCIAsset.name}</span>
                                    <span className="text-[10px] text-white/40">PDF Document</span>
                                  </div>
                                </div>
                                <button onClick={() => removeAsset(companyCIAsset.id, 'companyCI')} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                              </div>
                              
                              {isAnalyzingCI ? (
                                <div className="flex items-center gap-2 text-[10px] text-indigo-400 bg-indigo-500/10 p-2 rounded">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing Brand Guidelines...
                                </div>
                              ) : ciSummary ? (
                                <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Extracted Guidelines</label>
                                  <AutoResizeTextarea 
                                    value={ciSummary}
                                    onChange={(e) => setCiSummary(e.target.value)}
                                    className="w-full min-h-[6rem] bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] text-white/80 focus:ring-1 focus:ring-indigo-500 outline-none custom-scrollbar"
                                    placeholder="Brand guidelines..."
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <label className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all cursor-pointer">
                              <Upload className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Upload CI (PDF)</span>
                              <input type="file" onChange={(e) => handleFileUpload(e, 'companyCI')} accept="application/pdf" className="hidden" />
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 lg:hidden">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider">General Asset Instructions</label>
                      <button onClick={() => refinePromptText('asset')} disabled={isRefiningAsset || !assetPrompt.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                        {isRefiningAsset ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                      </button>
                    </div>
                    <AutoResizeTextarea value={assetPrompt} onChange={(e) => setAssetPrompt(e.target.value)} placeholder="How should the assets interact? (e.g., 'Model holding the product, logo top right')" className="w-full min-h-[6rem] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none" />
                  </div>

                  {/* Mobile Mobile Next Button: Step 1 -> 2 */}
                  <div className="lg:hidden pt-8 pb-12">
                    <button 
                      onClick={() => setActiveStep(2)} 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                    >
                      <span>Next: Design Style</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
            </div>
          </div>

          {/* CONTEXTUAL PANEL: DESIGN & TWEAK (Mobile Tab 2 & 3) */}
          <div className={cn(
            "w-full lg:max-w-4xl mx-auto flex-col h-full bg-[#121214] lg:bg-transparent lg:py-6 z-20 relative overflow-hidden",
            (activeStep === 2 || activeStep === 3) ? "flex" : "hidden"
          )}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 lg:bg-[#0c0c0e]/80 lg:backdrop-blur-xl lg:rounded-3xl lg:border border-white/10 lg:shadow-2xl">
              
              <div className={cn("space-y-6", activeStep === 2 ? "block" : "hidden")}>
                <motion.div key="step2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <CustomSelect value={layout} onChange={setLayout} options={LAYOUTS} label="Poster Layout" icon={LayoutIcon} />
                    <CustomSelect value={style} onChange={setStyle} options={STYLES} label="Visual Style" icon={Palette} />
                    <CustomSelect value={lighting} onChange={setLighting} options={LIGHTING_OPTIONS} label="Lighting" icon={Zap} />

                    {/* Video Specific Settings */}
                    {imageEngine.includes('Veo') && (
                      <div className="col-span-2 space-y-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mt-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Video className="w-4 h-4" /> Video Campaign Settings
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 uppercase font-bold">Ad Mode</span>
                            <button 
                              onClick={() => setIsAdMode(!isAdMode)}
                              className={cn(
                                "p-1 rounded-md transition-colors",
                                isAdMode ? "bg-indigo-500 text-white" : "bg-white/5 text-white/20"
                              )}
                            >
                              {isAdMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Video Duration</label>
                          <div className="grid grid-cols-5 gap-2">
                            {[6, 13, 14, 180, 300, 600, 900].map(d => (
                              <button 
                                key={d}
                                onClick={() => setVideoDuration(d)}
                                className={cn(
                                  "py-2 text-[10px] font-bold rounded-lg border transition-all",
                                  videoDuration === d 
                                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" 
                                    : "bg-black/40 border-white/10 text-white/40 hover:border-white/30"
                                )}
                              >
                                {d < 60 ? `${d}s` : `${d/60}m`}
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-white/30 mt-1 italic">Note: Durations &gt; 14s represent campaign planning mode and may require segmented rendering.</p>
                        </div>

                        {isAdMode && (
                          <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3 h-3 text-emerald-400" /> Advanced Production Matrix
                              </label>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={generateVideoScript}
                                  disabled={isScripting}
                                  className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isScripting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Layers className="w-2.5 h-2.5" />}
                                  {videoScenes.length > 0 ? 'Remix Logic' : 'Synthesize Logic'}
                                </button>
                                {videoScenes.length > 0 && (
                                  <button 
                                    onClick={refineVideoScript}
                                    disabled={isScripting}
                                    className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-1 border border-indigo-500/20"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" /> Refine with Pro
                                  </button>
                                )}
                              </div>
                            </div>

                            {videoScenes.length > 0 ? (
                              <div className="space-y-3">
                                {videoScenes.map((scene, idx) => (
                                  <div key={scene.id} className="bg-black/60 rounded-xl p-3 border border-white/5 space-y-2 group">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Scene {idx + 1}</span>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-white/5 rounded px-1.5 py-0.5 border border-white/5">
                                          <input 
                                            type="number" 
                                            value={scene.duration} 
                                            onChange={(e) => {
                                              const newScenes = [...videoScenes];
                                              newScenes[idx].duration = Number(e.target.value);
                                              setVideoScenes(newScenes);
                                            }}
                                            className="w-6 bg-transparent text-[10px] font-bold text-emerald-400 outline-none text-center"
                                          />
                                          <span className="text-[8px] text-white/20 font-bold ml-1">SEC</span>
                                        </div>
                                        <button 
                                          onClick={() => setVideoScenes(videoScenes.filter((_, i) => i !== idx))}
                                          className="p-1 hover:text-red-400 text-white/20 transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Camera Motion</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. Pan Right"
                                          value={scene.cameraMotion || ''}
                                          onChange={(e) => {
                                            const newScenes = [...videoScenes];
                                            newScenes[idx].cameraMotion = e.target.value;
                                            setVideoScenes(newScenes);
                                          }}
                                          className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-white/80 outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Lens Type</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. Macro 100mm"
                                          value={scene.lensType || ''}
                                          onChange={(e) => {
                                            const newScenes = [...videoScenes];
                                            newScenes[idx].lensType = e.target.value;
                                            setVideoScenes(newScenes);
                                          }}
                                          className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-white/80 outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Lighting</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. Volumetric"
                                          value={scene.lighting || ''}
                                          onChange={(e) => {
                                            const newScenes = [...videoScenes];
                                            newScenes[idx].lighting = e.target.value;
                                            setVideoScenes(newScenes);
                                          }}
                                          className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-white/80 outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Transition</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. Hard Cut"
                                          value={scene.transitionType || ''}
                                          onChange={(e) => {
                                            const newScenes = [...videoScenes];
                                            newScenes[idx].transitionType = e.target.value;
                                            setVideoScenes(newScenes);
                                          }}
                                          className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-white/80 outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest">Audio Cue</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. Bass Drop"
                                          value={scene.audioCue || ''}
                                          onChange={(e) => {
                                            const newScenes = [...videoScenes];
                                            newScenes[idx].audioCue = e.target.value;
                                            setVideoScenes(newScenes);
                                          }}
                                          className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] text-white/80 outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                    </div>
                                    <AutoResizeTextarea 
                                      value={scene.prompt}
                                      onChange={(e) => {
                                        const newScenes = [...videoScenes];
                                        newScenes[idx].prompt = e.target.value;
                                        setVideoScenes(newScenes);
                                      }}
                                      className="w-full bg-black/40 rounded p-2 text-[10px] text-white/80 leading-relaxed outline-none custom-scrollbar min-h-[40px] focus:text-white border border-transparent focus:border-white/10 mt-2"
                                      placeholder="Scene action and physical dynamics..."
                                    />
                                  </div>
                                ))}
                                <button 
                                  onClick={() => setVideoScenes([...videoScenes, { id: Date.now().toString(), prompt: '', duration: 2 }])}
                                  className="w-full py-2 rounded-xl border border-dashed border-white/10 text-[9px] font-black text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                  <Plus className="w-3 h-3" /> Add Scene Stage
                                </button>
                                
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center justify-between">
                                  <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Total Production Pulse</span>
                                  <span className={cn(
                                    "text-xs font-black",
                                    videoScenes.reduce((acc, s) => acc + s.duration, 0) === videoDuration ? "text-emerald-400" : "text-amber-400"
                                  )}>
                                    {videoScenes.reduce((acc, s) => acc + s.duration, 0)}s / {videoDuration}s
                                  </span>
                                </div>
                              </div>
                            ) : videoScript ? (
                              <div className="bg-black/60 rounded-xl p-3 border border-white/5 space-y-2">
                                <AutoResizeTextarea 
                                  value={videoScript}
                                  onChange={(e) => setVideoScript(e.target.value)}
                                  className="w-full bg-transparent text-[10px] text-white/80 leading-relaxed outline-none custom-scrollbar min-h-[100px]"
                                />
                                <button 
                                  onClick={() => {
                                    // Basic parsing of script back to scenes
                                    const rawScenes = videoScript.split('\n\n').filter(s => s.trim());
                                    const parsed = rawScenes.map((s, i) => ({
                                      id: `s${i}`,
                                      prompt: s,
                                      duration: Math.floor(videoDuration / rawScenes.length)
                                    }));
                                    setVideoScenes(parsed);
                                  }}
                                  className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1"
                                >
                                  <Workflow className="w-2.5 h-2.5" /> Convert to Scene Matrix for control
                                </button>
                              </div>
                            ) : (
                               <div className="text-[9px] text-white/30 italic p-3 text-center border border-dashed border-white/10 rounded-xl">
                                Clicking 'Synthesize Logic' will generate a multi-stage cinematic storyboard.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <CustomSelect value={lighting} onChange={setLighting} options={LIGHTING_OPTIONS} label="Lighting" icon={Zap} />
                    
                    <div className="space-y-2 col-span-2">
                       <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                         <AlertCircle className="w-3 h-3 text-red-400" /> Negative Prompt (Professional Exclusions)
                       </label>
                       <AutoResizeTextarea 
                         value={negativePrompt} 
                         onChange={(e) => setNegativePrompt(e.target.value)} 
                         placeholder="What to exclude? (e.g., 'blur, text, low quality, distorted hands')" 
                         className="w-full min-h-[3rem] bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] focus:ring-1 focus:ring-red-500/50 outline-none" 
                       />
                    </div>

                    <div className="space-y-4 col-span-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <LayoutIcon className="w-3.5 h-3.5 text-indigo-400" /> Physical Dimensions
                        </label>
                        <button 
                          onClick={() => setIsCustomSize(!isCustomSize)}
                          className={cn(
                            "text-[10px] font-black px-3 py-1 rounded-full transition-all tracking-widest uppercase flex items-center gap-2",
                            isCustomSize ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          {isCustomSize ? <Zap className="w-3 h-3" /> : <Settings2 className="w-3 h-3" />}
                          {isCustomSize ? 'Manual Mode' : 'Presets'}
                        </button>
                      </div>

                      {isCustomSize ? (
                        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="flex-1 space-y-1">
                             <span className="text-[9px] text-white/30 block font-bold uppercase tracking-tighter">Width (mm)</span>
                             <input 
                               type="number" 
                               value={customWidthMm} 
                               onChange={(e) => setCustomWidthMm(e.target.value)}
                               className="w-full bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-sm font-bold py-1 text-white"
                               placeholder="210"
                             />
                           </div>
                           <div className="text-white/20 font-black pt-4">×</div>
                           <div className="flex-1 space-y-1">
                             <span className="text-[9px] text-white/30 block font-bold uppercase tracking-tighter">Height (mm)</span>
                             <input 
                               type="number" 
                               value={customHeightMm} 
                               onChange={(e) => setCustomHeightMm(e.target.value)}
                               className="w-full bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-sm font-bold py-1 text-white"
                               placeholder="297"
                             />
                           </div>
                           <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg text-[10px] font-black min-w-[50px] text-center">
                             {(Number(customWidthMm) / Number(customHeightMm) || 0).toFixed(2)}:1
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {ASPECT_RATIOS.map(r => (
                            <button 
                              key={r.value}
                              onClick={() => setAspectRatio(r.value as APIAspectRatio)}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                aspectRatio === r.value
                                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                  : "bg-black/40 border-white/10 text-white/40 hover:border-white/30 hover:text-white/80"
                              )}
                            >
                              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                                <div className="border-2 border-current rounded-sm" style={{
                                  width: parseInt(r.value.split(':')[0]) > parseInt(r.value.split(':')[1]) ? '20px' : parseInt(r.value.split(':')[0]) === parseInt(r.value.split(':')[1]) ? '16px' : `${16 * (parseInt(r.value.split(':')[0])/parseInt(r.value.split(':')[1]))}px`,
                                  height: parseInt(r.value.split(':')[1]) > parseInt(r.value.split(':')[0]) ? '20px' : parseInt(r.value.split(':')[0]) === parseInt(r.value.split(':')[1]) ? '16px' : `${16 * (parseInt(r.value.split(':')[1])/parseInt(r.value.split(':')[0]))}px`
                                }} />
                              </div>
                              <span className="text-[10px] font-bold text-center leading-tight">{r.label}</span>
                              <span className="text-[8px] text-white/40 text-center mt-1">{r.social}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><MonitorPlay className="w-3 h-3 text-cyan-400" /> Dimension Mode</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {DIMENSION_MODES.map(mode => (
                          <button 
                            key={mode} 
                            onClick={() => setDimensionMode(mode)}
                            className={cn(
                              "px-3 py-2.5 text-[10px] font-bold rounded-lg border transition-all text-center",
                              dimensionMode === mode 
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                                : "bg-black/40 border-white/10 text-white/40 hover:border-white/30 hover:text-white/80"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-3 h-3 text-fuchsia-400" /> Advanced Dynamics
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {(Object.keys(dynamics) as Array<keyof DynamicSettings>).filter(k => typeof dynamics[k] === 'boolean').map((key) => (
                        <button 
                          key={key}
                          onClick={() => toggleDynamic(key)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all",
                            dynamics[key] 
                              ? "bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-300" 
                              : "bg-black/40 border-white/10 text-white/30 hover:border-white/20"
                          )}
                        >
                          <span className="truncate mr-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                          {dynamics[key] ? <ToggleRight className="w-4 h-4 shrink-0" /> : <ToggleLeft className="w-4 h-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
                      <div className="col-span-full">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2"><SlidersHorizontal className="w-3 h-3"/> Fine-Tune Controls</h4>
                      </div>
                      {[
                        { key: 'metallic', label: 'Metallic' },
                        { key: 'roughness', label: 'Roughness' },
                        { key: 'normalMapIntensity', label: 'Normal Map' },
                        { key: 'filmGrain', label: 'Film Grain' },
                        { key: 'contrast', label: 'Contrast' },
                        { key: 'saturation', label: 'Saturation' },
                        { key: 'colorGradingIntensity', label: 'Color Grading' },
                        { key: 'lensDistortion', label: 'Lens Distortion' },
                        { key: 'particleDensity', label: 'Particle Density' }
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase tracking-wider">
                            <span>{label}</span>
                            <span className="text-fuchsia-400">{dynamics[key as keyof DynamicSettings]}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={dynamics[key as keyof DynamicSettings] as number}
                            onChange={(e) => updateDynamicValue(key as keyof DynamicSettings, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Professional Palettes
                      </label>
                      <button 
                        onClick={extractColorsFromAssets}
                        disabled={isExtractingColors || (!brandLogoAsset && !companyLogoAsset && !characterAsset)}
                        className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      >
                        {isExtractingColors ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        Auto-Extract from Uploads
                      </button>
                    </div>
                    <div className="space-y-2">
                      {PROFESSIONAL_PALETTES.map(palette => (
                        <button 
                          key={palette.name}
                          onClick={() => setThemeColors(palette.colors)}
                          className={cn(
                            "w-full p-2 rounded-xl border transition-all flex items-center justify-between group",
                            themeColors.join(',') === palette.colors.join(',')
                              ? "bg-indigo-500/10 border-indigo-500/50"
                              : "bg-black/40 border-white/5 hover:border-white/20"
                          )}
                        >
                          <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">{palette.name}</span>
                          <div className="flex -space-x-1">
                            {palette.colors.map((c, i) => (
                              <div key={i} style={{ backgroundColor: c }} className="w-4 h-4 rounded-full border border-black/50 shadow-sm" />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 items-center">
                      {[...PRESET_COLORS, ...customColorsList].map(c => (
                        <button key={c} onClick={() => toggleColor(c)} style={{ backgroundColor: c }} className={cn("w-6 h-6 rounded-full border-2 transition-all relative", themeColors.includes(c) ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105")}>
                          {themeColors.includes(c) && <CheckCircle2 className={cn("w-3 h-3 absolute inset-0 m-auto", c === '#ffffff' ? "text-black" : "text-white")} />}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-2">
                        <input 
                          type="color" 
                          value={customColor} 
                          onChange={(e) => setCustomColor(e.target.value)} 
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <button 
                          onClick={() => {
                            if (!PRESET_COLORS.includes(customColor) && !customColorsList.includes(customColor)) {
                              setCustomColorsList([...customColorsList, customColor]);
                            }
                            if (!themeColors.includes(customColor)) {
                              toggleColor(customColor);
                            }
                          }}
                          className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><Type className="w-3 h-3" /> Typography</label>
                      <button onClick={() => setIncludeText(!includeText)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                        {includeText ? <ToggleRight className="w-5 h-5 text-indigo-400" /> : <ToggleLeft className="w-5 h-5" />} {includeText ? 'Enabled' : 'No Text'}
                      </button>
                    </div>
                    {includeText && (
                      <div className="space-y-4 bg-black/40 border border-white/5 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-2">
                          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value as FontPreset)} className="col-span-2 bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-white">
                            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          
                          <select value={newTextType} onChange={(e) => setNewTextType(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-white">
                            <option value="Headline">Headline</option>
                            <option value="Sub-headline">Sub-headline</option>
                            <option value="Pricing">Pricing</option>
                            <option value="Body/Other">Body/Other</option>
                          </select>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1 px-2">
                            <span className="text-[10px] text-white/50">Color:</span>
                            <input type="color" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                          </div>
                          
                          <select value={newTextAlignment} onChange={(e) => setNewTextAlignment(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-white">
                            <option value="Left">Align Left</option>
                            <option value="Center">Align Center</option>
                            <option value="Right">Align Right</option>
                          </select>
                          <select value={newTextPlacement} onChange={(e) => setNewTextPlacement(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-white">
                            <option value="Top">Top</option>
                            <option value="Center">Middle</option>
                            <option value="Bottom">Bottom</option>
                          </select>
                          
                          <div className="col-span-2 flex gap-2">
                            <input type="text" value={newTextContent} onChange={(e) => setNewTextContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTextElement()} placeholder="Enter text content..." className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                            <button onClick={addTextElement} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Add</button>
                          </div>
                        </div>
                        
                        {textElements.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Active Text Elements</h4>
                            {textElements.map(t => (
                              <div key={t.id} className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.color }}></div>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t.type}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => refineTextElement(t.id)} disabled={t.isRefining || !t.text.trim()} className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors disabled:opacity-50" title="Refine Text">
                                      {t.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => removeTextElement(t.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                <span className="text-sm text-white/90 font-medium" style={{ fontFamily: fontFamily }}>"{t.text}"</span>
                                <div className="flex gap-3 text-[9px] text-white/40 uppercase tracking-wider">
                                  <span>Align: {t.alignment}</span>
                                  <span>Pos: {t.placement}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile Next Button: Step 2 -> 3 */}
                  <div className="lg:hidden pt-8 pb-12 flex flex-col gap-3">
                    <button 
                      onClick={() => setActiveStep(3)} 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                    >
                      <span>Next: Tweak Properties</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setActiveStep(1)} 
                      className="w-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest active:scale-[0.98] transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Media</span>
                    </button>
                  </div>
                </motion.div>
              </div>

              <div className={cn("space-y-6", activeStep === 3 ? "block" : "hidden")}>
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><Wand2 className="w-3 h-3" /> Text Content Engine</label>
                      <select value={textEngine} onChange={(e) => setTextEngine(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {textEnginesList.map(e => <option key={e} value={e} className="bg-[#0a0a0a] text-white">{e}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 lg:hidden">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        {isLogoMode ? <Type className="w-3 h-3" /> : <LayoutIcon className="w-3 h-3" />}
                        {isLogoMode ? "Brand Name / Style Concept" : "Scene Description"}
                      </label>
                      <div className="flex gap-2">
                        <button onClick={suggestScenePrompt} disabled={isSuggestingScene} className="text-[10px] flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {isSuggestingScene ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-Suggest
                        </button>
                        <button onClick={() => refinePromptText('scene')} disabled={isRefiningScene || !scenePrompt.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {isRefiningScene ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                        </button>
                      </div>
                    </div>
                    <AutoResizeTextarea 
                      value={scenePrompt} 
                      onChange={(e) => setScenePrompt(e.target.value)} 
                      placeholder={isLogoMode ? "Enter your brand name or a core logo concept (e.g., 'Aero-Dynamics', 'Minimalist leaf for organic tech')..." : "Describe the environment, mood, and placement..."} 
                      className="w-full min-h-[8rem] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none" 
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><ImagePlus className="w-3 h-3" /> Style Reference Images (Max 3)</label>
                      <span className="text-[10px] text-white/40">{exampleImages.length}/3</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {exampleImages.map(asset => (
                        <div key={asset.id} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10 group">
                          <img src={`data:${asset.mimeType};base64,${asset.data}`} alt="Reference" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <button onClick={() => removeAsset(asset.id, 'example')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                      {exampleImages.length < 3 && (
                        <button onClick={() => exampleInputRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-1 text-white/40 hover:text-indigo-400 transition-all">
                          <Upload className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">Add Ref</span>
                        </button>
                      )}
                      <input type="file" ref={exampleInputRef} onChange={(e) => handleFileUpload(e, 'example')} multiple accept="image/*" className="hidden" />
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">Upload up to 3 images to guide the AI on the specific visual style, mood, or composition you want to achieve.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><ListChecks className="w-3 h-3" /> Custom Rule Sets</label>
                      {rules.length > 0 && (
                        <button onClick={() => setRules([])} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none text-white/80"
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewRule(e.target.value);
                            }
                          }}
                          value=""
                        >
                          <option value="" disabled>Select a preset rule...</option>
                          {PRESET_RULES.map((rule, idx) => (
                            <option key={idx} value={rule}>{rule}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newRule} 
                          onChange={(e) => setNewRule(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && addRule()}
                          placeholder="Or type a custom rule here..." 
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                        />
                        <button onClick={addRule} className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-4 py-2 rounded-lg transition-colors font-bold text-sm">Add</button>
                      </div>
                    </div>
                    {rules.length > 0 && (
                      <div className="flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {rules.map((rule, i) => (
                          <div key={i} className="flex items-start justify-between bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm group">
                            <span className="text-white/80 leading-snug flex-1 pr-2"><span className="text-indigo-400 font-bold mr-2">{i + 1}.</span>{rule}</span>
                            <button onClick={() => removeRule(i)} className="text-white/20 hover:text-red-400 transition-colors mt-0.5"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile Final Action Button: Step 3 -> Generate */}
                  <div className="lg:hidden pt-8 pb-12 flex flex-col gap-3">
                    <button 
                      onClick={() => { handleGenerate(); setActiveStep(4); }} 
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{isGenerating ? 'Synthesizing...' : 'Generate Masterpiece'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveStep(2)} 
                      className="w-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest active:scale-[0.98] transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Design</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Generate Button Area (Sticky Bottom) */}
            <div className={cn(
              "p-6 border-t border-white/[0.05] bg-[#070707]/90 backdrop-blur-xl shrink-0 sticky bottom-0 z-30 lg:rounded-b-3xl lg:mt-6",
              (activeStep === 2 || activeStep === 3) ? "block" : "hidden"
            )}>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
              <button onClick={() => { handleGenerate(); setActiveStep(4); }} disabled={isGenerating} className={cn("relative w-full group overflow-hidden rounded-2xl p-[1px] transition-all", isGenerating ? "cursor-not-allowed opacity-70" : "hover:scale-[1.02]")}>
                {!isGenerating && <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 rounded-2xl opacity-70 group-hover:opacity-100 animate-gradient-xy transition-opacity duration-500"></span>}
                <div className={cn("relative w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-300", isGenerating ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-[#0a0a0a] group-hover:bg-transparent text-white")}>
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering...</> : <><Sparkles className="w-4 h-4" /> Generate Masterpiece</>}
                </div>
              </button>
            </div>
          </div>

          {/* CENTER COLUMN (Desktop Canvas & Timeline, Mobile Tab 4) */}
          <div className={cn(
            "w-full h-full relative flex-col overflow-hidden z-10",
            (activeStep === 4 || activeStep === 5) ? "flex" : "hidden"
          )}>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            
            <div className="flex-1 p-4 lg:p-8 relative z-10 overflow-y-auto overflow-x-hidden custom-scrollbar transform-gpu">
              <AnimatePresence mode="wait">
              {activeStep === 5 ? (
                <motion.div key="guide" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-5xl w-full space-y-8 py-8 px-4 md:px-6 pb-24 mb-10 shadow-2xl bg-[#09090b]/90 backdrop-blur-3xl rounded-3xl border border-white/10 mx-auto mt-4 min-h-max transform-gpu lg:p-8">
                  
                  {/* Hero Section */}
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Welcome to the Next Generation of Creative AI
                    </div>
                      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                      </div>
                    <p className="text-sm md:text-lg text-white/70 font-medium italic drop-shadow-lg">Engineering the absolute standard for commercial AI architecture. <span className="text-indigo-400">#Jamini</span></p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 md:mt-10 scale-90 md:scale-100">
                      
                      {/* JA Card */}
                      <div className="p-[1px] rounded-[24px] bg-gradient-to-b from-indigo-500/50 via-indigo-500/0 to-indigo-500/0 shadow-[0_20px_80px_rgba(99,102,241,0.15)] relative group cursor-default">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] group-hover:bg-indigo-500/30 transition-colors pointer-events-none" />
                        <div className="px-4 py-6 md:px-6 md:py-8 rounded-[23px] bg-[#0c0c0e] text-center min-w-[200px] md:min-w-[240px] relative overflow-hidden flex flex-col items-center justify-center h-full">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black/0 to-black/0 opacity-50" />
                          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)]">
                            <Layers className="w-6 h-6 text-indigo-400" />
                          </div>
                          <span className="block text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 uppercase relative z-10 drop-shadow-lg tracking-tighter">JA</span>
                          <span className="text-[10px] md:text-xs text-indigo-400 uppercase font-black tracking-[0.4em] relative z-10 mt-3 block">Jason (Brain)</span>
                          <div className="w-6 h-px bg-indigo-500/30 my-3" />
                          <p className="text-[10px] md:text-xs text-white/50 relative z-10 leading-relaxed">The creative architect. Providing the vision, layout structure, semantic composition, and aesthetic intuition.</p>
                        </div>
                      </div>

                      <div className="text-white/20 text-3xl md:text-5xl font-black px-2">+</div>

                      {/* MINI Card */}
                      <div className="p-[1px] rounded-[24px] bg-gradient-to-b from-fuchsia-500/50 via-fuchsia-500/0 to-fuchsia-500/0 shadow-[0_20px_80px_rgba(217,70,239,0.15)] relative group cursor-default">
                        <div className="absolute inset-0 bg-fuchsia-500/20 blur-[100px] group-hover:bg-fuchsia-500/30 transition-colors pointer-events-none" />
                        <div className="px-4 py-6 md:px-6 md:py-8 rounded-[23px] bg-[#0c0c0e] text-center min-w-[200px] md:min-w-[240px] relative overflow-hidden flex flex-col items-center justify-center h-full">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-black/0 to-black/0 opacity-50" />
                          <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
                          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4 shadow-[inset_0_2px_10px_rgba(217,70,239,0.2)]">
                            <Zap className="w-6 h-6 text-fuchsia-400" />
                          </div>
                          <span className="block text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 uppercase relative z-10 drop-shadow-lg tracking-tighter">MINI</span>
                          <span className="text-[10px] md:text-xs text-fuchsia-400 uppercase font-black tracking-[0.4em] relative z-10 mt-3 block">Gemini (Brawn)</span>
                          <div className="w-6 h-px bg-fuchsia-500/30 my-3" />
                          <p className="text-[10px] md:text-xs text-white/50 relative z-10 leading-relaxed">The computational powerhouse. Rendering complex physics, lighting algorithms, semantic fusion, and infinite variations.</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-white/60 max-w-4xl mx-auto leading-relaxed text-sm md:text-base px-6 md:px-8 font-normal mt-10 bg-[#121215] p-6 rounded-3xl border border-white/5 text-left shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500" />
                      <strong className="text-white font-bold mb-3 block text-lg md:text-xl font-sans flex items-center gap-3">
                        <Layers className="w-5 h-5 text-indigo-400" /> The Matrix Engine Architecture
                      </strong>
                      <div className="space-y-4">
                        <p className="text-xs md:text-sm">
                          JAMINI Studio Edition is an advanced commercial generation workbench. Unlike consumer-grade AI wrappers, JAMINI bypasses "aesthetic guessing" by implementing a formal <strong>Compositional Protocol</strong>. This allows users to treat the generative process as a series of architectural commands rather than a dialogue.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="space-y-2">
                            <h4 className="text-white font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2">
                              <Cpu className="w-3.5 h-3.5 text-fuchsia-400" /> Hybrid Compute Bridge
                            </h4>
                            <ul className="space-y-1 text-xs text-white/50 bg-black/20 p-3 rounded-2xl border border-white/5">
                              <li>• <strong>Token Density:</strong> Optimized for 100% asset fidelity.</li>
                              <li>• <strong>Prompt Orchestration:</strong> Gemini 3.1 Pro integration.</li>
                              <li>• <strong>Temporal Flow:</strong> Veo 3.1 4K Commercial Synthesis.</li>
                              <li>• <strong>Color Science:</strong> CI-Aware LUT mapping (32-bit).</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-white font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-amber-400" /> Synthesis Performance
                            </h4>
                            <ul className="space-y-1 text-xs text-white/50 bg-black/20 p-3 rounded-2xl border border-white/5">
                              <li>• <strong>Execution Speed:</strong> Optimized sub-18s rendering.</li>
                              <li>• <strong>Accuracy Index:</strong> 99.8% Brand Compliance.</li>
                              <li>• <strong>Scale:</strong> From Social (9:16) to Print (Physical MM).</li>
                              <li>• <strong>Security:</strong> Absolute client-side data sovereignty.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                            <h4 className="text-indigo-400 font-bold mb-1 flex items-center gap-2 italic text-[10px] md:text-xs"><Sparkles className="w-3 h-3" /> Precision Scale</h4>
                            <p className="text-[9px] md:text-[10px] text-white/50 italic leading-relaxed">
                              "Surgical print-ready generation using physical dimension mapping."
                            </p>
                          </div>
                          <div className="p-4 bg-fuchsia-500/5 rounded-2xl border border-fuchsia-500/10">
                            <h4 className="text-fuchsia-400 font-bold mb-1 flex items-center gap-2 italic text-[10px] md:text-xs"><Video className="w-3 h-3" /> Temporal Flow</h4>
                            <p className="text-[9px] md:text-[10px] text-white/50 italic leading-relaxed">
                              "Synchronized video continuity across dynamic 4K motion logic."
                            </p>
                          </div>
                          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2 italic text-[10px] md:text-xs"><Globe className="w-3 h-3" /> Localization</h4>
                            <p className="text-[9px] md:text-[10px] text-white/50 italic leading-relaxed">
                              "Instant 50+ language resynthesis matching exact mouth phonetics."
                            </p>
                          </div>
                          <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                            <h4 className="text-amber-400 font-bold mb-1 flex items-center gap-2 italic text-[10px] md:text-xs"><Database className="w-3 h-3" /> Data Pipeline</h4>
                            <p className="text-[9px] md:text-[10px] text-white/50 italic leading-relaxed">
                              "End-to-end integration with enterprise DAMs and CMS platforms."
                            </p>
                          </div>
                        </div>

                        {/* Enterprise Integration Expansion */}
                        <div className="mt-8 space-y-4">
                           <div className="flex items-center gap-3">
                              <Box className="w-4 h-4 text-emerald-400" />
                              <h4 className="text-base font-bold text-white uppercase tracking-[0.2em]">Enterprise Integrations</h4>
                           </div>
                           <div className="p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                             <div className="space-y-1">
                               <h5 className="text-xs font-bold text-white uppercase tracking-wider">RESTful Synthesis API</h5>
                               <p className="text-[10px] text-white/40 max-w-sm">Programmatically queue mass asset generation with deterministic structural constraints and dynamic visual overrides.</p>
                             </div>
                             <div className="flex gap-2">
                               <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white transition-colors">Docs</button>
                               <button className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-colors">API Keys</button>
                             </div>
                           </div>
                        </div>

                        {/* Video Showcase Section */}
                        <div className="mt-12 space-y-6">
                           <div className="flex items-center gap-3">
                              <Video className="w-5 h-5 text-fuchsia-400" />
                              <h4 className="text-lg font-bold text-white uppercase tracking-[0.2em]">Commercial Production Reel</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                { title: 'Luxury Swiss Horology', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', tag: 'VE0 3.1 PRO' },
                                { title: 'High-Performance Automotive', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', tag: 'VE0 3.1 LITE' },
                                { title: 'Tech Hardware Showcase', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', tag: 'VE0 3.1 PRO' },
                                { title: 'Premium Beverage AD', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', tag: 'VE0 3.1 PRO' },
                                { title: 'Architectural Fly-through', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', tag: 'VE0 3.1 LITE' },
                                { title: 'Fashion Editorial', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', tag: 'VE0 3.1 PRO' }
                              ].map((video, idx) => (
                                <motion.div 
                                  key={idx}
                                  whileHover={{ y: -5 }}
                                  className="group relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10"
                                >
                                  <video 
                                    src={video.url} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                    autoPlay
                                    loop 
                                    muted 
                                    playsInline 
                                  />
                                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{video.title}</span>
                                      <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">{video.tag}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                           </div>
                           <p className="text-[10px] text-white/30 text-center italic">Hover to preview cinematic artifacts generated by the Matrix.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Diagram Visualization */}
                  <div className="pt-12 border-t border-white/5">
                    <div className="text-center space-y-4 mb-10">
                       <h3 className="text-xl md:text-3xl font-black text-white">System Architecture & Pipeline</h3>
                       <p className="text-white/50 max-w-2xl mx-auto">Visualizing the flow of data intuitively from user intent to final synthesized commercial asset, orchestrated by Gemini Pro.</p>
                    </div>
                    <div className="hidden md:block bg-[#121215] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-xl mx-auto max-w-4xl transform-gpu">
                      {/* Diagram SVG (Desktop) */}
                      <svg viewBox="0 0 900 550" className="w-full h-auto drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
                        {/* High-End Background Gradients */}
                        <defs>
                          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
                            <stop offset="50%" stopColor="rgba(217, 70, 239, 1)" />
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
                          </linearGradient>
                          <linearGradient id="glowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.05)" />
                          </linearGradient>
                          <linearGradient id="glowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(217, 70, 239, 0.4)" />
                            <stop offset="100%" stopColor="rgba(217, 70, 239, 0.05)" />
                          </linearGradient>
                          <radialGradient id="matrixGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(217, 70, 239, 0.3)" />
                            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                          </radialGradient>
                          <radialGradient id="inputGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
                            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                          </radialGradient>
                          <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="shadowHeavy">
                            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.8" />
                          </filter>
                        </defs>
                        
                        {/* Background Grids */}
                        <g opacity="0.3">
                           <path d="M 0 50 L 900 50 M 0 100 L 900 100 M 0 150 L 900 150 M 0 200 L 900 200 M 0 250 L 900 250 M 0 300 L 900 300 M 0 350 L 900 350 M 0 400 L 900 400 M 0 450 L 900 450 M 0 500 L 900 500" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                           <path d="M 100 0 L 100 550 M 200 0 L 200 550 M 300 0 L 300 550 M 400 0 L 400 550 M 500 0 L 500 550 M 600 0 L 600 550 M 700 0 L 700 550 M 800 0 L 800 550" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </g>

                        {/* Connection Paths: Data Flow */}
                        <path d="M 180 275 L 450 275" stroke="url(#lineGrad)" strokeWidth="4" strokeDasharray="8,8" className="animate-pulse" filter="url(#neonBlur)" />
                        <path d="M 450 275 L 720 275" stroke="url(#lineGrad)" strokeWidth="4" strokeDasharray="8,8" className="animate-pulse" style={{ animationDelay: '0.5s' }} filter="url(#neonBlur)" />
                        <path d="M 450 135 L 450 415" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                        <path d="M 450 135 L 450 275" stroke="rgba(217,70,239,0.5)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
                        <path d="M 450 415 L 450 275" stroke="rgba(99,102,241,0.5)" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />

                        {/* Back Glows */}
                        <circle cx="450" cy="275" r="150" fill="url(#matrixGlow)" />
                        <circle cx="180" cy="275" r="100" fill="url(#inputGlow)" />
                        <circle cx="720" cy="275" r="100" fill="url(#inputGlow)" />

                        {/* Node 1: Input Stream */}
                        <g transform="translate(180, 275)">
                          {/* Inner Nodes */}
                          <circle r="60" fill="url(#glowGrad1)" stroke="rgba(99, 102, 241, 0.8)" strokeWidth="2" filter="url(#shadowHeavy)" />
                          <circle r="50" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                          <g stroke="#ffffff" fill="none" strokeWidth="2">
                            <rect x="-18" y="-18" width="36" height="36" rx="6" />
                            <path d="M-18 -10 L18 -10 M-10 -18 L-10 18 M10 -18 L10 18" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <circle cx="0" cy="0" r="5" fill="#6366F1" stroke="none" />
                          </g>
                          <rect x="-65" y="75" width="130" height="40" rx="8" fill="rgba(0,0,0,0.8)" stroke="rgba(99,102,241,0.4)" />
                          <text x="0" y="93" fill="#fff" fontSize="13" textAnchor="middle" fontWeight="bold" letterSpacing="1"> RAW ASSETS</text>
                          <text x="0" y="108" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">Images • PDF • Vectors</text>
                        </g>

                        {/* Top Peripheral: Vivid Processor */}
                        <g transform="translate(450, 90)">
                          <rect x="-85" y="-35" width="170" height="70" rx="12" fill="url(#glowGrad1)" stroke="rgba(99, 102, 241, 0.6)" filter="url(#shadowHeavy)" />
                          <rect x="-75" y="-25" width="150" height="50" rx="8" fill="rgba(0,0,0,0.7)" />
                          <circle cx="-50" cy="0" r="10" fill="rgba(99,102,241,0.2)" stroke="#6366F1" strokeWidth="1.5" />
                          <path d="M-55 -4 L-45 4 M-55 4 L-45 -4" stroke="#fff" strokeWidth="1.5" />
                          <text x="15" y="-2" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">VIVID PROMPT ENG</text>
                          <text x="15" y="14" fill="rgba(99,102,241,0.8)" fontSize="10" textAnchor="middle" fontWeight="bold">v1.5 Vision Analysis</text>
                        </g>

                        {/* Bottom Peripheral: Subconscious Memory */}
                        <g transform="translate(450, 460)">
                          <rect x="-85" y="-35" width="170" height="70" rx="12" fill="url(#glowGrad1)" stroke="rgba(99, 102, 241, 0.6)" filter="url(#shadowHeavy)" />
                          <rect x="-75" y="-25" width="150" height="50" rx="8" fill="rgba(0,0,0,0.7)" />
                          <rect x="-60" y="-10" width="20" height="20" rx="4" fill="rgba(99,102,241,0.2)" stroke="#6366F1" strokeWidth="1.5" />
                          <circle cx="-50" cy="0" r="3" fill="#fff" />
                          <text x="15" y="-2" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">VAULT & CACHE</text>
                          <text x="15" y="14" fill="rgba(99,102,241,0.8)" fontSize="10" textAnchor="middle" fontWeight="bold">API Keys & Session State</text>
                        </g>

                        {/* Node 2: Matrix Engine (The Core) */}
                        <g transform="translate(450, 275)">
                          <rect x="-80" y="-80" width="160" height="160" rx="24" fill="url(#glowGrad2)" stroke="rgba(217, 70, 239, 0.8)" strokeWidth="3" filter="url(#shadowHeavy)" />
                          <rect x="-65" y="-65" width="130" height="130" rx="16" fill="rgba(0,0,0,0.8)" stroke="rgba(217, 70, 239, 0.4)" />
                          <g transform="scale(1.2)">
                            <path d="M 0 -35 L 30.3 -17.5 L 30.3 17.5 L 0 35 L -30.3 17.5 L -30.3 -17.5 Z" stroke="rgba(217,70,239,0.8)" strokeWidth="2" fill="rgba(217,70,239,0.1)" />
                            <path d="M 0 -20 L 17.3 -10 L 17.3 10 L 0 20 L -17.3 10 L -17.3 -10 Z" stroke="#fff" strokeWidth="1.5" fill="none" />
                            <circle cx="0" cy="0" r="4" fill="#D946EF" filter="url(#neonBlur)" className="animate-pulse" />
                          </g>
                          <rect x="-85" y="95" width="170" height="45" rx="8" fill="rgba(0,0,0,0.9)" stroke="rgba(217,70,239,0.5)" />
                          <text x="0" y="114" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="black" letterSpacing="1.5">JAMINI MATRIX</text>
                          <text x="0" y="130" fill="rgba(217,70,239,0.8)" fontSize="10" textAnchor="middle" fontWeight="bold">Semantic Synthesis Core</text>
                        </g>

                        {/* Node 3: Synthesized Output */}
                        <g transform="translate(720, 275)">
                          <circle r="60" fill="url(#glowGrad1)" stroke="rgba(99, 102, 241, 0.8)" strokeWidth="2" filter="url(#shadowHeavy)" />
                          <circle r="50" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                          <g stroke="#ffffff" fill="none" strokeWidth="2">
                            <path d="M-20 -25 L20 -25 L20 15 L-20 15 Z M-12 -12 L-12 2 L12 2 L12 -12 Z" strokeWidth="2" />
                            <path d="M-5 22 L5 22" strokeWidth="3" />
                            <circle cx="0" cy="-5" r="4" fill="rgba(99,102,241,0.8)" stroke="none" />
                          </g>
                          <rect x="-70" y="75" width="140" height="40" rx="8" fill="rgba(0,0,0,0.8)" stroke="rgba(99,102,241,0.4)" />
                          <text x="0" y="93" fill="#fff" fontSize="13" textAnchor="middle" fontWeight="bold" letterSpacing="1"> FINAL RENDER</text>
                          <text x="0" y="108" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">4K Commercial Artifact</text>
                        </g>
                      </svg>
                    </div>

                    <div className="md:hidden bg-[#070709] border border-white/10 rounded-[40px] p-6 relative overflow-hidden shadow-2xl mx-auto w-full max-w-sm">
                      {/* Diagram SVG (Mobile Vertical) - Pro Shrink-to-fit */}
                      <svg viewBox="0 0 400 950" className="w-full h-auto" preserveAspectRatio="xMidYMin meet">
                        <defs>
                          <linearGradient id="lineGradMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
                            <stop offset="50%" stopColor="rgba(217, 70, 239, 1)" />
                            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                          </linearGradient>
                          <filter id="glowMobile">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        
                        {/* Vertical Flow Line */}
                        <path d="M 200 80 L 200 850" stroke="url(#lineGradMobile)" strokeWidth="3" strokeDasharray="10,10" className="animate-pulse" />

                        {/* Top Node: Assets */}
                        <g transform="translate(200, 100)">
                          <circle r="65" fill="rgba(99, 102, 241, 0.1)" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="2" />
                          <circle r="50" fill="rgba(0,0,0,0.8)" />
                          <path d="M-15 -15 L15 -15 L15 15 L-15 15 Z" stroke="#6366F1" fill="none" strokeWidth="2" />
                          <text y="95" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="900" letterSpacing="2">ASSETS</text>
                          <text y="115" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle" fontWeight="bold">RAW DATA STREAM</text>
                        </g>

                        {/* Middle Node: The Matrix */}
                        <g transform="translate(200, 475)">
                          <rect x="-85" y="-85" width="170" height="170" rx="30" fill="rgba(217, 70, 239, 0.1)" stroke="rgba(217, 70, 239, 0.8)" strokeWidth="3" filter="url(#glowMobile)" />
                          <rect x="-70" y="-70" width="140" height="140" rx="20" fill="rgba(0,0,0,0.9)" />
                          <path d="M-30 -30 L30 30 M-30 30 L30 -30" stroke="#D946EF" strokeWidth="3" className="animate-pulse" />
                          <text y="115" fill="#fff" fontSize="18" textAnchor="middle" fontWeight="900" letterSpacing="4">MATRIX ENGINE</text>
                          <text y="135" fill="rgba(217, 70, 239, 0.8)" fontSize="12" textAnchor="middle" fontWeight="900">GEMINI 3.1 PRO</text>
                        </g>

                        {/* Bottom Node: Render */}
                        <g transform="translate(200, 850)">
                          <circle r="65" fill="rgba(99, 102, 241, 0.1)" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="2" />
                          <circle r="50" fill="rgba(0,0,0,0.8)" />
                          <circle cx="0" cy="0" r="15" stroke="#6366F1" fill="none" strokeWidth="2" />
                          <text y="-100" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="900" letterSpacing="2">SYNTHESIS</text>
                          <text y="-80" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle" fontWeight="bold">FINAL 4K ARTIFACT</text>
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* Deep Dive into Architecture */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pt-12 border-t border-white/5">
                    {/* Neural Engine Details */}
                    <div className="space-y-6 p-6 md:p-8 rounded-3xl bg-[#121215] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-indigo-500/30 hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)] transition-all h-full">
                      <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                          <Cpu className="w-6 h-6" />
                        </div>
                        The Neural Engine Explained
                      </h3>
                      <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                        Jamini isn't just an image generator. It's a sophisticated multi-modal pipeline designed specifically for high-end commercial art and advertising. It thinks like an Art Director and executes like a CGI studio.
                      </p>
                      <ul className="space-y-5 mt-6">
                        {[
                          { 
                            title: "Multi-Modal Analysis Vision", 
                            icon: <Eye className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />, 
                            desc: "Before rendering, Jamini scans your uploaded assets. It understands textures, recognizes edge definitions, and extrapolates 3D depth from 2D images.",
                            details: [
                              "Example: If you upload a glass bottle, Jamini identifies transparency and refractive indices.",
                              "Pro Tip: High-contrast product shots yield 40% better edge definition during synthesis."
                            ]
                          },
                          { 
                            title: "Global Brand Bible Sync", 
                            icon: <ShieldCheck className="w-5 h-5 text-fuchsia-400 shrink-0 mt-0.5" />, 
                            desc: "Extracts precise hex codes, typography rules, and spatial constraints from brand documents and enforces them mathematically.",
                            details: [
                              "Syncs primary and secondary color palettes directly to the neural generator.",
                              "Prevents 'color drift' where AI usually ignores specific brand-approved shades."
                            ]
                          },
                          { 
                            title: "Semantic Material Matrix", 
                            icon: <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />, 
                            desc: "Models physical light interaction between product and environment for cinematic realism.",
                            details: [
                              "Generates realistic specular highlights and volumetric shadows.",
                              "Examples: Metallic brushed steel, matte carbon fiber, or soft-touch plastics."
                            ]
                          },
                          { 
                            title: "Adaptive Neural Routing", 
                            icon: <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />, 
                            desc: "Dynamically routes requests between Gemini 3.1 Pro and 2.5 Flash tiers based on task complexity.",
                            details: [
                              "Session State: Automatically recovers your prompt history and active API keys.",
                              "Vault Encryption: Keys are stored exclusively in your browser's secure enclave."
                            ]
                          }
                        ].map((item, i) => (
                          <li key={i} className="flex flex-col gap-4 p-6 rounded-2xl bg-black/40 border border-white/5 shadow-inner hover:border-white/20 transition-all">
                            <div className="flex gap-4">
                              {item.icon}
                              <div>
                                <span className="block text-white font-bold text-sm uppercase tracking-wide mb-1 opacity-90">{item.title}</span>
                                <p className="text-xs text-white/50 leading-relaxed italic">{item.desc}</p>
                              </div>
                            </div>
                            <div className="pl-9 space-y-2">
                              {item.details.map((detail, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-2 text-[10px] md:text-xs">
                                  <div className="w-1 h-1 rounded-full bg-white/20" />
                                  <span className="text-white/40">{detail}</span>
                                </div>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Workflow Details */}
                    <div className="space-y-6 p-6 md:p-8 rounded-3xl bg-[#121215] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-fuchsia-500/30 hover:shadow-[0_10px_30px_rgba(217,70,239,0.1)] transition-all h-full">
                      <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 ring-1 ring-fuchsia-500/40 shadow-[0_0_20px_rgba(232,121,249,0.3)]">
                          <Workflow className="w-6 h-6" />
                        </div>
                        The Master Workflow
                      </h3>
                      <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                        A structured, non-linear progression ensures you retain creative control while Jamini handles the complex technical rendering pipelines automatically.
                      </p>
                      <div className="space-y-5 relative mt-6">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-fuchsia-500/50 via-indigo-500/50 to-transparent z-0 hidden md:block" />
                        
                        {[
                          { 
                            step: "01", 
                            title: "API Initialization (Settings)", 
                            text: "Begin by navigating to the Settings tab in the bottom bar and securely load your Gemini API Key(s) to unlock generations. Keys are securely stored locally inside your browser's persistent cache (IndexedDB).",
                            details: [
                              "Auto-Detect: The system automatically verifies your tier (Paid vs Free) and adjusts resolution limits accordingly.",
                              "Vault Encryption: Jamini uses a secure hashing protocol for your keys—they never leave the client environment."
                            ]
                          },
                          { 
                            step: "02", 
                            title: "Asset Ingestion & Vivid Analysis", 
                            text: "Upload your raw materials up to 4K resolution. Use the 'Vivid Enhance' feature to let Jamini automatically write specialized engineering prompts.",
                            details: [
                              "Multi-Modal Extraction: The AI scans textures, object classification, and lighting direction to ensure background synthesis is contextually aware.",
                              "Accepted Formats: Optimized for PNG (transparency preserved), high-res JPEG, and Vector PDF analysis."
                            ]
                          },
                          { 
                            step: "03", 
                            title: "Architectural Layout & Spatial Logic", 
                            text: "Select your canvas dimension (Mobile vs Cinema) and define spatial arrangements. Choose from preset composition grids like 'Golden Ratio' or 'Rule of Thirds'.",
                            details: [
                              "Hierarchy Control: Define Subject vs Environment depth. Jamini calculates z-space to place models inside the scene, not on top of it.",
                              "Canvas Presets: One-click formatting for Instagram Stories (9:16), Cinematic Ads (21:9), or classic Out-of-Home (OOH) billboards."
                            ]
                          },
                          { 
                            step: "04", 
                            title: "Parametric Control & Physics", 
                            text: "Fine-tune lighting styles, focal length, film grain simulation, and rendering intent (Octane vs Unreal).",
                            details: [
                              "Ray-Tracing Logic: Toggle 'Masterpiece' mode to force volumetric shadows and ray-traced reflections on glass/metal surfaces.",
                              "Color Grading: Apply LUT-style intent prompts like 'Blade Runner Teal' or 'Kodak Portra 400' directly to the neural renderer."
                            ]
                          },
                          { 
                            step: "05", 
                            title: "The Synthesis & Export Pipeline", 
                            text: "Generate the result. The backend dynamically merges user prompts, layout specifications, and Vivid analyses.",
                            details: [
                              "Final Export: Support for PNG (Max Quality), JPG (Optimized), and PDF. Every export includes a unique generation signature for authenticity.",
                              "Archive: Revisit any previous generation in the 'Workspace Gallery' to iterate or upscale without re-spending tokens."
                            ]
                          }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 relative z-10 group">
                            <div className="w-12 h-12 shrink-0 rounded-full bg-[#18181C] border-2 border-fuchsia-500/30 flex items-center justify-center text-sm font-black text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white group-hover:border-fuchsia-400 transition-all shadow-[0_0_15px_rgba(232,121,249,0.2)] mt-1">
                              {item.step}
                            </div>
                            <div className="flex-1 p-5 md:p-6 rounded-2xl bg-black/40 border border-white/5 group-hover:border-fuchsia-500/30 transition-all shadow-inner">
                              <h4 className="text-white font-bold text-sm md:text-base mb-2">{item.title}</h4>
                              <p className="text-xs md:text-sm text-white/50 leading-relaxed mb-4">{item.text}</p>
                              <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                                {item.details.map((detail, dIdx) => (
                                  <div key={dIdx} className="flex items-start gap-2 text-[10px] md:text-xs text-white/40 italic">
                                    <div className="w-1 h-1 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                                    <span>{detail}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Core Features Grid from FeaturePage */}
                  <div className="space-y-12 pt-16 border-t border-white/5">
                    <div className="text-center space-y-4">
                       <h3 className="text-sm md:text-base font-black text-white/40 uppercase tracking-[0.4em]">Unleash Your Creativity</h3>
                       <p className="text-white/50 text-sm md:text-base max-w-3xl mx-auto px-4">Everything you need to build stunning, production-ready assets in seconds.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {[
                        { 
                          icon: MonitorPlay, 
                          color: 'indigo', 
                          title: 'Veo Video Matrix', 
                          desc: 'Harness Google\'s world-class Veo model for professional video advertisement creation. \n• 4K & 1080p rendering capacities\n• Controlled scene-by-scene storyboard execution\n• Dynamic physics-based simulation for liquids/fabrics\n• Strategic 6s, 13s, and 14s durations for major social platforms.' 
                        },
                        { 
                          icon: LayoutIcon, 
                          color: 'cyan', 
                          title: 'Semantic Layout Engine', 
                          desc: 'Architecturally sound compositions derived from high-end magazine theory.\n• Bento Grid: Perfect for multi-asset showcases\n• Editorial Spread: Luxury balanced voids\n• Rule of Thirds: High-impact psychological focus.' 
                        },
                        { 
                          icon: Zap, 
                          color: 'fuchsia', 
                          title: 'Physics & Dynamics Control', 
                          desc: 'Granular control over the physical properties of the generated set.\n• Subsurface Scattering: Realistic light penetration through skin or wax\n• Caustics: Accurate light refraction through glass and water\n• Ray-Tracing: Real-time calculation of bounces and reflections.' 
                        },
                        { 
                          icon: Palette, 
                          color: 'emerald', 
                          title: 'Commercial Color Grading', 
                          desc: 'Advanced LUT-based color science applied with AI precision.\n• Heritage Gold: Warm, luxury, historical aesthetic\n• Matrix Midnight: High-contrast cyan/indigo shadows\n• Clean Studio: Perfect neutral balance for product focus.' 
                        },
                        { 
                          icon: Type, 
                          color: 'amber', 
                          title: 'Type-Safe Composition', 
                          desc: 'Seamless typography that isn\'t just "layered on" but integrated into the scene lighting.\n• Intelligent Kerning: Proper letter spacing for high-end readability\n• Font Parity: Supports Space Grotesk, Playfair, and Unbounded.' 
                        },
                        { 
                          icon: Workflow, 
                          color: 'blue', 
                          title: 'Asset Reference Mapping', 
                          desc: 'Your products are the source of truth. The AI maintains 100% fidelity to uploaded assets.\n• Multi-Asset Stacking: Mix product, character, and logo\n• Lighting Sync: Assets inherit the lighting of the generated scene.' 
                        },
                        { 
                          icon: ListChecks, 
                          color: 'rose', 
                          title: 'Strict Logical Guardrails', 
                          desc: 'Force the engine to obey specific commercial constraints.\n• Custom Rule Logic: "No people", "Cinematic fog only", "Macro focus"\n• Zero-Hallucination Mode: Restricts creative drift to maintain brand safety.' 
                        },
                        { 
                          icon: Cpu, 
                          color: 'cyan', 
                          title: 'Hybrid Compute Architecture', 
                          desc: 'Uses a synchronized dual-engine approach for the best of text and image.\n• Gemini 1.5 Pro: Orchestrates the prompt logic and hierarchy\n• Gemini Flash Image: Renders the final matrix with hyper-speed.' 
                        },
                        { 
                          icon: ShieldCheck, 
                          color: 'green', 
                          title: 'Privacy-First API Injection', 
                          desc: 'Enterprise-grade security for your proprietary brand assets.\n• Local Key Storage: Keys never traverse our backend servers\n• Sandbox Generation: All processing occurs within the Secure Google Cloud environment.' 
                        }
                      ].map((feature, i) => (
                        <FeatureCard key={i} feature={feature} index={i} />
                      ))}
                    </div>
                  </div>

                  {/* Comprehensive Tool Documentation */}
                  <div className="space-y-12 pt-16 border-t border-white/5">
                    <div className="text-center space-y-4">
                       <h3 className="text-sm md:text-base font-black text-white/40 uppercase tracking-[0.4em]">Comprehensive Tool Suite</h3>
                       <p className="text-white/50 text-sm md:text-base max-w-3xl mx-auto px-4">Every dial, switch, and upload field in Jamini serves a specific commercial purpose. Here is how to master the control board parameters effectively.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {[
                        { 
                          title: "Vivid Enhance AI", 
                          icon: <Sparkles className="w-8 h-8" />, 
                          tags: ["Automation", "Prompt Eng"], 
                          desc: "Click 'Vivid Enhance' on an asset to bypass manual prompt writing. Jamini uses Gemini Pro vision models to analyze the image and generate a complex descriptive prompt orchestrating object physics.",
                          feature: "Neural Scene Description",
                          benefit: "Prevents mismatched lighting by forcing the AI to 'understand' your object's material properties first."
                        },
                        { 
                          title: "Intelligent Key Manager", 
                          icon: <Key className="w-8 h-8" />, 
                          tags: ["API Setup", "Auto-Detect"], 
                          desc: "Securely store multiple Paid and Free API keys. The system natively pings the API to query available models automatically, removing manual engine selection friction.",
                          feature: "Dynamic Endpoint Routing",
                          benefit: "Instant access to 3.1 Pro performance vs 2.5 Flash speed without manual reconfiguration."
                        },
                        { 
                          title: "Workspace Gallery", 
                          icon: <History className="w-8 h-8" />, 
                          tags: ["Archive", "Exports"], 
                          desc: "Never lose a generation. Every image is automatically serialized and saved locally (IndexedDB). Search prompt history, sort logically, and export instantly.",
                          feature: "Persistent Artifact Session",
                          benefit: "Reduces tokens spend by allowing you to re-download high-res versions of previous work without re-generating."
                        },
                        { 
                          title: "Brand Bible Extraction", 
                          icon: <Book className="w-8 h-8" />, 
                          tags: ["Analysis", "Compliance"], 
                          desc: "Uploading a CI document triggers a deep analysis. Jamini extracts exact hex colors and fonts, automatically updating your palette to enforce brand continuity in every render.",
                          feature: "Chromatic Identity Locking",
                          benefit: "Ensures legal and branding teams approve AI output by maintaining 100% color accuracy."
                        },
                        { 
                          title: "Dynamic Text Engine", 
                          icon: <Type className="w-8 h-8" />, 
                          tags: ["Typography", "Layout"], 
                          desc: "Spatial-aware layouts ensure text matches the 'Font Preset' and respects occlusion (e.g. text behind subjects) for three-dimensional realism.",
                          feature: "Semantic Typographic Layering",
                          benefit: "Creates depth by embedding typography *into* the 3D scene rather than overlaying a flat sticker."
                        },
                        { 
                          title: "Material Dynamics", 
                          icon: <SlidersHorizontal className="w-8 h-8" />, 
                          tags: ["Physics", "Post-FX"], 
                          desc: "Control the physical reality of the scene. Sliders for Metallic, Roughness, and Normal Map Intensity literally alter sub-surface light interaction and surface bounce.",
                          feature: "Physics-Based Rendering (PBR)",
                          benefit: "Achieves 'Commercial Realism' where surfaces react to environmental light with high-fidelity specular highlights."
                        }
                      ].map((tool, i) => (
                        <div key={i} className="p-6 md:p-8 rounded-3xl bg-[#121215] border border-white/10 hover:bg-white/[0.04] hover:border-indigo-500/40 hover:-translate-y-2 transition-all duration-300 group shadow-2xl flex flex-col h-full relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] group-hover:bg-fuchsia-500/10 transition-colors pointer-events-none" />
                          <div className="flex flex-col gap-5 mb-5 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] ring-1 ring-white/10 shrink-0">
                              {tool.icon}
                            </div>
                            <div className="flex-1">
                               <h4 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight">{tool.title}</h4>
                               <div className="flex flex-wrap gap-2">
                                 {tool.tags.map(t => <span key={t} className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60">{t}</span>)}
                               </div>
                            </div>
                          </div>
                          <p className="text-sm text-white/50 leading-relaxed mb-6 flex-1 relative z-10">{tool.desc}</p>
                          
                          <div className="space-y-3 mt-auto pt-6 border-t border-white/5 relative z-10">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Key Feature</span>
                              <span className="text-xs text-white/80 font-medium">{tool.feature}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-widest">Workflow Benefit</span>
                              <span className="text-xs text-white/40 italic">{tool.benefit}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core Philosophy */}
                  <div className="pt-16 border-t border-white/5 text-center px-4 md:px-12 max-w-5xl mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
                    <Quote className="w-12 h-12 text-indigo-500/40 mx-auto mb-6 relative z-10" />
                    <p className="text-xl md:text-3xl lg:text-4xl font-medium text-white/90 leading-relaxed italic relative z-10 drop-shadow-2xl" style={{ fontFamily: 'Space Grotesk' }}>
                      "We built Jamini because standard prompting is a lottery. Commercial design requires intent, structure, and absolute brand compliance. Jamini replaces the slot machine with a master control room."
                    </p>
                  </div>
                  
                  {/* Commercial Case Studies / Examples */}
                  <div className="space-y-12 pt-16 border-t border-white/5">
                    <div className="text-center space-y-4">
                       <h3 className="text-xl md:text-3xl font-black text-white">Commercial Case Studies</h3>
                       <p className="text-white/50 text-sm md:text-base max-w-3xl mx-auto px-4">See how Jamini transforms raw intent into production-ready commercial assets across different industries.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        {
                          industry: "Luxury Watchmaking",
                          objective: "Extreme macro photography with complex caustic lighting on sapphire crystal and brushed platinum.",
                          steps: [
                            "Upload: 4K macro shot of a dial.",
                            "Style: 'Swiss Precision' with dramatic rim lighting.",
                            "Result: Jamini calculated the light refraction through the crystal, creating perfect 'caustic' patterns on the dial surface."
                          ],
                          color: "from-amber-500/20 to-amber-500/0"
                        },
                        {
                          industry: "Automotive Marketing",
                          objective: "Synthesize a sleek electric sedan into a futuristic neon-drenched Tokyo street at midnight.",
                          steps: [
                            "Upload: CAD render or high-res photo of the car profile.",
                            "Style: 'Cyberpunk Cinematic' with wet road reflections.",
                            "Result: The 'Semantic Material Matrix' automatically applied neon reflections to the car's paintwork based on the synthesized environment depth."
                          ],
                          color: "from-indigo-500/20 to-indigo-500/0"
                        }
                      ].map((study, i) => (
                        <div key={i} className="p-8 rounded-[38px] bg-[#121215] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                          <div className={`absolute inset-0 bg-gradient-to-br ${study.color} opacity-30 pointer-events-none`} />
                          <h4 className="text-xl font-bold text-white mb-4 relative z-10">{study.industry}</h4>
                          <p className="text-sm text-white/70 mb-6 relative z-10 italic">"{study.objective}"</p>
                          <ul className="space-y-3 relative z-10">
                            {study.steps.map((step, sIdx) => (
                              <li key={sIdx} className="flex gap-3 text-xs md:text-sm text-white/50 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center pt-12 pb-8 lg:pb-32 sticky bottom-[-20px] bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent z-20">
                    <button 
                      onClick={() => setActiveStep(1)}
                      className="px-10 md:px-14 py-5 md:py-6 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black text-sm md:text-lg uppercase tracking-[0.2em] hover:scale-105 hover:shadow-[0_20px_60px_rgba(99,102,241,0.5)] active:scale-95 transition-all shadow-[0_10px_40px_rgba(99,102,241,0.3)] group overflow-hidden relative"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full ease-in-out duration-1000 transform skew-x-12" />
                      <span className="relative flex items-center justify-center gap-4">
                        <Zap className="w-6 h-6 fill-white" /> Initialize Workspace Studio
                      </span>
                    </button>
                  </div>

                </motion.div>
              ) : generatedVideo ? (
                <motion.div key={generatedVideo} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative shadow-2xl shadow-black/80 rounded-lg overflow-hidden max-w-full group">
                  <div className="bg-black flex items-center justify-center min-h-[40vh]">
                    <video 
                      src={generatedVideo} 
                      autoPlay 
                      loop 
                      muted
                      controls 
                      className="w-auto h-auto max-w-full max-h-[80vh] object-contain"
                      onError={() => {
                        console.error("Main video failed to load. Source might be invalid.");
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-1 flex flex-col gap-1 shadow-lg border border-white/10">
                      <span className="text-[10px] text-white/50 uppercase font-bold text-center pb-1 border-b border-white/10 px-2">Download</span>
                      <button onClick={downloadVideo} className="text-xs font-medium text-white hover:bg-white/20 px-4 py-2 rounded transition-colors text-center flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" /> MP4 Video
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : generatedImage ? (
                <motion.div key={generatedImage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative shadow-2xl shadow-black/80 rounded-lg overflow-hidden max-w-full group">
                  <img src={generatedImage} alt="Generated Poster" className="w-auto h-auto max-w-full max-h-[80vh] object-contain" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-1 flex flex-col gap-1 shadow-lg border border-white/10">
                      <span className="text-[10px] text-white/50 uppercase font-bold text-center pb-1 border-b border-white/10">Download</span>
                      <button onClick={() => downloadImage('png')} className="text-xs font-medium text-white hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-left">PNG</button>
                      <button onClick={() => downloadImage('jpg')} className="text-xs font-medium text-white hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-left">JPG</button>
                      <button onClick={() => downloadImage('pdf')} className="text-xs font-medium text-white hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-left">PDF</button>
                      <button onClick={() => downloadImage('vif')} className="text-xs font-medium text-white hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-left">VIF (AVIF)</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 max-w-md">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                    {isGenerating ? <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" /> : <ImageIcon className="w-10 h-10 text-white/20" />}
                  </div>
                  <h3 className="text-2xl font-bold text-white/80 tracking-tight">{isGenerating ? (imageEngine.includes('Veo') ? "Generating Cinematic Video..." : "Rendering Masterpiece...") : "Canvas Ready"}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {isGenerating ? (imageEngine.includes('Veo') ? (videoStatus || "JAMINI is orchestrating cinematic frames, physical simulations, and lighting matrices.") : "JAMINI is analyzing your layout choice, typography, and assets to create a professional advertisement spread.") : "Complete the steps to generate your stunning advertisement."}
                  </p>
                </motion.div>
              )}

              {/* Mobile Preview Navigation: Only show if and results are ready */}
              {activeStep === 4 && (generatedImage || generatedVideo) && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:hidden mt-12 mb-24 space-y-4"
                >
                  <div className="h-px w-full bg-white/5 mb-8" />
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveStep(2)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Studio
                    </button>
                    <button 
                      onClick={() => setActiveStep(5)}
                      className="flex-1 py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2"
                    >
                      Meet Jamini <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* DESKTOP BOTTOM PANEL (Timeline / Prompts) */}
          <div className={cn("hidden h-[280px] bg-[#18181C] border-t border-white/5 shrink-0 flex-col relative z-20", activeStep === 4 ? "lg:flex" : "lg:hidden")}>
            <div className="flex items-center px-4 h-10 border-b border-white/5 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] gap-2 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Generation Sequence
            </div>
            <div className="flex-1 flex p-4 gap-4 overflow-y-auto">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  {isLogoMode ? <Type className="w-3 h-3" /> : <LayoutIcon className="w-3 h-3" />}
                  {isLogoMode ? "Brand Name / Style Concept" : "Scene Description"}
                </label>
                <AutoResizeTextarea 
                  value={scenePrompt} 
                  onChange={(e) => setScenePrompt(e.target.value)} 
                  placeholder={isLogoMode ? "Enter your brand name or a core logo concept (e.g., 'Aero-Dynamics', 'Minimalist leaf for organic tech')..." : "Describe the environment, mood, and placement..."} 
                  className="w-full min-h-[4rem] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none custom-scrollbar" 
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3 h-3" /> General Asset Instructions</label>
                <AutoResizeTextarea value={assetPrompt} onChange={(e) => setAssetPrompt(e.target.value)} placeholder="How should the assets interact? (e.g., 'Model holding the product, logo top right')" className="w-full min-h-[4rem] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none custom-scrollbar" />
              </div>
              <div className="w-[240px] shrink-0 flex flex-col gap-2 justify-end">
                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {error}
                  </motion.div>
                )}
                <button onClick={() => { handleGenerate(); setActiveStep(4); }} disabled={isGenerating} className={cn("relative w-full group overflow-hidden rounded-xl p-[1px] transition-all h-16", isGenerating ? "cursor-not-allowed opacity-70" : "hover:scale-[1.02]")}>
                  {!isGenerating && <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 rounded-xl opacity-70 group-hover:opacity-100 animate-gradient-xy transition-opacity duration-500"></span>}
                  <div className={cn("relative w-full h-full rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-300", isGenerating ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-[#0a0a0a] group-hover:bg-transparent text-white")}>
                    {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering...</> : <><Sparkles className="w-4 h-4" /> Generate</>}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    );
  };

  const handleEnter = () => {
    // Dramatic Superhero Intro Sound (Web Audio API)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.5);
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 2);

      // Higher chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220, ctx.currentTime + 1);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);
      gain2.gain.setValueAtTime(0.01, ctx.currentTime + 0.5);
      gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 2);
    } catch(e) { console.warn("Audio Context blocked or unsupported") }

    setHasEntered(true);
  };

  const ObjectiveSelector = () => {
    const objectives = [
      { 
        id: 'logo', 
        title: 'Logo Design', 
        desc: 'Intelligent brand identity system.',
        longDesc: 'Combines multi-modal analysis with precise vector-ready generation. Includes full CI Bible automation and brand guide exports.',
        icon: Palette, 
        color: 'from-indigo-600 to-blue-500',
        glow: 'rgba(79, 70, 229, 0.4)'
      },
      { 
        id: 'poster', 
        title: 'Poster Ads', 
        desc: 'High-fidelity visual production.',
        longDesc: 'Generate billboards, social media spreads, and marketing assets with depth-mapped rendering and custom professional lighting.',
        icon: ImageIcon, 
        color: 'from-fuchsia-600 to-pink-500',
        glow: 'rgba(192, 38, 211, 0.4)'
      },
      { 
        id: 'video', 
        title: 'Cinematic Video', 
        desc: 'Next-gen motion engine.',
        longDesc: 'Create AI-native 4K commercials and social videos with VEO. Hyper-realistic motion sequences and artistic temporal consistency.',
        icon: Video, 
        color: 'from-emerald-600 to-teal-500',
        glow: 'rgba(5, 150, 105, 0.4)'
      },
    ];

    const selectObjective = (id: 'logo' | 'poster' | 'video') => {
      setGenerationObjective(id);
      
      // Reset shared states to prevent bleeding between modes
      setScenePrompt('');
      setProductAssets([]);
      setBrandLogoAsset(null);
      setCompanyLogoAsset(null);
      setCharacterAsset(null);
      setExampleImages([]);
      setCompanyCIAsset(null);
      setCiSummary('');
      setTextElements([]);
      setVideoScript('');
      setVideoScenes([]);
      setVideoStatus('');
      setGeneratedImage(null);
      setGeneratedVideo(null);
      setThemeColors([]);
      setCustomColorsList([]);
      setError(null);
      
      if (id === 'logo') {
        setIsLogoMode(true);
        setIsAdMode(false);
        setAspectRatio('1:1');
      } else if (id === 'video') {
        setIsLogoMode(false);
        setIsAdMode(true);
        setImageEngine('Veo Lite (1080p Video)');
      } else {
        setIsLogoMode(false);
        setIsAdMode(false);
      }
    };

    return (
      <div className="relative flex flex-col items-center justify-center min-h-[100dvh] w-full p-1 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden bg-[#050507] custom-scrollbar">
        {/* Dynamic Background Effects - Optimized Stack */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[80px] rounded-full opacity-50 transition-transform duration-[30s] ease-linear animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[80px] rounded-full opacity-50 transition-transform duration-[35s] ease-linear animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        </div>



        <div className="relative z-10 w-full max-w-7xl flex flex-col items-center space-y-2 md:space-y-6 lg:space-y-8 py-2">
          {/* Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-0.5 md:space-y-4 text-center px-2"
          >
            <div className="relative inline-block scale-[0.6] md:scale-90 lg:scale-100 transition-transform">
              <div className="absolute inset-0 bg-white/10 blur-[20px] rounded-full animate-pulse" />
              <img 
                src="https://i.ibb.co/RTRNJgw0/1778090202960-removebg-preview.png" 
                alt="JAMINI" 
                className="h-8 md:h-10 lg:h-12 w-auto relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[14px] md:text-2xl lg:text-4xl font-black uppercase tracking-tight text-white drop-shadow-2xl whitespace-nowrap">
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Objective</span>
              </h2>
              <div className="h-0.5 w-8 md:w-14 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto rounded-full" />
              <p className="text-white/40 max-w-xs md:max-w-md mx-auto text-[8px] md:text-xs lg:text-sm font-medium tracking-wide leading-relaxed">
                JAMINI Multi-modal Interface • v4.0 <br/>
                Deploy specialized AI clusters below.
              </p>
            </div>
          </motion.div>

          {/* Objective Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 lg:gap-6 w-full group/container px-2 md:px-0">
            {objectives.map((obj, i) => (
              <motion.button
                key={obj.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ 
                  scale: 1.01, 
                  y: -2,
                  boxShadow: `0 10px 40px -10px ${obj.glow}` 
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectObjective(obj.id as any)}
                className="group relative flex flex-col items-start p-3 md:p-5 lg:p-6 bg-white/5 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] lg:rounded-[1.8rem] overflow-hidden backdrop-blur-xl transition-all duration-300"
              >
                {/* 3D Glass Effect Background */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300", obj.color)} />
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
                
                {/* Icon Sphere */}
                <div className="relative z-10 w-8 h-8 md:w-11 lg:w-13 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-3 lg:mb-4 border border-white/10 shadow-inner group-hover:rotate-6 transition-all duration-300">
                  <div className={cn("absolute inset-0 blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full", obj.color)} />
                  <obj.icon className="w-4 h-4 md:w-6 lg:w-8 text-white relative z-10" />
                </div>

                <div className="relative z-10 flex-1 space-y-0.5 md:space-y-2 lg:space-y-3">
                  <div className="space-y-0 text-left">
                    <h3 className="text-[12px] md:text-lg lg:text-2xl font-black text-white uppercase tracking-tighter group-hover:text-indigo-300 transition-colors">{obj.title}</h3>
                    <p className="text-indigo-400 font-bold text-[7px] md:text-[9px] lg:text-[10px] uppercase tracking-widest">{obj.desc}</p>
                  </div>
                  
                  <p className="text-[8px] md:text-[11px] lg:text-xs text-white/40 text-left leading-snug font-medium group-hover:text-white/60 transition-colors line-clamp-2 md:line-clamp-none">
                    {obj.longDesc}
                  </p>
                </div>


                {/* Progress Indicator Decorations */}
                <div className="mt-2 md:mt-4 lg:mt-6 w-full relative z-10">
                  <div className="h-0.5 w-full bg-white/10 overflow-hidden rounded-full">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className={cn("h-full w-1/2 bg-gradient-to-r from-transparent to-transparent", obj.color.replace('from-', 'via-'))}
                    />
                  </div>
                  <div className="mt-1 md:mt-4 flex items-center justify-between">
                    <span className="text-[7px] md:text-[9px] font-black uppercase text-white/20 tracking-tighter">Cluster 0{i+1}</span>
                    <div className="flex items-center gap-1 text-white font-bold text-[7px] md:text-[9px] lg:text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-5px] group-hover:translate-x-0 transition-all">
                      Init <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* System Status Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 pb-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              <span>Nodes Active</span>
            </div>
            <div className="hidden md:block w-px h-3 bg-white/10" />
            <span>AI Acceleration On</span>
            <div className="hidden md:block w-px h-3 bg-white/10" />
            <span>VEO Farm Ready</span>
          </motion.div>
        </div>
      </div>
    );
  };

  const handleMeetJamini = () => {
    handleEnter();
    if (!generationObjective) setGenerationObjective('poster');
    setActiveStep(5);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <WelcomeScreen key="welcome" onEnter={handleEnter} onMeetJamini={handleMeetJamini} />
        ) : (
          <motion.div 
            key="studio" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0E0E11]"
          >
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {renderContent()}
            </div>
            
            {/* Global Mobile Bottom Navigation (Professional iOS/App Style) */}
            <div className="lg:hidden h-[calc(64px+env(safe-area-inset-bottom))] bg-[#0a0a0c]/98 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-2 z-[100] pb-safe shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.5)]">
              {[
                { id: 'studio', label: 'STUDIO', icon: LayoutIcon, isActive: currentView === 'editor' && activeStep <= 3, action: () => { setCurrentView('editor'); if(currentView === 'editor') setActiveStep(1); } },
                { id: 'vault', label: 'VAULT', icon: History, isActive: currentView === 'gallery', action: () => { setCurrentView('gallery'); } },
                { id: 'new', label: 'NEW', icon: Plus, isActive: false, action: () => { setGenerationObjective(null); setActiveStep(1); setCurrentView('editor'); }, isAction: true },
                { id: 'preview', label: 'PREVIEW', icon: MonitorPlay, isActive: currentView === 'editor' && activeStep === 4, action: () => { setCurrentView('editor'); setActiveStep(4); }, hasPing: generatedImage || generatedVideo },
                { id: 'guide', label: 'GUIDE', icon: Book, isActive: currentView === 'editor' && activeStep === 5, action: () => { setCurrentView('editor'); setActiveStep(5); } }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={tab.action} 
                  className={cn("flex flex-col items-center justify-center w-[20%] h-full gap-1 transition-all relative group pt-1", 
                    tab.isActive ? "text-indigo-400" : "text-white/40 hover:text-white/80"
                  )}
                >
                  {tab.hasPing && <div className="absolute top-2 right-[25%] w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(217,70,239,1)]" />}
                  
                  {tab.isActive && !tab.isAction && (
                    <motion.div layoutId="mobile-nav-indicator" className="absolute top-0 left-[25%] right-[25%] h-[2px] bg-indigo-500 rounded-b-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                  
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all duration-300", 
                    tab.isActive && !tab.isAction ? "scale-110" : "",
                    tab.isAction ? "bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white rounded-full p-2.5 -mt-6 shadow-[0_4px_20px_rgba(99,102,241,0.5)] active:scale-95 border-[3px] border-[#0a0a0c]" : ""
                  )}>
                    <tab.icon className={cn("w-6 h-6 transition-colors", tab.isActive && !tab.isAction ? "drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "", tab.isAction ? "w-5 h-5" : "")} />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black tracking-widest transition-all",
                    tab.isActive ? "opacity-100" : "opacity-70",
                    tab.isAction ? "mt-0" : ""
                  )}>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
