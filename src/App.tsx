import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import { 
  Image as ImageIcon, Sparkles, Download, Maximize, Minimize, Info, History,
  CheckCircle2, AlertCircle, Loader2, Upload, X, Type, Layout as LayoutIcon,
  MousePointer2, ImagePlus, ToggleLeft, ToggleRight, Layers, Wand2, Settings2,
  Trash2, ArrowLeft, Zap, Palette, Camera, MonitorPlay, ChevronRight, ChevronLeft,
  Smartphone, Globe, Code, Terminal, Check, ListChecks, Key, Copy, Cpu, Workflow, Shield, Star, ArrowRight,
  Undo2, Redo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type APIAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '1:4' | '1:8' | '4:1' | '8:1';
type DimensionMode = '2D Standard' | '3D Hyper-Realistic' | '4D Temporal Dynamic';
type StylePreset = 'High-End Commercial' | 'Cinematic Editorial' | 'Hyper-Minimalist' | 'Vintage Heritage' | 'Avant-Garde Fashion' | 'Neon Cyberpunk' | 'Watercolor Illustration' | 'Pop Art' | 'Dark Academia' | 'Futuristic Sci-Fi' | 'Surrealist Dreamscape' | 'Retro 80s Synthwave' | 'Swiss Modernism' | 'Bauhaus Industrial' | 'Luxury Minimal' | 'Organic Brutalism';
type LayoutType = 'Hero Product Shot' | 'Editorial Spread' | 'Bento Grid Layout' | 'Dynamic Action Composition' | 'Flatlay / Knolling' | 'Magazine Cover' | 'Billboard Ad' | 'Social Media Story' | 'Minimalist Grid' | '3D Isometric Room' | 'Cinematic Wide Shot' | 'Asymmetric Balance' | 'Golden Ratio Spiral' | 'Split Depth' | 'Floating Product';
type Lighting = 'Softbox Studio' | 'Dramatic Chiaroscuro' | 'Cinematic Backlighting' | 'Ethereal Natural Light' | 'Harsh Flash / Paparazzi' | 'Golden Hour' | 'Bioluminescent Glow' | 'Moody Silhouette' | 'Volumetric God Rays' | 'Cyberpunk Neon' | 'Rembrandt Lighting' | 'High-Key Commercial' | 'Low-Key Noir';
type FontPreset = 'Inter' | 'Playfair Display' | 'Space Grotesk' | 'Outfit' | 'Bebas Neue' | 'Cinzel' | 'Montserrat' | 'Oswald' | 'Merriweather' | 'Pacifico' | 'Cormorant Garamond' | 'Syncopate' | 'Unbounded' | 'Fraunces';
type TextEngine = 'Gemini 3.1 Pro' | 'Gemini 3.0 Pro' | 'Gemini 3.1 Flash' | 'Gemini 2.5 Flash';
type ImageEngine = 'Gemini 2.5 Flash Image (Free)' | 'Gemini 3.1 Flash Image (Paid)' | 'Gemini 3.0 Pro Image (Paid)';

interface DynamicSettings {
  gloss: boolean;
  realisticElements: boolean;
  dirtAndTexture: boolean;
  realisticMovements: boolean;
  noMistakes: boolean;
  depthOfField: boolean;
  motionBlur: boolean;
  subsurfaceScattering: boolean;
  metallic: number;
  roughness: number;
  normalMapIntensity: number;
}

interface EditorState {
  scenePrompt: string;
  assetPrompt: string;
  textElements: TextElement[];
  includeText: boolean;
  productAssets: Asset[];
  logoAsset: Asset | null;
  characterAsset: Asset | null;
  themeColors: string[];
  customColor: string;
  textEngine: TextEngine;
  imageEngine: ImageEngine;
  rules: string[];
  style: StylePreset;
  layout: LayoutType;
  lighting: Lighting;
  aspectRatio: APIAspectRatio;
  fontFamily: FontPreset;
  dimensionMode: DimensionMode;
  dynamics: DynamicSettings;
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
}

interface TextElement {
  id: string;
  type: 'Headline' | 'Sub-headline' | 'Pricing' | 'Body/Other';
  text: string;
}

// --- Constants ---

const TEXT_ENGINES: TextEngine[] = ['Gemini 3.1 Pro', 'Gemini 3.0 Pro', 'Gemini 3.1 Flash', 'Gemini 2.5 Flash'];
const IMAGE_ENGINES: ImageEngine[] = ['Gemini 2.5 Flash Image (Free)', 'Gemini 3.1 Flash Image (Paid)', 'Gemini 3.0 Pro Image (Paid)'];

const ENGINE_DETAILS: Record<ImageEngine, string> = {
  'Gemini 2.5 Flash Image (Free)': 'Fast and versatile. Best for quick iterations and standard commercial layouts. Completely free to use.',
  'Gemini 3.1 Flash Image (Paid)': 'Advanced reasoning and higher quality generation. Requires your own Gemini API Key.',
  'Gemini 3.0 Pro Image (Paid)': 'The ultimate flagship model. Unmatched realism, complex scene understanding, and cinematic quality. Requires your own Gemini API Key.'
};

const STYLES: StylePreset[] = ['High-End Commercial', 'Cinematic Editorial', 'Hyper-Minimalist', 'Vintage Heritage', 'Avant-Garde Fashion', 'Neon Cyberpunk', 'Watercolor Illustration', 'Pop Art', 'Dark Academia', 'Futuristic Sci-Fi', 'Surrealist Dreamscape', 'Retro 80s Synthwave', 'Swiss Modernism', 'Bauhaus Industrial', 'Luxury Minimal', 'Organic Brutalism'];
const LAYOUTS: LayoutType[] = ['Hero Product Shot', 'Editorial Spread', 'Bento Grid Layout', 'Dynamic Action Composition', 'Flatlay / Knolling', 'Magazine Cover', 'Billboard Ad', 'Social Media Story', 'Minimalist Grid', '3D Isometric Room', 'Cinematic Wide Shot', 'Asymmetric Balance', 'Golden Ratio Spiral', 'Split Depth', 'Floating Product'];
const LIGHTING_OPTIONS: Lighting[] = ['Softbox Studio', 'Dramatic Chiaroscuro', 'Cinematic Backlighting', 'Ethereal Natural Light', 'Harsh Flash / Paparazzi', 'Golden Hour', 'Bioluminescent Glow', 'Moody Silhouette', 'Volumetric God Rays', 'Cyberpunk Neon', 'Rembrandt Lighting', 'High-Key Commercial', 'Low-Key Noir'];
const FONTS: FontPreset[] = ['Inter', 'Playfair Display', 'Space Grotesk', 'Outfit', 'Bebas Neue', 'Cinzel', 'Montserrat', 'Oswald', 'Merriweather', 'Pacifico', 'Cormorant Garamond', 'Syncopate', 'Unbounded', 'Fraunces'];
const DIMENSION_MODES: DimensionMode[] = ['2D Standard', '3D Hyper-Realistic', '4D Temporal Dynamic'];

const PROFESSIONAL_PALETTES = [
  { name: 'Midnight Luxury', colors: ['#0F172A', '#1E293B', '#334155', '#6366F1', '#F8FAFC'] },
  { name: 'Golden Heritage', colors: ['#1C1917', '#44403C', '#78716C', '#D97706', '#F5F5F4'] },
  { name: 'Cyber Neon', colors: ['#020617', '#1E1B4B', '#4C1D95', '#D946EF', '#22D3EE'] },
  { name: 'Swiss Clean', colors: ['#FFFFFF', '#F1F5F9', '#94A3B8', '#EF4444', '#0F172A'] },
  { name: 'Organic Earth', colors: ['#1A2E05', '#365314', '#4D7C0F', '#84CC16', '#F7FEE7'] },
  { name: 'Deep Ocean', colors: ['#083344', '#155E75', '#06B6D4', '#22D3EE', '#ECFEFF'] }
];
const ASPECT_RATIOS: { label: string, value: APIAspectRatio }[] = [
  { label: '1:1 (Square)', value: '1:1' },
  { label: '9:16 (Story)', value: '9:16' },
  { label: '16:9 (Wide)', value: '16:9' },
  { label: '4:3 (Print)', value: '4:3' },
  { label: '3:4 (Portrait)', value: '3:4' },
  { label: '1:4 (Tall)', value: '1:4' },
  { label: '4:1 (Banner)', value: '4:1' }
];

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', 
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ffffff', '#000000', '#14b8a6'
];

