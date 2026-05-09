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
import { GoogleGenAI, Modality } from "@google/genai";
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

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
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = async (text: string) => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
    }
    
    setIsSpeaking(true);
    
    try {
      const apiKey = getApiKey('free');
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say this in a professional, slightly authoritative yet friendly creative director voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
          currentSourceRef.current = null;
        };
        
        currentSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-6 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full h-[100dvh] lg:h-[85vh] lg:max-w-7xl bg-[#0B0B0E] lg:rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col lg:flex-row border border-white/5"
      >
        {/* Left Section: Conversation Log */}
        <div className="flex-1 flex flex-col h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/5 order-2 lg:order-1 bg-[#050507]">
          {/* Header (Desktop Only) */}
          <div className="hidden lg:flex p-8 border-b border-white/5 items-center justify-between bg-black/40">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Headphones className="w-7 h-7 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest text-white leading-none">JAMINI <span className="text-xs px-3 py-1 bg-indigo-500 text-white rounded-full ml-3">CORE V4</span></h3>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 lg:p-10 space-y-4 lg:space-y-8 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-start gap-3 lg:gap-5",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    msg.role === 'assistant' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"
                  )}>
                    {msg.role === 'assistant' ? <BrainCircuit className="w-4 h-4 lg:w-5 lg:h-5" /> : <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-4 lg:p-6 rounded-2xl text-xs lg:text-base leading-relaxed tracking-wide shadow-2xl",
                    msg.role === 'assistant' ? "bg-white/[0.03] text-white/90 border border-white/5" : "bg-fuchsia-500/10 text-white border border-fuchsia-500/20"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isProcessing && (
              <div className="flex flex-col gap-3 px-12">
                <div className="flex items-center gap-3 text-indigo-400 font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.3em]">
                  <Loader2 className="w-3 h-3 animate-spin" /> 
                  {isFinished ? analysisSteps[analysisStep] : "Processor Online..."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Diagnostics & Controls */}
        <div className="w-full lg:w-[450px] flex flex-col h-auto lg:h-full bg-black/50 backdrop-blur-3xl p-5 lg:p-10 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <div className="lg:hidden flex items-center gap-3">
               <Headphones className="w-5 h-5 text-indigo-400" />
               <h4 className="text-xs font-black text-white/60 uppercase tracking-widest">JAMINI VOICE</h4>
            </div>
            <h4 className="hidden lg:block text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">System Diagnostics</h4>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
              <X className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>

          <div className="space-y-4 lg:space-y-8 mb-auto">
             <div className="bg-white/5 border border-white/10 rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-8">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 ring-4 ring-indigo-500/5">
                      <ShieldAlert className="w-5 h-5 lg:w-7 lg:h-7 text-indigo-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[8px] lg:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Active Descriptor</p>
                      <p className="text-base lg:text-xl font-black text-white truncate">{clientDetails.company || 'Initializing...'}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-black/60 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 space-y-1">
                      <p className="text-[7px] lg:text-[9px] font-black text-white/20 uppercase tracking-widest">Creative Lead</p>
                      <p className="text-[10px] lg:text-xs font-bold text-indigo-400 truncate tracking-tight">{clientDetails.name || 'TBD'}</p>
                   </div>
                   <div className="bg-black/60 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 space-y-1">
                      <p className="text-[7px] lg:text-[9px] font-black text-white/20 uppercase tracking-widest">Sector Domain</p>
                      <p className="text-[10px] lg:text-xs font-bold text-fuchsia-400 truncate tracking-tight">{clientDetails.industry || 'TBD'}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-3 lg:space-y-4 hidden sm:block">
                {[
                  { icon: BrainCircuit, label: 'Neural Link', value: 'Prime', color: 'text-indigo-400' },
                  { icon: Workflow, label: 'Logic Sync', value: Math.round((currentQuestionIndex / allQuestions.length) * 100) + '%', color: 'text-fuchsia-400' },
                  { icon: Cpu, label: 'Compute Engine', value: 'Titan v4', color: 'text-amber-400' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                       <stat.icon className={cn("w-4 h-4 lg:w-5 lg:h-5", stat.color)} />
                       <span className="text-[9px] lg:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</span>
                    </div>
                    <span className={cn("text-[10px] lg:text-xs font-bold uppercase tracking-widest leading-none", stat.color)}>{stat.value}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex flex-col items-center gap-6 lg:gap-10 mt-6 lg:mt-12">
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="h-12 lg:h-16 flex items-end gap-1 px-4">
                <AnimatePresence mode="wait">
                  {(isListening || isSpeaking) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-1.5 h-full">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: isSpeaking ? [12, 48, 20, 44, 12] : [8, 24, 12, 20, 8],
                            opacity: isSpeaking ? [0.4, 1, 0.4] : [0.2, 0.5, 0.2]
                          }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.04 }}
                          className={cn("w-1 lg:w-1.5 rounded-full shadow-[0_0_10px_currentColor]", isSpeaking ? "bg-indigo-500 text-indigo-500" : "bg-fuchsia-500 text-fuchsia-500")}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-3 text-white/10">
                       <Terminal className="w-4 h-4" />
                       <span className="text-[10px] lg:text-xs font-mono uppercase tracking-[0.5em]">Standby</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={toggleListening}
                disabled={isSpeaking || isFinished}
                className={cn(
                  "w-16 h-16 lg:w-28 lg:h-28 rounded-[2rem] lg:rounded-[3rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group ring-8 ring-white/0 hover:ring-white/5 active:ring-white/10",
                  isListening 
                    ? "bg-fuchsia-500 text-white rotate-90 shadow-fuchsia-500/50 scale-110" 
                    : "bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-600/50",
                  (isSpeaking || isFinished) && "opacity-20 cursor-not-allowed scale-90"
                )}
              >
                {isListening && (
                  <div className="absolute inset-[-15px] rounded-[3rem] border-2 border-fuchsia-500/40 animate-[ping_2.5s_infinite]" />
                )}
                {isListening ? <MicOff className="w-8 h-8 lg:w-12 lg:h-12 -rotate-90" /> : <Mic className="w-8 h-8 lg:w-12 lg:h-12" />}
              </button>

              <div className="text-center space-y-2">
                <div className="text-[10px] lg:text-xs font-black uppercase tracking-[0.6em] text-white/25">
                  {isListening ? "Transmission" : isSpeaking ? "Orchestrating" : "Voice Link"}
                </div>
                <div className="flex justify-center gap-1.5">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className={cn("w-1.5 h-1.5 rounded-full shadow-lg", (isListening || isSpeaking) ? "bg-indigo-400 animate-bounce" : "bg-white/10")} style={{ animationDelay: `${i * 0.15}s` }} />
                   ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
               <button 
                 onClick={() => {
                   setMessages([{ role: 'assistant', text: allQuestions[0] }]);
                   setCurrentQuestionIndex(0);
                   setIsFinished(false);
                   speak(allQuestions[0]);
                 }}
                 className="flex items-center justify-center gap-3 py-4 lg:py-5 bg-white/5 border border-white/5 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
               >
                  <RefreshCcw className="w-3 h-3 lg:w-4 lg:h-4 group-hover:rotate-180 transition-transform duration-500" /> Reset Session
               </button>
               <button 
                 onClick={onClose}
                 className="flex items-center justify-center gap-3 py-4 lg:py-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
               >
                  <X className="w-3 h-3 lg:w-4 lg:h-4" /> Terminate
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
