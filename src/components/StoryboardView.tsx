import React, { useState, useEffect } from 'react';
import { 
  Film, Sparkles, Wand2, Download, Copy, Trash2, Plus, 
  RotateCcw, Camera, MonitorPlay, FileText, Settings2,
  ChevronDown, ChevronUp, GripVertical, Check, AlertCircle,
  Zap, ArrowLeft, Play, Layers, SlidersHorizontal, Eye, Loader2,
  ExternalLink, Maximize2, Video, Focus, X, Menu
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface VideoScene {
  id: string;
  prompt: string;
  duration: number;
  cameraMotion?: string;
  lensType?: string;
  lighting?: string;
  transitionType?: string;
  audioCue?: string;
  productAsset?: string | null;
  colorPalette?: string;
  theming?: string;
}

interface StoryboardViewProps {
  onBack: () => void;
  editorState: any;
  getApiKey: (type: 'paid' | 'free') => string;
  onUpdateState: (newState: any) => void;
}

const LENS_TYPES = [
  'Wide Angle', 'Telephoto', 'Macro', 'Anamorphic'
];

const CAMERA_MOTIONS = [
  'Slow Push-in', 'Dolly Zoom', 'Crane Up', 'Tracking Side-shot', 'Pan', 'Pull-back', 'Static'
];

const TRANSITIONS = [
  'Cut', 'Crossfade', 'Wipe', 'Dissolve', 'Match Cut', 'Zoom Blur', 'Fade to Black', 'Fade to White'
];

export default function StoryboardView({ onBack, editorState, getApiKey, onUpdateState }: StoryboardViewProps) {
  const [scenes, setScenes] = useState<VideoScene[]>(editorState.videoScenes || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number | null>(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'visual' | 'script'>('visual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ciSummary, setCiSummary] = useState(editorState.ciSummary || '');
  const isLogoMode = editorState.generationObjective === 'logo';

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateState({ ...editorState, [key]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSceneAssetUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newScenes = [...scenes];
        newScenes[index] = { ...newScenes[index], productAsset: reader.result as string };
        setScenes(newScenes);
        onUpdateState({ ...editorState, videoScenes: newScenes });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (scenes.length === 0) {
      const initialScenes = [{
        id: crypto.randomUUID(),
        prompt: editorState.scenePrompt || 'New cinematic scene...',
        duration: 3,
        cameraMotion: 'Static',
        lensType: '35mm Narrative',
        lighting: editorState.lighting || 'Cinematic',
        transitionType: 'Cut'
      }];
      setScenes(initialScenes);
      onUpdateState({ ...editorState, videoScenes: initialScenes });
    }
  }, []);

  const handleReorder = (newOrder: VideoScene[]) => {
    setScenes(newOrder);
    onUpdateState({ ...editorState, videoScenes: newOrder });
  };

  const simulateVideoGeneration = () => {
    setIsPreviewing(true);
    setPreviewProgress(0);
    setPreviewUrl(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          // Placeholder video URL - in a real app this would be the actual generated video
          setPreviewUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'); 
        }, 500);
      }
      setPreviewProgress(progress);
    }, 400);
  };

  const generateAIPrompt = async () => {
    const apiKey = getApiKey('paid');
    if (!apiKey) {
      alert("API KEY MISSING. PLEASE CHECK SETTINGS.");
      return;
    }

    setIsGenerating(true);
    setStatus('idle');

    try {
      const ai = new GoogleGenAI({ apiKey });

      const sceneDetails = scenes.map((s, i) => `
        Scene ${i + 1}: 
        Visual Direction: ${s.prompt}
        Product Asset: ${s.productAsset ? 'Included (Visual Asset Provided)' : 'Not Provided'}
      `).join('\n');

      const prompt = `
        As a cinematic storyboard artist and director, break down the following concept into a detailed 4-scene cinematic storyboard.
        
        CONCEPT: ${editorState.scenePrompt}
        STYLE: ${editorState.style}
        LIGHTING PREFERENCE: ${editorState.lighting}
        CONCEPT ASSETS: ${editorState.assetPrompt}
        BRAND LOGO: ${editorState.brandLogoAsset ? 'Provided' : 'None'}
        COMPANY LOGO: ${editorState.companyLogoAsset ? 'Provided' : 'None'}
        CHARACTER: ${editorState.characterAsset ? 'Provided' : 'None'}
        CI PDF: ${editorState.ciPdfAsset ? 'Provided' : 'None'}
        CI SUMMARY: ${editorState.ciSummary || 'None'}
        
        Current Scene Breakdown Structure:
        ${sceneDetails}
        
        For each scene, use the specific assets (especially if 'Provided') to ensure brand and identity consistency.
        1. Visual Prompt (detailed)
        2. Duration (2-5 seconds)
        3. Camera Motion (e.g., Dolly Zoom, Tracking, Pan, Push-in)
        4. Lens Type (e.g., 85mm Wide, Anamorphic)
        5. Lighting (e.g., Rembrandt, Chiaroscuro, High-Key)
        6. Transition (e.g., Wipe, Match Cut, Fade)
        7. Audio Cue (e.g., Bass Drop, Swoosh, Mechanical hum)
        
        Return the result as a valid JSON array of objects with keys: prompt, duration, cameraMotion, lensType, lighting, transitionType, audioCue.
        Format strictly as JSON. No markdown backticks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const parsedScenes = JSON.parse(response.text || '[]');

      const mappedScenes = parsedScenes.map((s: any) => ({
        ...s,
        id: crypto.randomUUID()
      }));

      setScenes(mappedScenes);
      onUpdateState({ ...editorState, videoScenes: mappedScenes });
      setStatus('success');
    } catch (err) {
      console.error("Storyboard Generation failed:", err);
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const generateVideoScript = async () => {
    const apiKey = getApiKey('paid');
    if (!apiKey) {
      alert("API KEY MISSING. PLEASE CHECK SETTINGS.");
      return;
    }

    setIsGeneratingScript(true);
    setStatus('idle');

    try {
      const ai = new GoogleGenAI({ apiKey });

      const sceneDetails = scenes.map((s, i) => `
        Scene ${i + 1}: 
        Visual Direction: ${s.prompt}
        Product Asset: ${s.productAsset ? 'Included (Visual Asset Provided)' : 'Not Provided'}
      `).join('\n');

      const prompt = `
        As a world-class Film Director and Script Architect, generate a detailed, professional video storyboard script based on the following parameters:
        
        PRODUCTION GOAL: ${editorState.scenePrompt}
        CINEMATIC STYLE: ${editorState.style}
        LIGHTING SCHEME: ${editorState.lighting}
        MASTER ASSETS: ${editorState.assetPrompt}
        BRAND LOGO: ${editorState.brandLogoAsset ? 'Provided' : 'None'}
        COMPANY LOGO: ${editorState.companyLogoAsset ? 'Provided' : 'None'}
        CHARACTER: ${editorState.characterAsset ? 'Provided' : 'None'}
        CI PDF: ${editorState.ciPdfAsset ? 'Provided' : 'None'}
        CI SUMMARY: ${editorState.ciSummary || 'None'}
        TOTAL DURATION: ${editorState.videoDuration} seconds
        
        Current Scene Breakdown Structure:
        ${sceneDetails}
        
        Requirement: Break this down into exactly 4 precise scenes.
        For each scene, provide a highly technical description including:
        1. Visual Description (detailed framing, action, and textures - incorporate the scene-specific PRODUCT ASSET if provided)
        2. Camera Motion (Technical terms: Dolly, Truck, Pan, Tilt, Pedestal, Zoom)
        3. Lens Specification (e.g., 24mm Anamorphic, 85mm Prime, 14mm Ultra-Wide)
        4. Detailed Lighting (Technical: Three-point, Rembrandt, High-key, Moody Chiaroscuro)
        5. Transition (Technical: Match Cut, J-Cut, L-Cut, Cross-Dissolve, Hard Cut)
        6. Audio & SFX Cues (Ambient beds, foley, musical stings)
        7. Exact Duration in seconds.
        
        The output must be a valid JSON object with two fields:
        "fullScript": A long, formatted strings that looks like a professional shooting script.
        "scenes": An array of 4 objects with keys: prompt, duration, cameraMotion, lensType, lighting, transitionType, audioCue.
        
        Format strictly as JSON. No markdown backticks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      const parsedScenes = result.scenes || [];
      const scriptText = result.fullScript || "";

      const mappedScenes = parsedScenes.map((s: any) => ({
        ...s,
        id: crypto.randomUUID()
      }));

      setScenes(mappedScenes);
      onUpdateState({ 
        ...editorState, 
        videoScenes: mappedScenes,
        videoScript: scriptText
      });
      setStatus('success');
    } catch (err) {
      console.error("Script Architecture failed:", err);
      setStatus('error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    setScenes(newScenes);
    onUpdateState({ ...editorState, videoScenes: newScenes });
  };

  const addScene = () => {
    const newScene: VideoScene = {
      id: crypto.randomUUID(),
      prompt: '',
      duration: 3,
      cameraMotion: 'Static',
      lensType: '35mm',
      lighting: 'Neutral',
      transitionType: 'Cut',
      productAsset: null,
      colorPalette: 'Neutral',
      theming: 'Cinematic'
    };
    const newScenes = [...scenes, newScene];
    setScenes(newScenes);
    onUpdateState({ ...editorState, videoScenes: newScenes });
  };

  const deleteScene = (id: string) => {
    const newScenes = scenes.filter(s => s.id !== id);
    setScenes(newScenes);
    onUpdateState({ ...editorState, videoScenes: newScenes });
  };

  const enhancePrompt = async (index: number) => {
    const apiKey = getApiKey('paid');
    if (!apiKey) {
      alert("API KEY MISSING.");
      return;
    }
    const scene = scenes[index];
    try {
      setIsGenerating(true);
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Refine this visual prompt for a cinematic storyboard scene. Make it more descriptive, technically sound, and inspiring while keeping the original intent. Keep it concise.
      Original: ${scene.prompt}
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      updateScene(index, { prompt: response.text || scene.prompt });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-[50px] md:h-12 flex items-center justify-between px-2 md:px-4 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors group flex items-center gap-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden xs:inline">Back</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1 md:mx-2" />
          <div className="flex items-center gap-2 md:gap-3">
             <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Video className="w-4 h-4 text-indigo-400" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/90">Storyboard</h1>
                <span className="text-[7px] md:text-[8px] text-white/30 font-mono text-ellipsis overflow-hidden whitespace-nowrap uppercase tracking-[0.2em]">Sequence Engine</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="flex lg:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/50 hover:text-white">
                {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex bg-[#0A0A0C] border border-white/10 rounded-lg p-1 mr-4">
              <button 
                onClick={() => setViewMode('visual')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === 'visual' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <Film className="w-3 h-3" /> Storyboard
              </button>
              <button 
                onClick={() => setViewMode('script')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  viewMode === 'script' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <FileText className="w-3 h-3" /> Script
              </button>
            </div>

            <button 
              onClick={simulateVideoGeneration}
              disabled={isGenerating || isPreviewing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
            >
              <MonitorPlay className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Preview</span>
            </button>
            <button 
              onClick={generateVideoScript}
              disabled={isGeneratingScript}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all",
                isGeneratingScript && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">Script</span>
            </button>
            <button 
              onClick={generateAIPrompt}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGenerating ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">AI Gen</span>
            </button>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-[50px] md:top-12 right-2 w-64 bg-[#0a0a0c]/95 border border-white/10 backdrop-blur-3xl shadow-2xl rounded-xl overflow-hidden z-[100] flex flex-col p-2 gap-1"
          >
            <div className="flex bg-[#0A0A0C] border border-white/10 rounded-lg p-1 mb-2">
              <button 
                onClick={() => { setViewMode('visual'); setMobileMenuOpen(false); }}
                className={cn(
                  "flex-1 px-2 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center",
                  viewMode === 'visual' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <Film className="w-3 h-3" /> Board
              </button>
              <button 
                onClick={() => { setViewMode('script'); setMobileMenuOpen(false); }}
                className={cn(
                  "flex-1 px-2 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-center",
                  viewMode === 'script' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <FileText className="w-3 h-3" /> Script
              </button>
            </div>
            <button 
              onClick={() => { setMobileMenuOpen(false); simulateVideoGeneration(); }}
              disabled={isGenerating || isPreviewing}
              className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              <MonitorPlay className="w-4 h-4" /> Preview
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); generateVideoScript(); }}
              disabled={isGeneratingScript}
              className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
            >
              {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Generate Script
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); generateAIPrompt(); }}
              disabled={isGenerating}
              className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-lg bg-indigo-500 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:bg-indigo-600 transition-colors"
            >
              {isGenerating ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Synapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto bg-transparent custom-scrollbar p-2 md:p-4 lg:p-8 flex flex-col items-center">
        <div className="max-w-5xl w-full mx-auto space-y-4 md:space-y-6 pb-32">
          
          {/* Asset Section */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Global Asset & CI Control Board</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Product', key: 'productAsset' },
                { label: 'Brand Logo', key: 'brandLogoAsset' },
                { label: 'Company Logo', key: 'companyLogoAsset' },
                { label: 'Character', key: 'characterAsset' },
                { label: 'CI PDF', key: 'ciPdfAsset' },
                { label: 'CI Summary', key: 'ciSummary', type: 'text' }
              ].map(asset => (
                <div key={asset.label} className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/40">{asset.label}</label>
                  {asset.type === 'text' ? (
                     <textarea value={ciSummary} onChange={(e) => { setCiSummary(e.target.value); onUpdateState({...editorState, ciSummary: e.target.value}); }} className="w-full h-16 bg-white/5 border border-white/10 rounded-lg p-2 text-xs" placeholder="Summarize brand CI..."/>
                  ) : (
                    <div className="relative group aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {editorState[asset.key] ? (
                    asset.key === 'ciPdfAsset' ? (
                        <div className="flex items-center justify-center w-full h-full text-white/50">
                            <FileText className="w-8 h-8" />
                        </div>
                    ) : (
                        <img src={editorState[asset.key]} className="object-contain w-full h-full" />
                    )
                  ) : <Plus className="w-6 h-6 text-white/20" />}
                  <input type="file" onChange={(e) => handleAssetUpload(e, asset.key)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'script' ? (
              <motion.div
                key="full-script"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-8 pb-20"
              >
                <div className="flex flex-col lg:flex-row items-start md:items-end justify-between border-b border-white/5 pb-6 gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            Official Shooting Script
                         </div>
                         <h2 className="text-xl md:text-3xl font-black tracking-tighter">Production Narrative</h2>
                      </div>
                      <p className="text-[11px] text-white/30 uppercase tracking-[0.3em] font-mono tracking-widest break-all">MASTER ARCHIVE: {editorState.style}</p>
                   </div>
                   <button 
                     onClick={() => {
                        const blob = new Blob([editorState.videoScript || ''], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `shooting_script_${Date.now()}.txt`;
                        a.click();
                     }}
                     className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
                   >
                     <Download className="w-4 h-4" /> Download TXT
                   </button>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-10 min-h-[500px]">
                   {editorState.videoScript ? (
                      <div className="prose prose-invert max-w-none">
                        <pre className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap text-white/80 font-mono tracking-tight bg-transparent p-0 border-none overflow-x-hidden">
                          {editorState.videoScript}
                        </pre>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center min-h-[400px] text-white/10 p-4 text-center">
                         <FileText className="w-16 h-16 md:w-20 md:h-20 mb-6 opacity-20" />
                         <p className="text-xs md:text-sm font-black uppercase tracking-widest max-w-sm">
                           No script architecture detected. Use the 'Script Architect' button to synthesize your production narrative.
                         </p>
                      </div>
                   )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="visual-storyboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 lg:p-6 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden lg:block">
                      Sequence Logic
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white/80">Storyboard Timeline</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Drag cards to reorder scenes</p>
                    </div>
                  </div>
                  <button onClick={addScene} className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[11px] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add Scene
                  </button>
                </div>

                <Reorder.Group axis="y" values={scenes} onReorder={handleReorder} className="space-y-6">
                   {scenes.map((scene, activeSceneIndex) => (
                      <Reorder.Item
                        key={scene.id}
                        value={scene}
                        className="w-full bg-[#0E0E11] border border-white/5 hover:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg group relative"
                      >
                         <div className="md:absolute top-6 right-6 opacity-40 group-hover:opacity-80 transition-opacity z-10 hidden md:flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg p-2 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-white/40" />
                         </div>

                         {/* Inline Card Editor */}
                         <div className="p-3 md:p-8 space-y-4 md:space-y-8">
                            <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/5 pb-4 md:pb-6 gap-4 relative">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <GripVertical className="w-3 h-3 md:hidden cursor-grab active:cursor-grabbing text-indigo-400/50" />
                                        Scene {activeSceneIndex + 1}
                                     </div>
                                  </div>
                                  <p className="text-[10px] md:text-[11px] text-white/30 uppercase tracking-[0.3em] font-mono">ID: {scene.id.split('-')[0]}</p>
                                   <div className="flex items-center gap-4 pt-2">
                                      <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Product</label>
                                      <div className="relative group w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                         {scene.productAsset ? <img src={scene.productAsset} className="object-contain w-full h-full" /> : <Plus className="w-4 h-4 text-white/20" />}
                                         <input type="file" onChange={(e) => handleSceneAssetUpload(activeSceneIndex, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                      </div>
                                      {scene.productAsset && (
                                        <button onClick={() => updateScene(activeSceneIndex, { productAsset: null })} className="text-[9px] font-black text-red-500 hover:text-red-400">REMOVE</button>
                                      )}
                                   </div>
                               </div>
                               <button onClick={() => deleteScene(scene.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors absolute top-0 right-0 md:relative md:top-auto md:right-auto">
                                 <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                               </button>
                            </div>

                            {/* Visual Direction */}
                            <div className="space-y-3 md:space-y-4">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-indigo-400">
                                     <Eye className="w-4 h-4" />
                                     <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Visual Prompt & Direction</h4>
                                  </div>
                                  <button onClick={() => enhancePrompt(activeSceneIndex)} className="text-[9px] md:text-[10px] font-black text-white/40 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                     <Sparkles className="w-3 h-3" /> Enhance with AI
                                  </button>
                               </div>
                               <textarea
                                 value={scene.prompt}
                                 onChange={(e) => updateScene(activeSceneIndex, { prompt: e.target.value })}
                                 placeholder="Describe the cinematic visual for this scene..."
                                 className="w-full h-24 md:h-32 bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 text-xs md:text-sm text-white/90 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none leading-relaxed outline-none"
                               />
                            </div>

                            {/* Pro Controls Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                               <div className="space-y-2 md:space-y-3">
                                  <label className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest"><Camera className="w-3 h-3" /> <span className="hidden md:inline">Camera</span> Motion</label>
                                  <select value={scene.cameraMotion} onChange={(e) => updateScene(activeSceneIndex, { cameraMotion: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-[11px] font-bold text-white/80 focus:border-indigo-500 outline-none text-ellipsis">
                                     {CAMERA_MOTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                               </div>

                               <div className="space-y-2 md:space-y-3">
                                  <label className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest"><Focus className="w-3 h-3" /> Lens Type</label>
                                  <select value={scene.lensType} onChange={(e) => updateScene(activeSceneIndex, { lensType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-[11px] font-bold text-white/80 focus:border-indigo-500 outline-none text-ellipsis">
                                     {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                                  </select>
                               </div>

                               <div className="space-y-2 md:space-y-3">
                                  <label className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest"><Zap className="w-3 h-3" /> Duration <span className="hidden md:inline">(Sec)</span></label>
                                  <div className="flex items-center gap-2 md:gap-4 bg-white/5 border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-2.5">
                                    <input type="range" min="0.5" max="15" step="0.5" value={scene.duration} onChange={(e) => updateScene(activeSceneIndex, { duration: parseFloat(e.target.value) })} className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                                    <div className="flex items-center gap-1 border-l border-white/10 pl-2 md:pl-3 w-10 md:w-14 shrink-0">
                                      <input type="number" min="0.5" max="60" step="0.5" value={scene.duration} onChange={(e) => { const val = Math.max(0.5, parseFloat(e.target.value) || 0); updateScene(activeSceneIndex, { duration: val }); }} className="w-full bg-transparent text-[10px] md:text-[11px] font-bold text-indigo-400 focus:outline-none" />
                                    </div>
                                  </div>
                               </div>

                               <div className="space-y-2 md:space-y-3">
                                  <label className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest"><MonitorPlay className="w-3 h-3" /> Transition</label>
                                  <select value={scene.transitionType} onChange={(e) => updateScene(activeSceneIndex, { transitionType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-[11px] font-bold text-white/80 focus:border-indigo-500 outline-none text-ellipsis">
                                     {TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                               </div>
                            </div>

                            {/* Secondary Logic */}
                            <div className="grid grid-cols-2 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-white/5">
                               <div className="space-y-2 md:space-y-4">
                                  <div className="flex items-center gap-2 text-amber-400">
                                     <Zap className="w-3 h-3" />
                                     <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Lighting Design</span>
                                  </div>
                                  <input type="text" value={scene.lighting || ''} onChange={(e) => updateScene(activeSceneIndex, { lighting: e.target.value })} placeholder="e.g., God rays through dust..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 md:px-4 md:py-4 text-[10px] md:text-xs font-medium text-white/80 outline-none focus:border-amber-500/50 transition-colors" />
                               </div>

                               <div className="space-y-2 md:space-y-4">
                                  <div className="flex items-center gap-2 text-indigo-400">
                                     <Play className="w-3 h-3" />
                                     <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Audio & SFX</span>
                                  </div>
                                  <input type="text" value={scene.audioCue || ''} onChange={(e) => updateScene(activeSceneIndex, { audioCue: e.target.value })} placeholder="e.g., Deep sub-bass swell..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 md:px-4 md:py-4 text-[10px] md:text-xs font-medium text-white/80 outline-none focus:border-indigo-500/50 transition-colors" />
                               </div>
                            </div>
                         </div>
                      </Reorder.Item>
                   ))}
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Preview Overlay */}
          <AnimatePresence>
            {isPreviewing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
              >
                <div className="w-full max-w-5xl aspect-video bg-[#0A0A0C] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                  {/* Preview Header */}
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <MonitorPlay className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest">Cinematic Master Preview</h3>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-widest uppercase">
                          <span className="text-indigo-400">Status:</span> 
                          {previewUrl ? 'Render Complete' : `Synthesizing Neural Sequence (${Math.round(previewProgress)}%)`}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setIsPreviewing(false);
                        setPreviewUrl(null);
                      }}
                      className="p-3 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Preview Body */}
                  <div className="flex-1 relative flex items-center justify-center bg-black group">
                    {!previewUrl ? (
                      <div className="flex flex-col items-center gap-8">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                          </div>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full -z-10"
                          />
                        </div>
                        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <motion.div 
                            style={{ width: `${previewProgress}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" 
                          />
                        </div>
                        <div className="space-y-2 text-center">
                           <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60 animate-pulse">Orchestrating VEO Farm Nodes</p>
                           <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Synchronizing Spatial Gradients & Temporal Flow</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video 
                          src={previewUrl} 
                          controls 
                          autoPlay 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                           <button className="p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 transition-all border border-white/10">
                              <Download className="w-5 h-5" />
                           </button>
                           <button className="p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 transition-all border border-white/10">
                              <Maximize2 className="w-5 h-5" />
                           </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Preview Footer */}
                  <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
                     <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Duration</span>
                           <span className="text-sm font-mono text-indigo-400">{scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/5 pl-8">
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Scene Count</span>
                           <span className="text-sm font-mono text-indigo-400">{scenes.length} Units</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/5 pl-8">
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Resolution</span>
                           <span className="text-sm font-mono text-fuchsia-400">4K Master (2160p)</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                           <ExternalLink className="w-4 h-4" /> Final Export Settings
                        </button>
                        <div className="flex flex-col gap-2">
                            <select className="bg-black/90 text-white text-[10px] px-3 py-2 rounded-lg border border-white/20">
                                <option>.mp4</option>
                                <option>.mov</option>
                                <option>.wmv</option>
                                <option>.avi</option>
                                <option>.avchd</option>
                                <option>.flv</option>
                                <option>.mkv</option>
                                <option>.webm</option>
                                <option>.mpg</option>
                            </select>
                            <button className="flex items-center gap-2 px-8 py-3 bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
                               Publish Sequence
                            </button>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Overlay Effects */}
      <footer className="h-8 md:h-10 border-t border-white/5 bg-black/40 backdrop-blur-md px-2 md:px-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[8px] md:text-[9px] font-black uppercase text-indigo-400 tracking-widest">Engine Live</span>
             </div>
             <div className="h-3 w-px bg-white/10" />
             <span className="text-[8px] md:text-[9px] font-mono text-white/20 uppercase tracking-widest hidden xs:inline">Total: {scenes.reduce((acc, s) => acc + s.duration, 0)}s</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
             <button className="text-[8px] md:text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                <FileText className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden xs:inline">Shoot Script</span><span className="xs:hidden">Script</span>
             </button>
             <button className="text-[8px] md:text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                <Download className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden xs:inline">PDF Storyboard</span><span className="xs:hidden">PDF</span>
             </button>
          </div>
      </footer>
    </div>
  );
}
