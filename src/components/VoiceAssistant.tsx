import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
   Mic, 
   MicOff, 
   Volume2, 
   VolumeX, 
   X, 
   Sparkles, 
   Loader2, 
   MessageSquare,
  RefreshCcw,
  ArrowRight,
  BrainCircuit,
  Headphones,
  CheckCircle2,
  Signal,
  Workflow,
  Cpu,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface VoiceAssistantProps {
  onClose: () => void;
  getApiKey: (type: 'paid' | 'free') => string;
  onGenerate: (data: any) => void;
  objective: 'logo' | 'poster' | 'video';
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose, getApiKey, onGenerate, objective }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const synth = window.speechSynthesis;

  const questions = objective === 'logo' ? [
    "Identify your brand. What is the official name and the 'soul' of this venture?",
    "Describe the core architectural concept. What primitive shapes or complex metaphors define you?",
    "Define the visual vocabulary. Minimalist, Brutalist, Organic, or High-Tech Modern?",
    "Orchestrate the color spectrum. Which primary and secondary hex-ranges represent your legacy?",
    "Symbolic constraints. Are there sacred shapes, specific ligatures, or forbidden visual elements?"
  ] : objective === 'video' ? [
    "Define the narrative arc. What is the primary objective of this cinematic sequence?",
    "Environmental coordinates. Where does this story unfold? Describe the spatial geometry.",
    "Cinematic signature. What mood or temporal rhythm are we aiming for?",
    "Lighting orchestration. High-key studio, noir shadows, or natural golden-hour luminescence?",
    "Subject interaction. How do the assets move within the frame? Describe the kinetic energy."
  ] : [
    "Identify the master subject. What is the gravitational center of this poster?",
    "Spatial context. In what environment or structural setting should this subject exist?",
    "Design philosophy. Brutalist impact, vaporwave aesthetics, or high-end luxury minimalism?",
    "Photon arrangement. Cinematic key lighting, neon diffusion, or raw natural sunlight?",
    "Chromatic palette. What specific color frequencies should dominate the composition?"
  ];

  const analysisSteps = [
    "Calibrating Neural Synthesis...",
    "Scanning Brand Architecture...",
    "Harmonizing Color Frequencies...",
    "Deconstructing Spatial Geometry...",
    "Orchestrating Kinetic Flow...",
    "Finalizing Master Manifest..."
  ];

  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    if (isProcessing && isFinished) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % analysisSteps.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isProcessing, isFinished]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleUserResponse(transcript);
        }
      };

      setRecognition(recognitionInstance);
    }

    // Initial Greeting
    const greeting = `Hello! I'm your JAMINI AI voice assistant. I'll help you design your ${objective}. First, ${questions[0]}`;
    setMessages([{ role: 'assistant', text: greeting }]);
    speak(greeting);

    return () => {
      synth.cancel();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text: string) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Pick a good voice if available
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || voices[0];
    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    synth.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  const handleUserResponse = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTranscript('');
    setIsProcessing(true);

    const questionKey = questions[currentQuestionIndex].toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newAnswers = { ...answers, [questionKey]: text };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      
      setMessages(prev => [...prev, { role: 'assistant', text: nextQuestion }]);
      speak(nextQuestion);
      setIsProcessing(false);
    } else {
      // Completed all questions
      setIsFinished(true);
      const finalMessage = "Excellent! I have all the information I need to synthesize your masterpiece. One moment while I orchestrate the Vision Matrix.";
      setMessages(prev => [...prev, { role: 'assistant', text: finalMessage }]);
      speak(finalMessage);
      
      await finalizeGeneration(newAnswers);
    }
  };

  const finalizeGeneration = async (finalAnswers: Record<string, string>) => {
    try {
      const apiKey = getApiKey('free');
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

      const prompt = `You are a Master Creative Director Orchestrator. You are analyzing a detailed vocal intent interview for a ${objective}.
      Your mission is to synthesize these raw vocal signals into a master-class image generation prompt.
      
      [VOCAL INTENT LOGS]
      ${Object.entries(finalAnswers).map(([q, a]) => `INTENT_${q.toUpperCase()}: ${a}`).join('\n')}
      
      [DESIGN DIRECTIVE]
      - Be hyper-specific about materials: Anodized aluminum, brushed titanium, recycled polymers, bioluminescent moss, etc.
      - Be precise about lighting: Ray-traced global illumination, volumetric god-rays, 8000K clinical white, or warm 2700K amber glow.
      - Mention camera settings: 85mm prime lens, f/1.8 depth of field, tilt-shift perspective, or high-angle brutalist shot.
      
      Return a strictly formatted JSON object:
      {
        "scenePrompt": "Detailed environmental/architectural masterpiece prompt. Focus on geometry, atmosphere, and spatial depth.",
        "assetPrompt": "Master-class instruction for how products/subjects manifest and interact within this specific scene. Focus on textures, physics, and scale.",
        "style": "Specific Visual Style (e.g., Ultra-Luxe Minimal, Cyber-Brutalist, Ethereal Organic, High-Fashion Studio)",
        "lighting": "Specific Cinematic Lighting State"
      }`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const generationData = JSON.parse(jsonMatch[0]);
        onGenerate(generationData);
      }
    } catch (error) {
      console.error("Voice assistant generation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#0F0F12] border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 relative z-10">
                <Headphones className="w-6 h-6 text-indigo-400" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-500 blur-xl rounded-full -z-0"
              />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                JAMINI <span className="text-[10px] px-2 py-0.5 bg-indigo-500 text-white rounded-full tracking-tighter">Vocal Engine 4.0</span>
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSpeaking ? "bg-indigo-400" : isListening ? "bg-fuchsia-400" : "bg-white/20")} />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                    {isSpeaking ? "Neural Audio Stream Active" : isListening ? "Listening For Intent" : "Standby Mode"}
                  </span>
                </div>
                <div className="h-2 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                   <Signal className="w-2.5 h-2.5 text-emerald-500" />
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Signal: Optimal</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Session Logic ID</span>
               <span className="text-[9px] font-mono text-indigo-400/60 tracking-tighter">X-9942-B-ASSIST</span>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all border border-transparent hover:border-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Neural Dashboard (New) */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <div className="flex items-center gap-6">
              {[
                { icon: BrainCircuit, label: 'Neural Link', value: 'Active', color: 'text-indigo-400' },
                { icon: Workflow, label: 'Context Buffer', value: Math.round((currentQuestionIndex / questions.length) * 100) + '%', color: 'text-fuchsia-400' },
                { icon: Cpu, label: 'Engine', value: 'Gemini 2.0', color: 'text-amber-400' }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                   <stat.icon className={cn("w-3 h-3", stat.color)} />
                   <div className="flex flex-col">
                      <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
                      <span className={cn("text-[8px] font-bold uppercase", stat.color)}>{stat.value}</span>
                   </div>
                </div>
              ))}
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Low Latency</span>
           </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'assistant' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'assistant' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30"
                )}>
                  {msg.role === 'assistant' ? <BrainCircuit className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'assistant' ? "bg-white/5 text-white/80 rounded-tl-none border border-white/5" : "bg-fuchsia-500/10 text-white rounded-tr-none border border-fuchsia-500/20"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex flex-col gap-3 px-12">
              <div className="flex items-center gap-3 text-indigo-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                <Loader2 className="w-3 h-3 animate-spin" /> 
                {isFinished ? analysisSteps[analysisStep] : "Orchestrating Logic..."}
              </div>
              {isFinished && (
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-8 bg-black/60 border-t border-white/10 flex flex-col items-center gap-8 relative overflow-hidden">
          {/* Neural Waveform Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)]" />
          </div>

          <div className="flex flex-col items-center gap-4 relative z-10 w-full">
            <AnimatePresence mode="wait">
              {(isListening || isSpeaking) ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-end gap-1.5 h-12"
                >
                  {[...Array(32)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: isSpeaking ? [12, 48, 20, 40, 12] : [8, 24, 12, 20, 8],
                        opacity: isSpeaking ? [0.4, 1, 0.4] : [0.2, 0.5, 0.2]
                      }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.05,
                        ease: "linear"
                      }}
                      className={cn(
                        "w-1 rounded-full",
                        isSpeaking ? "bg-indigo-500" : "bg-fuchsia-500"
                      )}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-12 flex items-center justify-center gap-3 text-white/20"
                >
                   <Terminal className="w-4 h-4" />
                   <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Awaiting Vocal Signal</span>
                </motion.div>
              )}
            </AnimatePresence>

            {transcript && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center italic text-white/60 text-sm max-w-lg bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md"
              >
                <span className="text-[10px] font-black text-indigo-400 not-italic mr-2 uppercase">Input:</span>
                "{transcript}"
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-12 relative z-10">
            <div className="flex flex-col items-center gap-2">
               <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Voice Synthesis</span>
               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <Volume2 className="w-4 h-4" />
               </div>
            </div>

            <button 
              onClick={toggleListening}
              disabled={isSpeaking || isFinished}
              className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group",
                isListening 
                  ? "bg-fuchsia-500 text-white rotate-90 shadow-fuchsia-500/40" 
                  : "bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/40",
                (isSpeaking || isFinished) && "opacity-20 cursor-not-allowed scale-90"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
              {isListening ? (
                <div className="absolute inset-[-12px] rounded-[2.5rem] border-2 border-fuchsia-500/30 animate-[ping_2s_infinite]" />
              ) : null}
              {isListening ? <MicOff className="w-10 h-10 -rotate-90" /> : <Mic className="w-10 h-10" />}
            </button>

            <div className="flex flex-col items-center gap-2">
               <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Logic Reset</span>
               <button 
                 onClick={() => {
                   setMessages([]);
                   setCurrentQuestionIndex(0);
                 }}
                 className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
               >
                  <RefreshCcw className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">
              {isListening ? "Transmission Active" : isSpeaking ? "Neural Sync in Progress" : "Initiate Vocal Link"}
            </div>
            <div className="flex gap-1">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className={cn("w-1 h-1 rounded-full", (isListening || isSpeaking) ? "bg-indigo-400 animate-pulse" : "bg-white/10")} style={{ animationDelay: `${i * 0.2}s` }} />
               ))}
            </div>
          </div>
        </div>

        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-0 p-8 bg-indigo-600 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white" />
              <div>
                <p className="font-black text-white uppercase tracking-widest">Interview Complete</p>
                <p className="text-xs text-white/60">Finalizing synthesis parameters...</p>
              </div>
            </div>
            <button 
               onClick={onClose}
               className="bg-white text-indigo-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Launch Studio <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
