import React, { useState, useEffect } from 'react';
import { 
  Film, Sparkles, Wand2, Download, Copy, Trash2, Plus, 
  RotateCcw, Camera, MonitorPlay, FileText, Settings2,
  ChevronDown, ChevronUp, GripVertical, Check, AlertCircle,
  Zap, ArrowLeft, Play, Layers, SlidersHorizontal, Eye, Loader2,
  ExternalLink, Maximize2
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
}

interface StoryboardViewProps {
  onBack: () => void;
  editorState: any;
  getApiKey: (type: 'paid' | 'free') => string;
  onUpdateState: (newState: any) => void;
}

const LENS_TYPES = [
  '24mm Wide Angle', '35mm Narrative', '50mm Prime', '85mm Portrait', 
  '100mm Macro', 'Ana-morphic', 'Fish-eye', 'Telephoto 200mm'
];

const CAMERA_MOTIONS = [
  'Static / Lock-off', 'Slow Push-in', 'Pull-back', 'Pan Left-to-Right',
  'Tilt Up', 'Tracking Side-shot', 'Handheld Shake', 'Drone Orbit', 'Top-down',
  'Crane Up', 'Dolly Out', 'Orbit Around Subject'
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
  const isLogoMode = editorState.generationObjective === 'logo';

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
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        As a cinematic storyboard artist and director, break down the following concept into a detailed 4-scene cinematic storyboard.
        
        CONCEPT: ${editorState.scenePrompt}
        STYLE: ${editorState.style}
        LIGHTING PREFERENCE: ${editorState.lighting}
        BRAND ASSETS: ${editorState.assetPrompt}
        
        For each scene, provide:
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

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedScenes = JSON.parse(cleaned);

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
      transitionType: 'Cut'
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

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0E0E11] shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors group flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Studio</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Video className="w-4 h-4 text-indigo-400" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-xs font-black uppercase tracking-widest text-white/90">Production Storyboard</h1>
                <span className="text-[8px] text-white/30 font-mono uppercase tracking-[0.2em]">Cinematic Sequence Engine</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'success' && (
            <motion.div 
               initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full"
            >
               <Check className="w-3 h-3 text-green-400" />
               <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter">Script Sync Ready</span>
            </motion.div>
          )}
          <button 
            onClick={simulateVideoGeneration}
            disabled={isGenerating || isPreviewing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Master Preview</span>
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
            <span className="text-[10px] font-black uppercase tracking-widest">AI Storyboard Gen</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Scene List */}
        <aside className="w-80 border-r border-white/5 bg-[#0E0E11] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Sequence Logic</h3>
             <button onClick={addScene} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 transition-all">
                <Plus className="w-4 h-4" />
             </button>
          </div>
          <Reorder.Group axis="y" values={scenes} onReorder={handleReorder} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {scenes.map((scene, idx) => (
              <Reorder.Item
                key={scene.id}
                value={scene}
                onClick={() => setActiveSceneIndex(idx)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all text-left group relative overflow-hidden cursor-grab active:cursor-grabbing",
                  activeSceneIndex === idx 
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] translate-x-1" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                )}
              >
                <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                  <GripVertical className="w-3 h-3" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-black w-5 h-5 rounded flex items-center justify-center",
                      activeSceneIndex === idx ? "bg-indigo-500 text-white" : "bg-white/10 text-white/40"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-white/80 uppercase">Scene {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={scene.duration}
                      onChange={(e) => {
                        const val = Math.max(0.5, parseFloat(e.target.value) || 0);
                        updateScene(idx, { duration: val });
                      }}
                      className="w-8 bg-transparent text-[9px] font-mono text-indigo-400/60 text-right focus:text-indigo-400 focus:outline-none focus:ring-0 appearance-none border-b border-white/5 hover:border-indigo-500/30 transition-all"
                    />
                    <span className="text-[9px] font-mono text-white/20">s</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed mb-3">
                  {scene.prompt || "No visual direction set..."}
                </p>
                <div className="flex flex-wrap gap-1">
                  {scene.cameraMotion && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] font-bold text-white/30 uppercase border border-white/5 whitespace-nowrap">
                      {scene.cameraMotion}
                    </span>
                  )}
                  {scene.transitionType && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-[7px] font-bold text-indigo-400/60 uppercase border border-indigo-500/10 whitespace-nowrap">
                      {scene.transitionType}
                    </span>
                  )}
                  {scene.audioCue && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] font-bold text-white/30 uppercase border border-white/5 whitespace-nowrap flex items-center gap-1">
                      <Play className="w-1.5 h-1.5" /> {scene.audioCue}
                    </span>
                  )}
                </div>
                {activeSceneIndex === idx && (
                  <motion.div layoutId="sceneHighlight" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </aside>

        {/* Main Editor: Scene Details */}
        <section className="flex-1 bg-[#0A0A0C] overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeSceneIndex !== null && scenes[activeSceneIndex] ? (
              <motion.div
                key={scenes[activeSceneIndex].id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-12 pb-20"
              >
                {/* Scene Header */}
                <div className="flex items-end justify-between border-b border-white/5 pb-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            Pro Shot Control
                         </div>
                         <h2 className="text-3xl font-black tracking-tighter">Director's Script: Scene {activeSceneIndex + 1}</h2>
                      </div>
                      <p className="text-[11px] text-white/30 uppercase tracking-[0.3em] font-mono">ID: {scenes[activeSceneIndex].id.split('-')[0]}</p>
                   </div>
                   <button 
                      onClick={() => deleteScene(scenes[activeSceneIndex].id)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>

                {/* Visual Direction */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-indigo-400">
                      <Eye className="w-4 h-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Visual Prompt & Direction</h4>
                   </div>
                   <textarea
                     value={scenes[activeSceneIndex].prompt}
                     onChange={(e) => updateScene(activeSceneIndex, { prompt: e.target.value })}
                     placeholder="Describe the cinematic visual for this scene..."
                     className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none leading-relaxed"
                   />
                </div>

                {/* Pro Controls Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   {/* Camera Motion */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                         <Camera className="w-3 h-3" /> Camera Motion
                      </label>
                      <select 
                        value={scenes[activeSceneIndex].cameraMotion}
                        onChange={(e) => updateScene(activeSceneIndex, { cameraMotion: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-white/80 focus:border-indigo-500"
                      >
                         {CAMERA_MOTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>

                   {/* Lens Type */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                         <Focus className="w-3 h-3" /> Lens Type
                      </label>
                      <select 
                        value={scenes[activeSceneIndex].lensType}
                        onChange={(e) => updateScene(activeSceneIndex, { lensType: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-white/80 focus:border-indigo-500"
                      >
                         {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                   </div>

                   {/* Duration */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                         <Zap className="w-3 h-3" /> Duration (Sec)
                      </label>
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                        <input 
                          type="range" 
                          min="0.5"
                          max="15"
                          step="0.5"
                          value={scenes[activeSceneIndex].duration}
                          onChange={(e) => updateScene(activeSceneIndex, { duration: parseFloat(e.target.value) })}
                          className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center gap-1 border-l border-white/10 pl-3 w-14 shrink-0">
                          <input 
                            type="number" 
                            min="0.5"
                            max="60"
                            step="0.5"
                            value={scenes[activeSceneIndex].duration}
                            onChange={(e) => {
                              const val = Math.max(0.5, parseFloat(e.target.value) || 0);
                              updateScene(activeSceneIndex, { duration: val });
                            }}
                            className="w-full bg-transparent text-[11px] font-bold text-indigo-400 focus:outline-none"
                          />
                        </div>
                      </div>
                   </div>

                   {/* Transition */}
                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                         <MonitorPlay className="w-3 h-3" /> Transition
                      </label>
                      <select 
                        value={scenes[activeSceneIndex].transitionType}
                        onChange={(e) => updateScene(activeSceneIndex, { transitionType: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-white/80 focus:border-indigo-500"
                      >
                         {TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                </div>

                {/* Secondary Logic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                   {/* Lighting Cues */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-400">
                         <Zap className="w-3 h-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Lighting Design</span>
                      </div>
                      <input 
                        type="text" 
                        value={scenes[activeSceneIndex].lighting || ''}
                        onChange={(e) => updateScene(activeSceneIndex, { lighting: e.target.value })}
                        placeholder="e.g., God rays through dust, 4000K warm..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs font-medium text-white/80"
                      />
                   </div>

                   {/* Audio / FX Cues */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400">
                         <Play className="w-3 h-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Audio & SFX Cues</span>
                      </div>
                      <input 
                        type="text" 
                        value={scenes[activeSceneIndex].audioCue || ''}
                        onChange={(e) => updateScene(activeSceneIndex, { audioCue: e.target.value })}
                        placeholder="e.g., Deep sub-bass swell, mechanical click..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs font-medium text-white/80"
                      />
                   </div>
                </div>

                {/* Pro Ability Matrix */}
                <div className="bg-indigo-500/5 rounded-3xl p-8 border border-indigo-500/10 mb-8">
                   <div className="flex items-center gap-2 mb-6">
                      <Wand2 className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-black uppercase tracking-widest">Pro Scene Capabilities</h3>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Auto-Exposure Lock', active: true },
                        { label: 'Dynamic Focus Tracking', active: true },
                        { label: 'Temporal Smoothing', active: false },
                        { label: 'Global Illumination Sync', active: true },
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border border-white/5">
                           <div className={cn("w-1.5 h-1.5 rounded-full", feature.active ? "bg-indigo-400 animate-pulse" : "bg-white/10")} />
                           <span className="text-[9px] font-bold text-white/40 uppercase whitespace-nowrap">{feature.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-4">
                <Film className="w-12 h-12" />
                <p className="text-sm font-bold uppercase tracking-widest">Select a scene to direct</p>
              </div>
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
                        <button className="flex items-center gap-2 px-8 py-3 bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
                           Publish Sequence
                        </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer / Overlay Effects */}
      <footer className="h-12 border-t border-white/5 bg-[#0E0E11] px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Engine Live</span>
             </div>
             <div className="h-3 w-px bg-white/10" />
             <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Total Duration: {scenes.reduce((acc, s) => acc + s.duration, 0)}s</span>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Export Shooting Script
             </button>
             <button className="text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                <Download className="w-3 h-3" /> Batch PDF Storyboard
             </button>
          </div>
      </footer>
    </div>
  );
}
