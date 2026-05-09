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
  CheckCircle2
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
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Headphones className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white">JAMINI Assistant</h3>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSpeaking ? "bg-indigo-400" : isListening ? "bg-fuchsia-400" : "bg-white/20")} />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {isSpeaking ? "Speaking" : isListening ? "Listening" : "Ready"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
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
        <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col items-center gap-6">
          {/* Waveform Animation */}
          {(isListening || isSpeaking) && (
            <div className="flex items-end gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isSpeaking ? [8, 32, 12, 28, 8] : [8, 20, 10, 24, 8],
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-1 rounded-full",
                    isSpeaking ? "bg-indigo-500" : "bg-fuchsia-500"
                  )}
                />
              ))}
            </div>
          )}

          {transcript && (
            <div className="text-center italic text-white/40 text-sm max-w-md animate-pulse">
              "{transcript}"
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleListening}
              disabled={isSpeaking || isFinished}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group",
                isListening 
                  ? "bg-fuchsia-500 text-white scale-110 shadow-fuchsia-500/40" 
                  : "bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/40",
                (isSpeaking || isFinished) && "opacity-20 cursor-not-allowed scale-90"
              )}
            >
              {isListening ? <div className="absolute inset-0 rounded-full border-4 border-fuchsia-400 animate-ping opacity-30" /> : null}
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            {isListening ? "Listening to your vision" : "Tap to speak"}
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
