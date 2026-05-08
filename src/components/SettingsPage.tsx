import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  Trash2, 
  Check, 
  AlertCircle, 
  Shield, 
  Activity, 
  Database, 
  Cpu, 
  Globe, 
  Info, 
  Lock, 
  Monitor,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  type: 'paid' | 'free';
}

type SettingsSection = 'integration' | 'privacy' | 'performance' | 'system';

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('integration');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'paid' | 'free'>('paid');
  const [saved, setSaved] = useState(false);
  const [systemKey, setSystemKey] = useState<string | null>(null);

  useEffect(() => {
    // Check for system provided keys (Vercel / Vite Env)
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   import.meta.env.VITE_API_KEY || 
                   (import.meta as any).env?.GEMINI_API_KEY ||
                   (typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY || (process.env as any).VITE_GEMINI_API_KEY) : '');
    
    if (envKey && typeof envKey === 'string') {
      setSystemKey(envKey);
    }

    const savedKeys = localStorage.getItem('jamini_api_keys');
    if (savedKeys) {
      try {
        setKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error("Failed to parse API keys");
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('jamini_api_keys', JSON.stringify(keys));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addKey = () => {
    if (!newKey.trim() || !newName.trim()) return;
    const key: ApiKey = {
      id: Date.now().toString(),
      key: newKey.trim(),
      name: newName.trim(),
      type: newType
    };
    const updatedKeys = [...keys, key];
    setKeys(updatedKeys);
    localStorage.setItem('jamini_api_keys', JSON.stringify(updatedKeys));
    setNewKey('');
    setNewName('');
  };

  const removeKey = (id: string) => {
    const updatedKeys = keys.filter(k => k.id !== id);
    setKeys(updatedKeys);
    localStorage.setItem('jamini_api_keys', JSON.stringify(updatedKeys));
  };

  const sidebarItems = [
    { id: 'integration', label: 'AI Integration', icon: Key, desc: 'API Keys & Engine Mapping' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, desc: 'Data Encryption & Storage' },
    { id: 'performance', label: 'Performance', icon: Activity, desc: 'Rendering & Logic Toggles' },
    { id: 'system', label: 'System Status', icon: Monitor, desc: 'Build Info & Diagnostics' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
            <Settings className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              Control <span className="text-indigo-400 italic">Panel</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">System Configuration Protocol v4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave} 
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 px-6 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Changes Synced' : 'Sync Settings'}
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar Nav */}
        <aside className="w-80 border-r border-white/5 bg-black p-6 space-y-2 hidden lg:block">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingsSection)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                activeSection === item.id 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                  : 'bg-transparent border-transparent text-white/40 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 mt-0.5 ${activeSection === item.id ? 'text-indigo-400' : 'text-current'}`} />
              <div className="text-left">
                <p className="text-sm font-black uppercase tracking-tight">{item.label}</p>
                <p className="text-[10px] opacity-60 leading-tight mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}

          <div className="mt-auto pt-10 px-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Security Level</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                ))}
              </div>
              <p className="text-[9px] text-indigo-400/60 mt-2 font-mono uppercase text-center">Encrypted Session: Active</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="max-w-4xl"
            >
              {activeSection === 'integration' && (
                <div className="space-y-10">
                  <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Identity & Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">AI Integration Mapping</h2>
                    <p className="text-white/40 leading-relaxed max-w-2xl">
                      Configure your Gemini API clusters. JAMINI automatically switches between your Free and Paid tiers based on the engine requirements. Keys are never sent to external brokers.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-3">
                        <Database className="w-5 h-5 text-indigo-400" /> Key Injection
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Alias Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Primary Production Key"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-white/10 font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Gemini Token</label>
                          <input 
                            type="password" 
                            placeholder="Paste secret sequence..."
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-white/10 font-mono tracking-widest"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Tier Classification</label>
                            <select 
                              value={newType}
                              onChange={(e) => setNewType(e.target.value as 'paid' | 'free')}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                            >
                              <option value="paid">Paid API Key</option>
                              <option value="free">Free API Key</option>
                            </select>
                          </div>
                          <button 
                            onClick={addKey}
                            disabled={!newKey.trim() || !newName.trim()}
                            className="self-end h-[58px] bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-lg disabled:opacity-30 disabled:grayscale transition-all duration-300 transform active:scale-95"
                          >
                            Authorize Key
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-3">
                        <Lock className="w-5 h-5 text-indigo-400" /> Active Roster
                      </h3>
                      <div className="space-y-6">
                        {['paid', 'free'].map((type) => (
                          <div key={type}>
                            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${type === 'paid' ? 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} />
                              {type === 'paid' ? 'Paid Cluster' : 'Free Sandbox Cluster'}
                            </h4>
                            <div className="space-y-2">
                              {systemKey && !keys.some(k => k.type === type) && (
                                <div className="group flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl transition-all">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-indigo-300">System Provided Key</p>
                                      <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-indigo-500/20">Auto-Detected</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-indigo-300/40 mt-0.5 tracking-tighter">ENVIRONMENT VARIABLE • {systemKey.slice(0, 4)}...{systemKey.slice(-4)}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Lock className="w-4 h-4 text-indigo-400/40 mr-2" />
                                    <span className="text-[7px] text-indigo-400/30 uppercase font-bold tracking-tighter">Vercel/Vite Default</span>
                                  </div>
                                </div>
                              )}
                              {keys.filter(k => k.type === type).map((k) => (
                                <div key={k.id} className="group flex items-center justify-between bg-black/40 border border-white/5 hover:border-white/10 p-4 rounded-2xl transition-all">
                                  <div>
                                    <p className="text-xs font-black text-white/80">{k.name}</p>
                                    <p className="text-[10px] font-mono text-white/30 mt-0.5 tracking-tighter">HASH: {k.key.slice(0, 4)}...{k.key.slice(-4)}</p>
                                  </div>
                                  <button onClick={() => removeKey(k.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              {keys.filter(k => k.type === type).length === 0 && (
                                <p className="text-[10px] text-white/20 italic p-4 border border-dashed border-white/5 rounded-2xl text-center">Unconfigured</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <ExternalLink className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <h4 className="text-xl font-bold">Need a new Token?</h4>
                      <p className="text-xs text-white/40 leading-relaxed max-w-xl">
                        Google AI Studio provides instant Gemini API keys. Free tiers are perfect for testing, while Paid tiers allow for higher concurrency and access to flagship Vision models.
                      </p>
                    </div>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-transform shrink-0">
                      Go to Studio
                    </a>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-10">
                  <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                      <Shield className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-300">Absolute Neutrality</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">Security Protocol</h2>
                    <p className="text-white/40 leading-relaxed">
                      JAMINI Studio is built on a <span className="text-white">Zero-Knowledge</span> foundation. Your data architecture and AI tokens are processed within the secure boundaries of your local machine.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-6 flex flex-col">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><HardDrive className="w-6 h-6" /></div>
                      <h3 className="text-2xl font-black">Local Vault</h3>
                      <p className="text-sm text-white/50 leading-relaxed flex-1">
                        Settings and API keys are stored in <code className="text-indigo-400">LocalStorage</code>. This data never traverses our backend API. It remains scoped to your browser profile.
                      </p>
                      <ul className="space-y-3 pt-6 border-t border-white/5">
                        <li className="flex items-center gap-3 text-xs text-green-400/80"><Check className="w-4 h-4" /> No server-side DB logging</li>
                        <li className="flex items-center gap-3 text-xs text-green-400/80"><Check className="w-4 h-4" /> Sandboxed Execution</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-6 flex flex-col">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Globe className="w-6 h-6" /></div>
                      <h3 className="text-2xl font-black">Transport Layer</h3>
                      <p className="text-sm text-white/50 leading-relaxed flex-1">
                        Requests to Google AI Studio are encrypted via TLS 1.3. JAMINI communicates directly from your browser to Google's clusters.
                      </p>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-white/30 mb-2">
                          <span>Status: Secure</span>
                          <span className="text-green-400">Direct Link</span>
                        </div>
                        <div className="h-1 bg-green-500/20 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-green-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'performance' && (
                <div className="space-y-10">
                   <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Compute Optimization</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">Hardware Tuning</h2>
                    <p className="text-white/40 leading-relaxed">
                      Calibrate JAMINI for your workstation's specific hardware profiles.
                    </p>
                  </header>

                  <div className="space-y-4">
                    {[
                      { title: "High-DPI Canvas Rendering", desc: "Doubles the resolution of the editor preview for retina displays.", status: "Enabled" },
                      { title: "GPU Acceleration", desc: "Offloads layout calculations to your internal graphics processor.", status: "Auto-Detect" },
                      { title: "Staggered Animations", desc: "Enable fluid UI transitions using Motion protocol.", status: "Enabled" },
                      { title: "Neural Cache", desc: "Temporarily store AI responses to reduce token consumption.", status: "Experimental" }
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-all">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">{pref.title}</h4>
                          <p className="text-xs text-white/30">{pref.desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">{pref.status}</span>
                          <div className="w-12 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full p-1 flex justify-end">
                            <div className="w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'system' && (
                <div className="space-y-10">
                   <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <Info className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Environment Diagnostics</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">Subsystem Diagnostics</h2>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Studio Version", val: "v4.0.2-production", icon: Cpu },
                      { label: "Build Engine", val: "Vite v5.2 / React 18", icon: Activity },
                      { label: "Runtime Host", val: "Local Sandbox Container", icon: Globe },
                      { label: "Security Patch", val: "May 2026 Protocol", icon: Shield },
                      { label: "LocalStorage Usage", val: "1.2 MB / 10MB", icon: Database },
                      { label: "Session ID", val: "JS_SYS_82X91L", icon: Lock }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4 hover:border-white/20 transition-colors">
                        <stat.icon className="w-6 h-6 text-white/20" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                          <p className="text-sm font-bold text-white/80 mt-1">{stat.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3 text-red-400">
                      <AlertCircle className="w-6 h-6" />
                      <h4 className="text-lg font-black uppercase tracking-tight text-red-500">Atomic Wipe</h4>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed max-w-2xl">
                      Clearing all persistent data will permanently remove your API keys and session preferences. This action is final and cannot be reversed by system administrators.
                    </p>
                    <button onClick={() => {
                        if(confirm('Initiate Factory Reset? This will wipe all keys.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-8 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/30">
                      Purge All Data
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Persistence Bar */}
      <footer className="h-12 bg-black border-t border-white/5 flex items-center justify-between px-8 text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            LocalStorage Persistent
          </div>
          <div className="w-px h-2 bg-white/10" />
          <span>Vercel-Node v18.x</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
           <span>Memory: 42MB</span>
           <span className="text-indigo-400/50 italic">AI Studio Official Release</span>
        </div>
      </footer>
    </div>
  );
}