// --- Components ---

const JaminiLogo = ({ showText = true, className = "", size = "md" }: { showText?: boolean, className?: string, size?: "sm" | "md" | "lg" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12 lg:w-16 lg:h-16",
    lg: "w-20 h-20 lg:w-24 lg:h-24"
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
      className={`flex items-center gap-4 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`} style={{ perspective: '1200px' }}>
        <motion.div 
          animate={{ 
            rotateY: isHovered ? [-20, 20, -20] : [-10, 10, -10], 
            rotateX: isHovered ? [10, -10, 10] : [5, -5, 5],
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: isHovered ? 4 : 8, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Deep shadow */}
          <div className="absolute inset-0 bg-indigo-900/80 rounded-2xl blur-xl" style={{ transform: 'translateZ(-30px) translateY(10px)' }} />
          
          {/* Glow */}
          <motion.div 
            animate={{ opacity: isHovered ? 0.8 : 0.6, scale: isHovered ? 1.2 : 1 }}
            className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-emerald-500 rounded-2xl blur-lg" 
            style={{ transform: 'translateZ(-10px)' }} 
          />
          
          {/* Main 3D Block */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-black to-gray-900 rounded-2xl border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.8),0_15px_25px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden" style={{ transform: 'translateZ(15px)' }}>
            {/* Glass reflection */}
            <motion.div 
              animate={{ x: isHovered ? ['-100%', '100%'] : ['-50%', '50%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] -skew-x-12" 
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
            
            <span className={`relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-fuchsia-200 font-black tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] ${jClasses[size]}`} style={{ fontFamily: 'Space Grotesk' }}>J</span>
            
            {/* X-Ray / Wireframe Overlay on Hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[2px] flex items-center justify-center border-2 border-indigo-500/50 rounded-2xl"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <Cpu className="w-1/2 h-1/2 text-indigo-400/50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Floating elements */}
          <motion.div animate={{ z: [20, 50, 20], y: [-10, 10, -10], rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute -top-4 -right-4">
            <Sparkles className="w-6 h-6 text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,1)]" />
          </motion.div>
          <motion.div animate={{ z: [10, 30, 10], x: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-2 -left-2">
            <Zap className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </motion.div>
        </motion.div>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <motion.h1 
            animate={{ letterSpacing: isHovered ? "0.1em" : "0em" }}
            className={`${textClasses[size]} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-lg`} 
            style={{ fontFamily: 'Space Grotesk' }}
          >
            JAMINI
          </motion.h1>
          <div className="flex items-center gap-2 -mt-1">
            <motion.div 
              animate={{ width: isHovered ? 32 : 16 }}
              className="h-[1px] bg-gradient-to-r from-indigo-500 to-transparent" 
            />
            <span className={`${subTextClasses[size]} text-indigo-400 font-bold uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]`}>Studio Edition</span>
          </div>
        </div>
      )}
    </div>
  );
};

const WelcomeScreen = ({ onEnter }: { onEnter: () => void }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const playWelcomeMelody = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      
      const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime + startTime);
        filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + startTime + duration);

        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Professional, ethereal chord sequence
      const root = 440; // A4
      const notes = [1, 1.25, 1.5, 1.875, 2]; // Major 7th arpeggio
      
      notes.forEach((ratio, i) => {
        playNote(root * ratio, i * 0.2, 2.5, 'sine', 0.1);
        playNote(root * ratio * 1.005, i * 0.2 + 0.05, 2.5, 'triangle', 0.05); // Shimmer
      });

      // Bass note
      playNote(root / 2, 0, 4, 'sine', 0.15);
      
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleEnter = () => {
    playWelcomeMelody();
    onEnter();
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030014] overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
          className="mb-12"
        >
          <JaminiLogo size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400">JAMINI</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 font-light tracking-wide max-w-2xl mx-auto">
            Where AI Meets Professional Design.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(167, 139, 250, 0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEnter}
          className="group relative px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-widest uppercase">Enter Studio</span>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </motion.button>
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
        <p className="text-white/50 text-base leading-relaxed group-hover:text-white/70 transition-colors z-10 relative" style={{ transform: 'translateZ(10px)' }}>{feature.desc}</p>
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-screen bg-[#050505] text-white p-6 lg:p-12 overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Studio
        </button>
        
        <div className="mb-16 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="inline-block mb-6">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Terminal className="w-10 h-10 text-indigo-400" />
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-fuchsia-400">
            Launch & Setup Guide
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            A comprehensive, step-by-step walkthrough to deploy JAMINI Studio to production and install it as a native-feeling Progressive Web App.
          </p>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          
          {/* Step 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-indigo-500/20 text-indigo-400 font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              1
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors rounded-2xl p-6 lg:p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3"><Code className="w-6 h-6 text-indigo-400" /> Push to GitHub</h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">Initialize your local repository and push the JAMINI Studio codebase to GitHub. This is required for Vercel to automatically build and deploy your app.</p>
              <div className="bg-black/80 border border-white/10 rounded-xl p-4 relative group/code">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Terminal</span>
                  <button onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "Initial commit"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/jamini-studio.git\ngit push -u origin main', 'git')} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
                    {copied === 'git' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="text-sm text-indigo-300 font-mono overflow-x-auto leading-relaxed">
                  <span className="text-fuchsia-400">git</span> init<br/>
                  <span className="text-fuchsia-400">git</span> add .<br/>
                  <span className="text-fuchsia-400">git</span> commit -m <span className="text-green-400">"Initial commit"</span><br/>
                  <span className="text-fuchsia-400">git</span> branch -M main<br/>
                  <span className="text-fuchsia-400">git</span> remote add origin <span className="text-blue-400">https://github.com/YOUR_USERNAME/jamini-studio.git</span><br/>
                  <span className="text-fuchsia-400">git</span> push -u origin main
                </pre>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-fuchsia-500/20 text-fuchsia-400 font-bold shadow-[0_0_20px_rgba(217,70,239,0.4)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              2
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border border-white/10 hover:border-fuchsia-500/50 transition-colors rounded-2xl p-6 lg:p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3"><Globe className="w-6 h-6 text-fuchsia-400" /> Deploy to Vercel</h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">Connect your GitHub repository to Vercel for seamless, automated deployments.</p>
              <ol className="list-decimal list-inside space-y-4 text-white/70 text-sm">
                <li className="pl-2">Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline font-bold">vercel.com</a> and sign in.</li>
                <li className="pl-2">Click on <strong>Add New...</strong> and select <strong>Project</strong>.</li>
                <li className="pl-2">Import the GitHub repository you just created.</li>
                <li className="pl-2">In the <strong>Configure Project</strong> section, open the <strong>Environment Variables</strong> dropdown.</li>
                <li className="pl-2">Add your Gemini API Key (required for free models):
                  <div className="bg-black/80 border border-white/10 rounded-xl p-4 mt-3 mb-2 flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Key Name</label>
                      <code className="text-fuchsia-300 bg-white/5 px-2 py-1 rounded border border-white/10 block w-full">GEMINI_API_KEY</code>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Value</label>
                      <code className="text-white/60 bg-white/5 px-2 py-1 rounded border border-white/10 block w-full truncate">AIzaSyYourActualGeminiApiKeyHere...</code>
                    </div>
                  </div>
                </li>
                <li className="pl-2">Click <strong className="text-white">Deploy</strong> and wait for the build to complete.</li>
              </ol>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-emerald-500/20 text-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              3
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors rounded-2xl p-6 lg:p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3"><Smartphone className="w-6 h-6 text-emerald-400" /> Install as PWA</h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">JAMINI Studio is a Progressive Web App. Install it directly to your device's home screen for a native app experience.</p>
              
              <div className="space-y-4">
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-colors">
                  <h3 className="font-bold text-md mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /> iOS (Safari)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-white/50 pl-4">
                    <li>Open your Vercel URL in Safari.</li>
                    <li>Tap the <strong>Share</strong> icon at the bottom.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  </ol>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-colors">
                  <h3 className="font-bold text-md mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /> Android (Chrome)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-white/50 pl-4">
                    <li>Open your Vercel URL in Chrome.</li>
                    <li>Tap the <strong>3-dot menu</strong> in the top right.</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>

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
      
      <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-fuchsia-900/10 to-[#050505] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-16 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Studio
        </button>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          <div className="flex-1 text-center lg:text-left relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }} 
              animate={{ scale: 1, opacity: 1, rotate: 0 }} 
              transition={{ type: "spring", duration: 1.5 }} 
              className="inline-block mb-8 relative"
            >
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full" />
              <JaminiLogo size="lg" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-fuchsia-400">Professional Grade.</span><br/>
              <span className="text-white">AI Powered.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10 font-light"
            >
              JAMINI Studio bridges the gap between raw AI generation and professional graphic design. Discover the tools powering your next iconic advertisement.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-full px-5 py-2.5 text-sm font-bold text-indigo-300 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Wand2 className="w-4 h-4"/> Gemini 3.1 Pro</div>
              <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full px-5 py-2.5 text-sm font-bold text-fuchsia-300 flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.2)]"><Smartphone className="w-4 h-4"/> PWA Ready</div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-5 py-2.5 text-sm font-bold text-emerald-300 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Download className="w-4 h-4"/> 4K Export</div>
            </motion.div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000">
            <motion.div 
              animate={{ 
                y: [-15, 15, -15], 
                rotateX: [5, -5, 5],
                rotateY: [-5, 5, -5]
              }} 
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
              className="relative z-20 rounded-3xl overflow-hidden border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform-gpu"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 mix-blend-overlay z-10" />
               <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract 3D rendering" className="w-full h-auto object-cover scale-105" />
               <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                 <div className="flex items-center gap-3 mb-2">
                   <span className="px-2 py-1 rounded bg-fuchsia-500 text-white text-[10px] font-bold uppercase tracking-wider">Featured</span>
                   <span className="text-xs text-white/60 font-mono uppercase tracking-widest">Generated with JAMINI Pro</span>
                 </div>
                 <h3 className="text-4xl font-black tracking-tighter text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>NEON DREAMS</h3>
               </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-indigo-600/40 to-fuchsia-600/40 blur-[120px] -z-10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Marquee Section */}
        <div className="mb-32 relative w-full overflow-hidden flex flex-col items-center">
          <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">Supported Visual Styles</p>
          <div className="flex space-x-8 animate-marquee whitespace-nowrap opacity-50 hover:opacity-100 transition-opacity duration-500">
            {[...STYLES, ...STYLES].map((style, i) => (
              <span key={i} className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white/20 to-white/60 uppercase tracking-tighter" style={{ fontFamily: 'Space Grotesk' }}>
                {style} <span className="text-indigo-500/50 mx-4">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Unleash Your Creativity</h2>
          <p className="text-white/50 max-w-2xl text-lg">Everything you need to build stunning, production-ready assets in seconds.</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {[
            { icon: LayoutIcon, color: 'indigo', title: 'Dynamic Layout Engine', desc: 'Choose from 15+ professional layouts including Bento Grids, Editorial Spreads, and Asymmetric Balance. The AI perfectly positions your products based on architectural rules.' },
            { icon: MonitorPlay, color: 'cyan', title: '3D & 4D Dimension Modes', desc: 'Go beyond 2D. Generate hyper-realistic 3D scenes or 4D temporal dynamics that capture the essence of movement and time in a single frame.' },
            { icon: Zap, color: 'fuchsia', title: 'Advanced Dynamics', desc: 'Manually toggle gloss, realistic textures, dirt, and subsurface scattering. Enforce "No Mistakes" mode for flawless anatomical and object rendering.' },
            { icon: Palette, color: 'emerald', title: 'Professional Palettes', desc: 'Access curated color themes like Midnight Luxury and Golden Heritage. Ensure your brand colors are applied with professional color grading.' },
            { icon: Type, color: 'amber', title: 'Typography Integration', desc: 'Seamlessly blend text into your generated images matching specific font families like Space Grotesk, Cinzel, or Playfair Display with perfect kerning.' },
            { icon: Download, color: 'blue', title: 'Multi-Format Export', desc: 'Download your masterpieces in standard PNG/JPG, Print-ready PDF, or next-gen VIF (AVIF) formats directly from the browser.' },
            { icon: ListChecks, color: 'rose', title: 'Custom Rule Sets', desc: 'Enforce strict guidelines. Add custom rules one-by-one (e.g., "No people", "Black background only") that the AI engine is forced to follow.' },
            { icon: Cpu, color: 'cyan', title: 'Dual-Engine Architecture', desc: 'Utilizes Gemini 3.1 Pro for advanced prompt reasoning and Gemini 3.1 Flash Image for hyper-realistic rendering simultaneously.' },
            { icon: Shield, color: 'green', title: 'Secure API Integration', desc: 'Your API keys are never stored on our servers. They are injected directly into the secure AI Studio environment at runtime.' }
          ].map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </motion.div>

        {/* Workflow Section */}
        <div className="mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">How It Works</h2>
            <p className="text-white/50 text-lg">A streamlined workflow designed for professionals.</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { step: '01', title: 'Upload Assets', desc: 'Provide your product images, logos, and character models. The AI analyzes their lighting and perspective.', color: 'indigo', icon: Upload },
                { step: '02', title: 'Define Style', desc: 'Select your layout, lighting, typography, and color palette. Refine your prompt with Gemini 3.1 Pro.', color: 'fuchsia', icon: Palette },
                { step: '03', title: 'Generate & Export', desc: 'Render the final masterpiece using advanced image models and export in up to 4K resolution.', color: 'emerald', icon: Download }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative flex flex-col items-center text-center group">
                  {/* Glowing Node */}
                  <div className="relative mb-8">
                    <div className={`absolute inset-0 bg-${step.color}-500/30 blur-xl rounded-full group-hover:bg-${step.color}-500/50 transition-colors duration-500`} />
                    <div className={`w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] group-hover:border-${step.color}-500/50 transition-colors duration-500`}>
                      <div className={`absolute inset-1 rounded-full border border-${step.color}-500/20 border-dashed animate-[spin_10s_linear_infinite]`} />
                      <step.icon className={`w-8 h-8 text-${step.color}-400 drop-shadow-[0_0_10px_rgba(var(--${step.color}-500),0.8)]`} />
                    </div>
                    <div className={`absolute -top-3 -right-3 w-8 h-8 bg-${step.color}-500 rounded-full flex items-center justify-center text-xs font-black text-white shadow-[0_0_15px_rgba(var(--${step.color}-500),0.8)] z-20`}>
                      {step.step}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-white/90">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed text-base">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Engine Explanation Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-gradient-to-br from-indigo-900/20 to-fuchsia-900/20 border border-white/10 rounded-[3rem] p-8 lg:p-16 text-center relative overflow-hidden shadow-2xl">
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

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'features' | 'guide'>('editor');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // State
  const [scenePrompt, setScenePrompt] = useState('');
  const [assetPrompt, setAssetPrompt] = useState('');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [newTextType, setNewTextType] = useState<'Headline' | 'Sub-headline' | 'Pricing' | 'Body/Other'>('Headline');
  const [newTextContent, setNewTextContent] = useState('');
  const [includeText, setIncludeText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [productAssets, setProductAssets] = useState<Asset[]>([]);
  const [logoAsset, setLogoAsset] = useState<Asset | null>(null);
  const [characterAsset, setCharacterAsset] = useState<Asset | null>(null);
  const [themeColors, setThemeColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#ff0000');

  const [textEngine, setTextEngine] = useState<TextEngine>('Gemini 3.1 Pro');
  const [imageEngine, setImageEngine] = useState<ImageEngine>('Gemini 2.5 Flash Image (Free)');
  
  const [isRefiningScene, setIsRefiningScene] = useState(false);
  const [isRefiningAsset, setIsRefiningAsset] = useState(false);
  const [isSuggestingScene, setIsSuggestingScene] = useState(false);
  
  const [rules, setRules] = useState<string[]>([]);
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
    metallic: 50,
    roughness: 50,
    normalMapIntensity: 50
  });

  // Undo/Redo State
  const currentState: EditorState = {
    scenePrompt, assetPrompt, textElements, includeText,
    productAssets, logoAsset, characterAsset, themeColors, customColor,
    textEngine, imageEngine, rules, style, layout, lighting, aspectRatio,
    fontFamily, dimensionMode, dynamics
  };

  const [history, setHistory] = useState<EditorState[]>([currentState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const lastSavedState = history[historyIndex];
      if (JSON.stringify(currentState) !== JSON.stringify(lastSavedState)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentState, history, historyIndex]);

  const applyState = (state: EditorState) => {
    setScenePrompt(state.scenePrompt);
    setAssetPrompt(state.assetPrompt);
    setTextElements(state.textElements);
    setIncludeText(state.includeText);
    setProductAssets(state.productAssets);
    setLogoAsset(state.logoAsset);
    setCharacterAsset(state.characterAsset);
    setThemeColors(state.themeColors);
    setCustomColor(state.customColor);
    setTextEngine(state.textEngine);
    setImageEngine(state.imageEngine);
    setRules(state.rules);
    setStyle(state.style);
    setLayout(state.layout);
    setLighting(state.lighting);
    setAspectRatio(state.aspectRatio);
    setFontFamily(state.fontFamily);
    setDimensionMode(state.dimensionMode);
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  const handleEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // This was a legacy handler, we now use separate state for text and image engines
    console.log("Engine changed:", e.target.value);
  };

  const updateAssetPrompt = (id: string, type: 'product' | 'logo' | 'character', prompt: string) => {
    if (type === 'product') {
      setProductAssets(prev => prev.map(a => a.id === id ? { ...a, prompt } : a));
    } else if (type === 'logo') {
      setLogoAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);
    } else if (type === 'character') {
      setCharacterAsset(prev => prev?.id === id ? { ...prev, prompt } : prev);
    }
  };

  const refineSpecificAssetPrompt = async (id: string, type: 'product' | 'logo' | 'character') => {
    let asset = type === 'product' ? productAssets.find(a => a.id === id) : type === 'logo' ? logoAsset : characterAsset;
    if (!asset || !asset.prompt?.trim()) { setError("Please enter a prompt to refine."); return; }

    const setRefining = (val: boolean) => {
      if (type === 'product') setProductAssets(prev => prev.map(a => a.id === id ? { ...a, isRefining: val } : a));
      else if (type === 'logo') setLogoAsset(prev => prev ? { ...prev, isRefining: val } : prev);
      else if (type === 'character') setCharacterAsset(prev => prev ? { ...prev, isRefining: val } : prev);
    };

    setRefining(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      let textModelName = 'gemini-3.1-pro-preview';
      if (textEngine === 'Gemini 3.0 Pro') textModelName = 'gemini-3-pro-preview';
      if (textEngine === 'Gemini 3.1 Flash') textModelName = 'gemini-3.1-flash-preview';
      if (textEngine === 'Gemini 2.5 Flash') textModelName = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model: textModelName,
        contents: `You are an expert AI image generation prompt engineer. Enhance the following asset description to be highly detailed and optimized for integrating this specific asset into a professional advertisement poster. Keep it concise but highly descriptive. Only return the enhanced prompt text, nothing else. Original text: "${asset.prompt}"`,
      });
      const refined = response.text?.trim();
      if (refined) {
        updateAssetPrompt(id, type, refined);
      }
    } catch (err: any) {
      console.error("Error refining asset prompt:", err);
      setError(err.message || "Failed to refine prompt.");
    } finally {
      setRefining(false);
    }
  };

  const addTextElement = () => {
    if (newTextContent.trim()) {
      setTextElements([...textElements, { id: Date.now().toString(), type: newTextType, text: newTextContent.trim() }]);
      setNewTextContent('');
    }
  };

  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter(t => t.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'logo' | 'character') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let base64 = '';
        let mimeType = file.type;

        if (file.type === 'image/svg+xml') {
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
        else if (type === 'logo') setLogoAsset(asset);
        else setCharacterAsset(asset);
      } catch (err) {
        console.error("Error processing file:", err);
        setError(`Failed to process image: ${file.name}. If it's an SVG, try converting it to PNG first.`);
      }
    }
    e.target.value = '';
  };

  const removeAsset = (id: string, type: 'product' | 'logo' | 'character') => {
    if (type === 'product') setProductAssets(prev => prev.filter(a => a.id !== id));
    else if (type === 'logo') setLogoAsset(null);
    else setCharacterAsset(null);
  };

  const toggleColor = (color: string) => {
    setThemeColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : (prev.length < 5 ? [...prev, color] : prev));
  };

  const suggestScenePrompt = async () => {
    setIsSuggestingScene(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      
      let textModelName = 'gemini-3.1-pro-preview';
      if (textEngine === 'Gemini 3.0 Pro') textModelName = 'gemini-3-pro-preview';
      if (textEngine === 'Gemini 3.1 Flash') textModelName = 'gemini-3.1-flash-preview';
      if (textEngine === 'Gemini 2.5 Flash') textModelName = 'gemini-2.5-flash';

      const prompt = `You are an expert art director and set designer. Create a highly detailed, complex, and visually stunning background environment description for a product advertisement.
      Current Style: ${style}
      Current Layout: ${layout}
      Current Lighting: ${lighting}
      ${productAssets.length > 0 ? `Number of products in scene: ${productAssets.length}` : ''}
      
      The scene should perfectly complement these settings and the products. Return ONLY the scene description (1-3 sentences), with no introductory text, quotes, or explanations.`;

      const response = await ai.models.generateContent({
        model: textModelName,
        contents: prompt,
      });
      const suggestion = response.text?.trim();
      if (suggestion) {
        setScenePrompt(suggestion);
      }
    } catch (err: any) {
      console.error("Error suggesting scene:", err);
      setError(err.message || "Failed to suggest scene.");
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      
      let textModelName = 'gemini-3.1-pro-preview';
      if (textEngine === 'Gemini 3.0 Pro') textModelName = 'gemini-3-pro-preview';
      if (textEngine === 'Gemini 3.1 Flash') textModelName = 'gemini-3.1-flash-preview';
      if (textEngine === 'Gemini 2.5 Flash') textModelName = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model: textModelName,
        contents: `You are an expert AI image generation prompt engineer. Enhance the following ${type} description to be highly detailed, vivid, and optimized for a professional advertisement poster. Keep it concise but highly descriptive. Only return the enhanced prompt text, nothing else. Original text: "${currentText}"`,
      });
      const refined = response.text?.trim();
      if (refined) {
        if (type === 'scene') setScenePrompt(refined); else setAssetPrompt(refined);
      }
    } catch (err: any) {
      setError(`Failed to refine prompt: ${err.message}`);
    } finally {
      if (type === 'scene') setIsRefiningScene(false); else setIsRefiningAsset(false);
    }
  };

  const handleGenerate = async () => {
    if (!scenePrompt.trim()) { setError("Please enter a scene description."); return; }
    setIsGenerating(true); setError(null);

    try {
      const colorText = themeColors.length > 0 ? `Use the following color theme: ${themeColors.join(', ')}.` : '';
      
      const specificAssetPrompts = [
        ...productAssets.filter(a => a.prompt?.trim()).map(a => `Product Asset (${a.name}): ${a.prompt}`),
        ...(logoAsset?.prompt?.trim() ? [`Logo Asset: ${logoAsset.prompt}`] : []),
        ...(characterAsset?.prompt?.trim() ? [`Character Asset: ${characterAsset.prompt}`] : [])
      ].join('\n');
      
      const assetInstruction = specificAssetPrompts 
        ? `Asset Specific Instructions:\n${specificAssetPrompts}\nGeneral Asset Instruction: ${assetPrompt.trim() || 'Integrate the uploaded products, logo, and character naturally into the scene.'}` 
        : (assetPrompt.trim() ? `Follow these specific instructions for the uploaded assets: ${assetPrompt}.` : 'Integrate the uploaded products, logo, and character naturally into the scene.');
        
      const noTextInstruction = !includeText ? "CRITICAL REQUIREMENT: Generate the image with ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, AND NO WATERMARKS anywhere in the image." : "";
      
      const textElementsPrompt = (includeText && textElements.length > 0) 
        ? `Include the following text elements prominently using a typography style matching the '${fontFamily}' font family:\n${textElements.map(t => `- ${t.type}: "${t.text}"`).join('\n')}` 
        : '';

      let engineEnhancement = '';
      if (imageEngine.includes('3.1 Flash')) {
        engineEnhancement = 'CRITICAL: Render as an absolute masterpiece, 8k resolution, hyper-realistic, insanely detailed, octane render, volumetric lighting, photorealistic textures, flawless composition.';
      } else if (imageEngine.includes('3.0 Pro')) {
        engineEnhancement = 'CRITICAL: Highly creative, award-winning composition, unique perspective, avant-garde, striking visual storytelling, bold and artistic interpretation, cinematic lighting, perfect color grading, ultra-premium commercial photography.';
      }

      let modelName = 'gemini-2.5-flash-image';
      if (imageEngine === 'Gemini 3.1 Flash Image (Paid)') modelName = 'gemini-3.1-flash-image-preview';
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

      const fullPrompt = `Professional high-end advertisement poster. 
        Dimension: ${dimensionMode}. 
        Layout: ${layout}. 
        Scene: ${scenePrompt}. 
        Style: ${style}. 
        Lighting: ${lighting}. 
        ${colorText} 
        ${noTextInstruction} 
        ${textElementsPrompt} 
        ${assetInstruction} 
        ${engineEnhancement} 
        ${customRulesText} 
        Dynamics: ${Object.entries(dynamics).filter(([k, v]) => typeof v === 'boolean' && v).map(([k, _]) => k.replace(/([A-Z])/g, ' $1')).join(', ')}.
        Material Properties: Metallic (${dynamics.metallic}%), Roughness (${dynamics.roughness}%), Normal Map Intensity (${dynamics.normalMapIntensity}%).
        ${dynamics.noMistakes ? "CRITICAL: Ensure zero anatomical errors, perfect symmetry where applicable, and flawless object boundaries." : ""}
        Composition: Top-class product photography, high detail, 4k resolution, sharp focus. 
        If a character is provided, render them in a high-quality 3D animation style with expressive features. 
        Ensure the logo (if provided) is placed professionally as branding. 
        The uploaded product images are the main subjects.
        
        CRITICAL INSTRUCTION: You MUST strictly follow all provided prompts, styles, and rules. 
        CRITICAL INSTRUCTION: You MUST incorporate EVERY single uploaded asset into the final image. Do not omit any product, logo, or character provided.`;

      const parts: any[] = [{ text: fullPrompt }];
      productAssets.forEach(asset => parts.push({ inlineData: { data: asset.data, mimeType: asset.mimeType } }));
      if (logoAsset) parts.push({ inlineData: { data: logoAsset.data, mimeType: logoAsset.mimeType } });
      if (characterAsset) parts.push({ inlineData: { data: characterAsset.data, mimeType: characterAsset.mimeType } });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio } }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setActiveStep(3); // Ensure we are on the preview step
      } else {
        throw new Error("No image was generated. Please try a different prompt.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 bg-white/5 p-2 rounded-2xl border border-white/10">
      {[1, 2, 3].map((step) => (
        <button key={step} onClick={() => setActiveStep(step as 1|2|3)} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2", activeStep === step ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-white/40 hover:text-white/80 hover:bg-white/5")}>
          {step === 1 && <Layers className="w-4 h-4" />}
          {step === 2 && <Palette className="w-4 h-4" />}
          {step === 3 && <Wand2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{step === 1 ? 'Assets' : step === 2 ? 'Design' : 'Generate'}</span>
        </button>
      ))}
    </div>
  );

  const renderContent = () => {
    if (currentView === 'features') return <FeaturesPage onBack={() => setCurrentView('editor')} />;
    if (currentView === 'guide') return <SetupGuide onBack={() => setCurrentView('editor')} />;

    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-indigo-500/30">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0 flex items-center justify-between px-4 lg:px-6 z-50">
        <JaminiLogo size="sm" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2 lg:mr-4 border-r border-white/10 pr-2 lg:pr-4">
            <button onClick={undo} disabled={historyIndex === 0} className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCurrentView('guide')} className="text-xs font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <Terminal className="w-4 h-4" /> <span className="hidden sm:inline">Setup Guide</span>
          </button>
          <button onClick={() => setCurrentView('features')} className="text-xs font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <Info className="w-4 h-4" /> <span className="hidden sm:inline">Features</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Side-by-Side on Desktop, Stacked on Mobile */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Controls (Stepper) */}
        <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col shrink-0 lg:h-full border-r border-white/5 bg-[#0a0a0a] z-20 shadow-2xl lg:shadow-none">
          <div className="p-4 lg:p-6 flex-1 overflow-y-visible lg:overflow-y-auto custom-scrollbar">
            {renderStepIndicator()}

            <AnimatePresence mode="wait">
              {/* STEP 1: ASSETS */}
              {activeStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-400" /> Product Images</h3>
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
                            <input type="text" value={asset.prompt || ''} onChange={(e) => updateAssetPrompt(asset.id, 'product', e.target.value)} placeholder="Specific prompt for this product..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => productInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Upload Product</span>
                      </button>
                      <input type="file" ref={productInputRef} onChange={(e) => handleFileUpload(e, 'product')} multiple accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo</h3>
                      {logoAsset ? (
                        <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                            <img src={`data:${logoAsset.mimeType};base64,${logoAsset.data}`} alt="Logo" className="max-w-full max-h-full object-contain" />
                            <button onClick={() => removeAsset(logoAsset.id, 'logo')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/50 truncate max-w-[150px]">{logoAsset.name}</span>
                              <button onClick={() => refineSpecificAssetPrompt(logoAsset.id, 'logo')} disabled={logoAsset.isRefining || !logoAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                {logoAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                              </button>
                            </div>
                            <input type="text" value={logoAsset.prompt || ''} onChange={(e) => updateAssetPrompt(logoAsset.id, 'logo', e.target.value)} placeholder="Specific prompt for this logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => logoInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                          <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Logo</span>
                        </button>
                      )}
                      <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
                    </div>
                    <div className="space-y-2">
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
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => characterInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                          <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Model</span>
                        </button>
                      )}
                      <input type="file" ref={characterInputRef} onChange={(e) => handleFileUpload(e, 'character')} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider">General Asset Instructions</label>
                      <button onClick={() => refinePromptText('asset')} disabled={isRefiningAsset || !assetPrompt.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                        {isRefiningAsset ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                      </button>
                    </div>
                    <textarea value={assetPrompt} onChange={(e) => setAssetPrompt(e.target.value)} placeholder="How should the assets interact? (e.g., 'Model holding the product, logo top right')" className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none" />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DESIGN */}
              {activeStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Poster Layout</label>
                      <select value={layout} onChange={(e) => setLayout(e.target.value as LayoutType)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Visual Style</label>
                      <select value={style} onChange={(e) => setStyle(e.target.value as StylePreset)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Lighting</label>
                      <select value={lighting} onChange={(e) => setLighting(e.target.value as Lighting)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {LIGHTING_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Aspect Ratio</label>
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as APIAspectRatio)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Dimension Mode</label>
                      <div className="flex gap-2">
                        {DIMENSION_MODES.map(mode => (
                          <button 
                            key={mode} 
                            onClick={() => setDimensionMode(mode)}
                            className={cn(
                              "flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all",
                              dimensionMode === mode 
                                ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                                : "bg-black/40 border-white/10 text-white/40 hover:border-white/20"
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
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {(Object.keys(dynamics) as Array<keyof DynamicSettings>).filter(k => typeof dynamics[k] === 'boolean').map((key) => (
                        <button 
                          key={key}
                          onClick={() => toggleDynamic(key)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                            dynamics[key] 
                              ? "bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-300" 
                              : "bg-black/40 border-white/10 text-white/30 hover:border-white/20"
                          )}
                        >
                          {key.replace(/([A-Z])/g, ' $1')}
                          {dynamics[key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-4 bg-black/40 border border-white/5 rounded-xl p-4">
                      <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Texture Controls</h4>
                      {[
                        { key: 'metallic', label: 'Metallic' },
                        { key: 'roughness', label: 'Roughness' },
                        { key: 'normalMapIntensity', label: 'Normal Map' }
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
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex justify-between">
                      <span>Professional Palettes</span>
                    </label>
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
                    <div className="flex flex-wrap gap-2 pt-2">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => toggleColor(c)} style={{ backgroundColor: c }} className={cn("w-6 h-6 rounded-full border-2 transition-all relative", themeColors.includes(c) ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105")}>
                          {themeColors.includes(c) && <CheckCircle2 className={cn("w-3 h-3 absolute inset-0 m-auto", c === '#ffffff' ? "text-black" : "text-white")} />}
                        </button>
                      ))}
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
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <select value={newTextType} onChange={(e) => setNewTextType(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-white">
                            <option value="Headline">Headline</option>
                            <option value="Sub-headline">Sub-headline</option>
                            <option value="Pricing">Pricing</option>
                            <option value="Body/Other">Body/Other</option>
                          </select>
                          <input type="text" value={newTextContent} onChange={(e) => setNewTextContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTextElement()} placeholder="Enter text..." className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                          <button onClick={addTextElement} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors">Add</button>
                        </div>
                        {textElements.length > 0 && (
                          <div className="space-y-2">
                            {textElements.map(t => (
                              <div key={t.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider shrink-0">{t.type}:</span>
                                  <span className="text-xs text-white/90 truncate">{t.text}</span>
                                </div>
                                <button onClick={() => removeTextElement(t.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors shrink-0"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value as FontPreset)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-white">
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: GENERATE */}
              {activeStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><Wand2 className="w-3 h-3" /> Text Engine</label>
                      <select value={textEngine} onChange={(e) => setTextEngine(e.target.value as TextEngine)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 text-white">
                        {TEXT_ENGINES.map(e => <option key={e} value={e} className="bg-[#0a0a0a] text-white">{e}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Image Engine</label>
                        <button onClick={() => {
                          // @ts-ignore
                          if (window.aistudio?.openSelectKey) window.aistudio.openSelectKey();
                        }} className="text-[10px] flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded">
                          <Key className="w-3 h-3" /> Set API Key
                        </button>
                      </div>
                      <select value={imageEngine} onChange={(e) => setImageEngine(e.target.value as ImageEngine)} className="w-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-bold">
                        {IMAGE_ENGINES.map(e => <option key={e} value={e} className="bg-[#0a0a0a] text-white">{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-200/70 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20 leading-relaxed">
                    {ENGINE_DETAILS[imageEngine]}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><LayoutIcon className="w-3 h-3" /> Scene Description</label>
                      <div className="flex gap-2">
                        <button onClick={suggestScenePrompt} disabled={isSuggestingScene} className="text-[10px] flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {isSuggestingScene ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-Suggest
                        </button>
                        <button onClick={() => refinePromptText('scene')} disabled={isRefiningScene || !scenePrompt.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                          {isRefiningScene ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                        </button>
                      </div>
                    </div>
                    <textarea value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} placeholder="Describe the environment, mood, and placement..." className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2"><ListChecks className="w-3 h-3" /> Custom Rule Sets</label>
                      {rules.length > 0 && (
                        <button onClick={() => setRules([])} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newRule} 
                        onChange={(e) => setNewRule(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && addRule()}
                        placeholder="e.g., 'Make the background completely black'" 
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                      />
                      <button onClick={addRule} className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-4 py-2 rounded-lg transition-colors font-bold text-sm">Add</button>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions (Navigation & Generate) */}
          <div className="p-4 lg:p-6 border-t border-white/5 bg-[#0a0a0a] shrink-0 sticky bottom-0 z-30">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
            
            <div className="flex gap-3">
              {activeStep > 1 && (
                <button onClick={() => setActiveStep((activeStep - 1) as 1|2)} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              
              {activeStep < 3 ? (
                <button onClick={() => setActiveStep((activeStep + 1) as 2|3)} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold flex items-center justify-center gap-2 transition-colors">
                  Next Step <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={handleGenerate} disabled={isGenerating} className={cn("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl", isGenerating ? "bg-indigo-500/20 text-indigo-300 cursor-not-allowed border border-indigo-500/30" : "bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:shadow-indigo-500/40 text-white border border-white/10")}>
                  {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Poster</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview Area */}
        <div className="flex-1 min-h-[600px] lg:min-h-0 bg-[#050505] relative flex flex-col overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          
          <div className="flex-1 p-4 lg:p-8 flex items-center justify-center relative z-10 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {generatedImage ? (
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
                  <h3 className="text-2xl font-bold text-white/80 tracking-tight">{isGenerating ? "Rendering Masterpiece..." : "Canvas Ready"}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {isGenerating ? "JAMINI is analyzing your layout choice, typography, and assets to create a professional advertisement spread." : "Complete the 3 steps on the left to generate your stunning advertisement."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {!hasEntered && <WelcomeScreen onEnter={() => setHasEntered(true)} />}
      </AnimatePresence>
      {renderContent()}
    </>
  );
}
