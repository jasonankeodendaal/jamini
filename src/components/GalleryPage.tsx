import React, { useState, useEffect } from 'react';
import { Download, Folder, Image as ImageIcon, Trash2, Calendar, FileType2, Search, Filter, X, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import localforage from 'localforage';
import { cn } from '../lib/utils';
import { downloadAsSVG, downloadAsEPS, downloadAllFormats } from '../services/logoService';

export interface GenerationRecord {
  id: string;
  type: 'image' | 'video';
  dataUrl: string | Blob; // Base64 or Blob
  date: number;
  prompt: string;
  projectName?: string;
}

const MediaPreview = React.memo(({ record, className }: { record: GenerationRecord, className?: string }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (record.dataUrl instanceof Blob) {
      const bUrl = URL.createObjectURL(record.dataUrl);
      setUrl(bUrl);
      return () => URL.revokeObjectURL(bUrl);
    } else {
      setUrl(record.dataUrl as string);
    }
  }, [record.dataUrl]);

  if (!url) return <div className={cn("w-full h-full bg-white/5 animate-pulse rounded-lg", className)} />;

  if (record.type === 'image') {
    return <img src={url} className={cn("w-full h-full object-contain", className)} alt={record.prompt} loading="lazy" />;
  }
  return (
    <video 
      src={url} 
      className={cn("w-full h-full object-contain", className)} 
      controls 
      loop 
      muted 
      playsInline 
      crossOrigin="anonymous"
      autoPlay
    />
  );
});


