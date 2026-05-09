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
  const [clientDetails, setClientDetails] = useState({ name: '', company: '', industry: '' });
  const [isFinished, setIsFinished] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const synth = window.speechSynthesis;

  const introQuestions = [
    "Welcome to the JAMINI Vocal Engine. I'm your creative director today. Before we begin, please state your full name and the name of the company or client for this project.",
    "Thank you. And which industry or sector does this business operate in?"
  ];

  const questions = objective === 'logo' ? [
    "To get started, please identify the core essence of the brand. What is the 'soul' of this venture?",
    "Regarding the visual concept, what primary shapes or architectural metaphors do you feel best represent your vision?",
    "What kind of design language are we speaking here? Are you leaning towards Minimalist, Brutalist, or perhaps a more High-Tech Modern aesthetic?",
    "Let's talk about the chromatic profile. Which specific colors or tones should define your brand's presence?",
    "Finally, are there any symbolic elements or strict visual boundaries I should keep in mind during synthesis?"
  ] : objective === 'video' ? [
    "To begin, let's define the narrative arc. What is the primary objective of this cinematic sequence?",
    "Regarding the environment, where exactly does this scene unfold? Describe the spatial geometry and atmosphere for me.",
    "What's the cinematic signature we're aiming for? Think about the mood and the temporal rhythm of the piece?",
    "How should we orchestrate the lighting? Are we looking for high-key studio perfection, or something more moody and natural?",
    "And the kinetic energy—how do the subjects move and interact within the frame? Describe the flow of the action."
  ] : [
    "First, let's identify the focal point. What is the central subject that will anchor this composition?",
    "Tell me about the spatial context. In what environment or structural setting should this subject be positioned?",
    "What's your design philosophy for this piece? Impactful Brutalism, or perhaps a more refined, luxury minimalism?",
    "Regarding the lighting, how should the photons be arranged? Cinematic key lights, or a more diffused, natural radiance?",
    "And finally, the chromatic palette—what specific color frequencies should dominate the overall visual impact?"
  ];

  const allQuestions = [...introQuestions, ...questions];

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
    const greeting = allQuestions[0];
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
    
    // Pick a professional male English voice if available
    const voices = synth.getVoices();
    const maleVoice = voices.find(v => 
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel')) && 
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    
    if (maleVoice) utterance.voice = maleVoice;
    
    // Natural human-like speech parameters
    utterance.rate = 0.95;  // Slightly more measured for professional weight
    utterance.pitch = 0.85; // Lower pitch for a more masculine, authoritative tone
    utterance.volume = 1;
    
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

    if (currentQuestionIndex === 0) {
      // First intro question: Name and Company
      setClientDetails(prev => ({ ...prev, name: text.split(' and ')[0] || text, company: text.split(' for ')[1] || text.split(' and ')[1] || text }));
    } else if (currentQuestionIndex === 1) {
      // Second intro question: Industry
      setClientDetails(prev => ({ ...prev, industry: text }));
      setIsIntroDone(true);
    } else {
      // Design questions
      const questionIndex = currentQuestionIndex - introQuestions.length;
      const questionKey = questions[questionIndex].toLowerCase().replace(/[^a-z0-9]/g, '_');
      setAnswers(prev => ({ ...prev, [questionKey]: text }));
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = allQuestions[nextIndex];
      
      setMessages(prev => [...prev, { role: 'assistant', text: nextQuestion }]);
      speak(nextQuestion);
      setIsProcessing(false);
    } else {
      // Completed all questions
      setIsFinished(true);
      const finalMessage = `Excellent! I have all the information I need, ${clientDetails.name || 'sir'}. I'm now orchestrating the Vision Matrix for ${clientDetails.company || 'your project'}. One moment.`;
      setMessages(prev => [...prev, { role: 'assistant', text: finalMessage }]);
      speak(finalMessage);
      
      await finalizeGeneration({ ...answers, client_name: clientDetails.name, company_name: clientDetails.company, industry: clientDetails.industry });
    }
  };

  const finalizeGeneration = async (finalAnswers: Record<string, string>) => {
    try {
      const apiKey = getApiKey('free');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Master Creative Director Orchestrator. You are analyzing a detailed vocal intent interview for a ${objective}.
      The client is: ${finalAnswers.client_name} from ${finalAnswers.company_name} (Industry: ${finalAnswers.industry}).
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
        "lighting": "Specific Cinematic Lighting State",
        "clientInfo": {
          "name": "${finalAnswers.client_name}",
          "company": "${finalAnswers.company_name}",
          "industry": "${finalAnswers.industry}"
        }
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash-8b",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });
      
      if (response.text) {
        const generationData = JSON.parse(response.text);
        onGenerate(generationData);
      }
    } catch (error) {
      console.error("Voice assistant generation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full h-full sm:h-[85vh] sm:max-w-6xl bg-[#0F0F12] sm:rounded-[2.5rem] shadow-[0_0_100px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col lg:flex-row"
      >
        {/* Left Section: Conversation Log */}
        <div className="flex-1 flex flex-col h-[60vh] lg:h-full border-r border-white/5 order-2 lg:order-1">
          {/* Header (Desktop Only) */}
          <div className="hidden lg:flex p-6 border-b border-white/5 items-center justify-between bg-black/40 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 relative z-10">
                  <Headphones className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">JAMINI <span className="text-[10px] px-2 py-0.5 bg-indigo-500 text-white rounded-full ml-2">Vocal V4</span></h3>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar bg-[#0A0A0C]/50">
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
                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg",
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
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Visual Status & Controls (40% width on Desktop) */}
        <div className="w-full lg:w-[400px] flex flex-col h-auto lg:h-full bg-black/40 backdrop-blur-3xl border-t lg:border-t-0 border-white/10 p-6 sm:p-8 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Neural Engine Diagnostics</h4>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Client Progress Overview */}
          <div className="space-y-6 mb-auto">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <ShieldAlert className="w-4 h-4 text-indigo-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white/60 uppercase">Project Descriptor</p>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{clientDetails.company || 'Awaiting Identity...'}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-black/40 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-black text-white/20 uppercase">Lead</p>
                      <p className="text-[10px] font-bold text-indigo-400 truncate">{clientDetails.name || 'TBD'}</p>
                   </div>
                   <div className="bg-black/40 p-2 rounded-xl text-center">
                      <p className="text-[8px] font-black text-white/20 uppercase">Domain</p>
                      <p className="text-[10px] font-bold text-fuchsia-400 truncate">{clientDetails.industry || 'TBD'}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                {[
                  { icon: BrainCircuit, label: 'Neural Link', value: 'Active', color: 'text-indigo-400' },
                  { icon: Workflow, label: 'Context Buffer', value: Math.round((currentQuestionIndex / allQuestions.length) * 100) + '%', color: 'text-fuchsia-400' },
                  { icon: Cpu, label: 'Engine', value: 'Gemini 2.0', color: 'text-amber-400' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                       <stat.icon className={cn("w-4 h-4", stat.color)} />
                       <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase", stat.color)}>{stat.value}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="flex flex-col items-center gap-4 w-full">
              <AnimatePresence mode="wait">
                {(isListening || isSpeaking) ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-end gap-1 h-12"
                  >
                    {[...Array(16)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: isSpeaking ? [10, 40, 15, 35, 10] : [6, 18, 10, 15, 6],
                          opacity: isSpeaking ? [0.4, 1, 0.4] : [0.2, 0.5, 0.2]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                        className={cn("w-1 rounded-full", isSpeaking ? "bg-indigo-500" : "bg-fuchsia-500")}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="h-12 flex items-center justify-center gap-2 text-white/20">
                     <Terminal className="w-3 h-3" />
                     <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Neural Standby</span>
                  </div>
                )}
              </AnimatePresence>

              <button 
                onClick={toggleListening}
                disabled={isSpeaking || isFinished}
                className={cn(
                  "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group",
                  isListening 
                    ? "bg-fuchsia-500 text-white rotate-90 shadow-fuchsia-500/40" 
                    : "bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/40",
                  (isSpeaking || isFinished) && "opacity-20 cursor-not-allowed scale-90"
                )}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                {isListening ? (
                  <div className="absolute inset-[-10px] rounded-[2.2rem] border-2 border-fuchsia-500/30 animate-[ping_2s_infinite]" />
                ) : null}
                {isListening ? <MicOff className="w-8 h-8 -rotate-90" /> : <Mic className="w-8 h-8" />}
              </button>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 mb-2">
                  {isListening ? "Listening" : isSpeaking ? "Expressing" : "Initiate Link"}
                </div>
                <div className="flex justify-center gap-1">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className={cn("w-1 h-1 rounded-full", (isListening || isSpeaking) ? "bg-indigo-400 animate-pulse" : "bg-white/10")} style={{ animationDelay: `${i * 0.2}s` }} />
                   ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
               <button 
                 onClick={() => {
                   setMessages([{ role: 'assistant', text: allQuestions[0] }]);
                   setCurrentQuestionIndex(0);
                   setIsFinished(false);
                   speak(allQuestions[0]);
                 }}
                 className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/10 transition-all"
               >
                  <RefreshCcw className="w-3 h-3" /> Reset Session
               </button>
               <button 
                 onClick={onClose}
                 className="flex items-center justify-center gap-2 py-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[9px] font-black uppercase text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
               >
                  <X className="w-3 h-3" /> Terminate
               </button>
            </div>
          </div>
        </div>

        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-indigo-600 flex items-center justify-between z-[50]"
          >
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div>
                <p className="font-black text-white uppercase tracking-[0.2em]">{clientDetails.company || 'Project'} Matched</p>
                <p className="text-[10px] text-white/60">Synthesis in final propagation phase...</p>
              </div>
            </div>
            <button 
               onClick={onClose}
               className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
            >
              Enter Master Studio <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
