import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Mic, 
  Settings, 
  Sparkles, 
  Zap, 
  History, 
  ArrowRight,
  User,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const JaminiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi there. I'm Jamini. I've been refining my processors to be a bit more... human today. How can I help you create something remarkable?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSpeechTime, setLastSpeechTime] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const voiceModeRef = useRef(isVoiceMode);
  const streamingRef = useRef(isStreaming);

  useEffect(() => { voiceModeRef.current = isVoiceMode; }, [isVoiceMode]);
  useEffect(() => { streamingRef.current = isStreaming; }, [isStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);

  // Init Speech Recognition Once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setInput(prev => prev + transcript + ' ');
            }
          }
          setLastSpeechTime(Date.now());
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') setIsVoiceMode(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // Auto restart if voice mode is ON and assistant is NOT streaming
          if (voiceModeRef.current && !streamingRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
                setIsListening(true);
              } catch (e) {}
            }, 100);
          }
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Handle Voice Mode toggling & Streaming pauses
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isVoiceMode && !isStreaming) {
      if (!isListening) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {}
      }
    } else {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      }
    }
  }, [isVoiceMode, isStreaming, isListening]);

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setCurrentResponse('');
    setLastSpeechTime(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let accumulatedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              accumulatedText += parsed.text;
              setCurrentResponse(accumulatedText);
            } catch {
              // Handle partial JSON or non-JSON
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: accumulatedText,
        timestamp: new Date()
      }]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I hit a slight snag in my neural link. Could you try that again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle Auto Send
  const handleSendRef = useRef(handleSend);
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  useEffect(() => {
    if (!isVoiceMode || isStreaming || !input.trim() || !lastSpeechTime) return;
    
    const timeout = setTimeout(() => {
      handleSendRef.current();
    }, 1500); // 1.5 seconds of silence = send message automatically
    
    return () => clearTimeout(timeout);
  }, [input, lastSpeechTime, isVoiceMode, isStreaming]);

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0e] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-500 animate-gradient-xy p-[1px]">
              <div className="w-full h-full rounded-full bg-[#0c0c0e] flex items-center justify-center overflow-hidden">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0c0c0e]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white/90">Meet Jamini</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Neural Assistant Alpha</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <History className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-12">
          <AnimatePresence initial={false}>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex gap-6",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full shrink-0 flex items-center justify-center border",
                  message.role === 'user' ? "bg-white/5 border-white/10" : "bg-indigo-500/10 border-indigo-500/20"
                )}>
                  {message.role === 'user' ? <User className="w-4 h-4 text-white/60" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                </div>
                
                <div className={cn(
                  "flex flex-col gap-1",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-2xl px-1 py-1 text-[15px] leading-relaxed",
                    message.role === 'user' ? "text-white/80" : "text-white/90"
                  )}>
                    {message.content}
                  </div>
                  <span className="text-[10px] text-white/20 mt-1 uppercase tracking-tight font-medium">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {currentResponse && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6 flex-row"
              >
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="max-w-2xl px-1 py-1 text-[15px] leading-relaxed text-white/95">
                  {currentResponse}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 align-middle"
                  />
                </div>
              </motion.div>
            )}

            {isStreaming && !currentResponse && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6 flex-row items-center"
              >
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex gap-1.5 px-2 py-3 bg-white/5 rounded-2xl rounded-tl-sm text-white/50 text-[13px] items-center">
                  <span className="opacity-70">Jamini is thinking</span>
                  <div className="flex gap-1 ml-1 items-center">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1 h-1 rounded-full bg-indigo-400" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 h-1 rounded-full bg-indigo-400" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 h-1 rounded-full bg-indigo-400" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Bar */}
      <footer className="p-6">
        <div className="max-w-3xl mx-auto relative group">
          {/* Subtle Glow Background */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-[#1a1a1e] border border-white/10 rounded-2xl flex items-end p-2 pr-3 shadow-2xl focus-within:border-indigo-500/50 transition-all duration-300">
            <button className="p-3 text-white/30 hover:text-indigo-400 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Jamini anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 resize-none max-h-48 min-h-[44px] placeholder:text-white/20"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            
            <div className="flex items-center gap-1.5 mb-1.5">
              <button 
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  input.trim() 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500" 
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              
              <button 
                className={cn(
                  "p-2.5 transition-colors rounded-xl",
                  isVoiceMode ? "text-red-400 bg-red-500/10 hover:text-red-300 hover:bg-red-500/20" : "text-white/30 hover:text-white/60 hover:bg-white/5"
                )}
                onClick={toggleVoiceMode}
              >
                <div className="relative">
                  <Mic className="w-5 h-5" />
                  {isListening && (
                    <motion.span
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-red-500 rounded-full"
                    />
                  )}
                </div>
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-6 px-4">
             <div className="flex items-center gap-1.5 text-[10px] text-white/20 uppercase tracking-widest font-bold">
               <Zap className="w-3 h-3 text-amber-500/50" />
               High Speed Link
             </div>
             <div className="flex items-center gap-1.5 text-[10px] text-white/20 uppercase tracking-widest font-bold">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
               Stable Interface
             </div>
             <div className={cn(
               "flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors",
               isVoiceMode ? "text-red-400/80" : "text-white/20"
             )}>
               <span className={cn(
                 "w-1.5 h-1.5 rounded-full transition-all duration-300", 
                 isVoiceMode ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-white/10"
               )} />
               {isVoiceMode ? "Live Interaction" : "Push to Talk"}
             </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 15s ease infinite;
        }
        main::-webkit-scrollbar {
          width: 6px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />
    </div>
  );
};