export default function GalleryPage({ onBack }: { onBack: () => void }) {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = await localforage.getItem<GenerationRecord[]>('jamini_history');
      if (stored) {
        setGenerations(stored.sort((a, b) => b.date - a.date));
      }
    } catch (err) {
      console.error("Error loading history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const folders = Array.from(new Set(generations.map(g => {
    if (!g.date) return 'Unknown';
    try {
      const d = new Date(g.date);
      if (isNaN(d.getTime())) return 'Unknown';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return 'Unknown';
    }
  }))).filter(f => f !== 'Unknown');

  const handleDownload = (record: GenerationRecord, format: string) => {
    const link = document.createElement("a");
    let url = '';
    if (record.dataUrl instanceof Blob) {
      url = URL.createObjectURL(record.dataUrl);
    } else {
      url = record.dataUrl;
    }
    link.href = url;
    link.download = `jamini-generation-${record.id}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (record.dataUrl instanceof Blob) {
      URL.revokeObjectURL(url);
    }
  };

  const removeRecord = async (id: string) => {
    const updated = generations.filter(g => g.id !== id);
    setGenerations(updated);
    await localforage.setItem('jamini_history', updated);
  };

  const filtered = generations.filter(g => {
    if (!g) return false;
    
    let folderName = 'Unknown';
    if (g.date) {
      try {
        const d = new Date(g.date);
        if (!isNaN(d.getTime())) {
          folderName = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        console.warn("Invalid date on record", g.id, e);
      }
    }
    
    const matchesFolder = selectedFolder ? folderName === selectedFolder : true;
    const matchesSearch = search ? (g.prompt || '').toLowerCase().includes(search.toLowerCase()) : true;
    return matchesFolder && matchesSearch;
  });

  const refreshVault = () => {
    setLoading(true);
    loadData();
  };

  return (
    <div className="flex flex-col h-full bg-[#0E0E11] text-white font-sans overflow-hidden">
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#18181C] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" /> Back to Studio
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <button onClick={refreshVault} className="text-white/30 hover:text-indigo-400 transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
            <Zap className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh Sync
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
            <Folder className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-widest">Asset Manager</h1>
        </div>
        <div className="w-32 hidden md:block" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0C]">
        {/* Unified Top Control Bar */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0E0E11] flex flex-col md:flex-row items-center gap-4 shrink-0 transition-all">
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Search by prompt or keyword..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-white transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full md:w-auto pb-2 md:pb-0">
            <button 
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                selectedFolder === null 
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" 
                  : "text-white/20 hover:text-white/40 border-white/5 bg-white/5"
              )}
            >
              All Assets
            </button>
            {folders.map(f => (
              <button 
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  selectedFolder === f 
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" 
                    : "text-white/20 hover:text-white/40 border-white/5 bg-white/5"
                )}
              >
                {f.replace('-', ' · ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 xl:p-12 overflow-y-auto custom-scrollbar pb-24">
            {loading ? (
              <div className="flex h-full items-center justify-center text-white/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">Synchronizing vault...</div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/10 text-xs font-bold uppercase tracking-widest">No matching artifacts</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8 max-w-[1800px] mx-auto">
                <AnimatePresence mode="popLayout">
                  {filtered.map(record => (
                    <motion.div 
                      key={record.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#18181C]/40 border border-white/5 rounded-[2rem] overflow-hidden group flex flex-col cursor-pointer hover:bg-[#18181C] hover:border-indigo-500/20 transition-all duration-500 shadow-xl"
                      onClick={() => setSelectedRecord(record)}
                    >
                    <div className="relative aspect-square overflow-hidden bg-black/90 p-4 pointer-events-none group-hover:p-1 transition-all duration-500">
                         <MediaPreview record={record} className="rounded-2xl" />
                         <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 pointer-events-auto">
                           <button onClick={(e) => { e.stopPropagation(); removeRecord(record.id); }} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg ring-4 ring-black/50 transition-all"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
                         <p className="text-[9px] md:text-[10px] font-medium text-white/40 mb-4 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-4 group-hover:text-white/80 transition-colors" title={record.prompt}>{record.prompt || "No prompt details"}</p>
                         <div className="space-y-4 md:space-y-6">
                           <div className="flex items-center justify-between text-[8px] md:text-[9px] text-white/20 gap-1 md:gap-0 font-black uppercase tracking-widest">
                             <span className="truncate">{new Date(record.date).toLocaleDateString()}</span>
                             <span className="px-2 py-0.5 bg-white/5 rounded border border-white/5">{record.type}</span>
                           </div>
                           <div className="border-t border-white/5 pt-4 md:pt-6">
                             <div className="flex flex-wrap gap-1 md:gap-2 pointer-events-auto">
                               {record.type === 'video' ? (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     const url = record.dataUrl instanceof Blob ? URL.createObjectURL(record.dataUrl) : record.dataUrl;
                                     const link = document.createElement("a");
                                     link.href = url;
                                     link.download = `jamini-video-${record.id}.mp4`;
                                     link.click();
                                     if (record.dataUrl instanceof Blob) URL.revokeObjectURL(url);
                                   }}
                                   className="flex-1 text-[8px] md:text-[9px] font-black uppercase tracking-tighter px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all"
                                 >
                                   MP4
                                 </button>
                               ) : (
                                 <>
                                   <div className="grid grid-cols-2 w-full gap-2">
                                     {['PNG', 'SVG'].map(fmt => (
                                       <button 
                                         key={fmt}
                                         onClick={(e) => { 
                                           e.stopPropagation(); 
                                           const url = record.dataUrl instanceof Blob ? URL.createObjectURL(record.dataUrl) : record.dataUrl as string;
                                           if (fmt === 'SVG') {
                                              downloadAsSVG(url, `jamini-${record.id}`);
                                           } else {
                                              handleDownload(record, fmt.toLowerCase()); 
                                           }
                                         }}
                                         className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter py-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white/30 border border-white/5 rounded-xl transition-all"
                                       >
                                         {fmt}
                                       </button>
                                     ))}
                                   </div>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const url = record.dataUrl instanceof Blob ? URL.createObjectURL(record.dataUrl) : record.dataUrl as string;
                                       downloadAllFormats(url, `jamini-pack-${record.id}`);
                                     }}
                                     className="w-full text-[8px] md:text-[9px] font-black uppercase tracking-widest py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                   >
                                     <Zap className="w-3 h-3" /> FULL PACK
                                   </button>
                                 </>
                               )}
                             </div>
                           </div>
                         </div>
                      </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          </div>
        </div>

      <AnimatePresence>
        {selectedRecord && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#18181C] border border-white/10 rounded-3xl overflow-hidden max-w-6xl w-full max-h-full flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-1 bg-black/50 p-4 md:p-8 flex items-center justify-center relative min-h-[40vh] md:min-h-0">
                <MediaPreview record={selectedRecord} className="max-h-[70vh]" />
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="w-full md:w-[400px] flex flex-col border-l border-white/5 max-h-[50vh] md:max-h-none overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <FileType2 className="w-4 h-4 text-indigo-400" /> Format Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Type</span>
                        <p className="text-sm text-white font-medium capitalize mt-1">{selectedRecord.type}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Date</span>
                        <p className="text-sm text-white font-medium mt-1">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-400" /> Synthesis Prompt
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-mono custom-scrollbar max-h-64 overflow-y-auto">
                      {selectedRecord.prompt || "No prompt available"}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <h3 className="text-sm font-bold text-white mb-3">Export Assets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRecord.type === 'video' ? (
                         <button 
                           onClick={() => {
                             const url = selectedRecord.dataUrl instanceof Blob ? URL.createObjectURL(selectedRecord.dataUrl) : selectedRecord.dataUrl;
                             const link = document.createElement("a");
                             link.href = url;
                             link.download = `jamini-video-${selectedRecord.id}.mp4`;
                             link.click();
                             if (selectedRecord.dataUrl instanceof Blob) URL.revokeObjectURL(url);
                           }}
                           className="flex items-center justify-center gap-2 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl transition-colors text-xs font-bold w-full col-span-2"
                         >
                           <Download className="w-4 h-4" /> Download MP4 Video
                         </button>
                      ) : (
                        <>
                          {['PNG', 'JPG', 'PDF', 'SVG'].map(fmt => (
                            <button 
                              key={fmt}
                              onClick={() => {
                                const url = selectedRecord.dataUrl instanceof Blob ? URL.createObjectURL(selectedRecord.dataUrl) : selectedRecord.dataUrl as string;
                                if (fmt === 'SVG') {
                                  downloadAsSVG(url, `jamini-${selectedRecord.id}`);
                                } else {
                                  handleDownload(selectedRecord, fmt.toLowerCase());
                                }
                              }}
                              className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-colors text-xs font-bold"
                            >
                              <Download className="w-3 h-3 text-white/50" /> {fmt}
                            </button>
                          ))}
                          <button 
                            onClick={() => {
                              const url = selectedRecord.dataUrl instanceof Blob ? URL.createObjectURL(selectedRecord.dataUrl) : selectedRecord.dataUrl as string;
                              downloadAsEPS(url, `jamini-${selectedRecord.id}`);
                            }}
                            className="flex items-center justify-center gap-2 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl transition-colors text-[10px] font-black tracking-tighter col-span-1"
                          >
                             ILLUSTRATOR / COREL (EPS)
                          </button>
                          <button 
                            onClick={() => {
                              const url = selectedRecord.dataUrl instanceof Blob ? URL.createObjectURL(selectedRecord.dataUrl) : selectedRecord.dataUrl as string;
                              downloadAllFormats(url, `jamini-pack-${selectedRecord.id}`);
                            }}
                            className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors text-xs font-bold col-span-1"
                          >
                             FULL MEDIA PACK
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          removeRecord(selectedRecord.id);
                          setSelectedRecord(null);
                        }}
                        className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors text-xs font-bold w-full col-span-2 mt-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Master Artifact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
