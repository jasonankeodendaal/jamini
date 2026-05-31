const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">[\s\S]*?(<div className="space-y-2">\s*<h3 className="text-xs font-bold text-white\/60 uppercase tracking-wider">Character\/Model<\/h3>)/;
const match = content.match(regex);
if(match) {
    console.log("Matched the giant mess!");
    
    const cleanGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo (Dark Background)</h3>
                            {brandLogoAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={\`data:\${brandLogoAsset.mimeType};base64,\${brandLogoAsset.data}\`} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(brandLogoAsset.id, 'brandLogo')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{brandLogoAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(brandLogoAsset.id, 'brandLogo')} disabled={brandLogoAsset.isRefining || !brandLogoAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {brandLogoAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={brandLogoAsset.prompt || ''} onChange={(e) => updateAssetPrompt(brandLogoAsset.id, 'brandLogo', e.target.value)} placeholder="Specific prompt for this brand logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={brandLogoAsset.material || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={brandLogoAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={brandLogoAsset.position || ''} onChange={(e) => updateAssetDetails(brandLogoAsset.id, 'brandLogo', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => brandLogoInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Brand Logo (Dark Bg)</span>
                              </button>
                            )}
                            <input type="file" ref={brandLogoInputRef} onChange={(e) => handleFileUpload(e, 'brandLogo')} accept="image/*" className="hidden" />
                          </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Brand Logo (Light Background)</h3>
                            {brandLogoLightAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={\`data:\${brandLogoLightAsset.mimeType};base64,\${brandLogoLightAsset.data}\`} alt="Brand Logo Light" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(brandLogoLightAsset.id, 'brandLogoLight')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{brandLogoLightAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(brandLogoLightAsset.id, 'brandLogoLight')} disabled={brandLogoLightAsset.isRefining || !brandLogoLightAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {brandLogoLightAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={brandLogoLightAsset.prompt || ''} onChange={(e) => updateAssetPrompt(brandLogoLightAsset.id, 'brandLogoLight', e.target.value)} placeholder="Specific prompt for this brand logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={brandLogoLightAsset.material || ''} onChange={(e) => updateAssetDetails(brandLogoLightAsset.id, 'brandLogoLight', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={brandLogoLightAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(brandLogoLightAsset.id, 'brandLogoLight', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={brandLogoLightAsset.position || ''} onChange={(e) => updateAssetDetails(brandLogoLightAsset.id, 'brandLogoLight', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => brandLogoLightInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Brand Logo (Light Bg)</span>
                              </button>
                            )}
                            <input type="file" ref={brandLogoLightInputRef} onChange={(e) => handleFileUpload(e, 'brandLogoLight')} accept="image/*" className="hidden" />
                          </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Company Logo (Dark Background)</h3>
                            {companyLogoAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={\`data:\${companyLogoAsset.mimeType};base64,\${companyLogoAsset.data}\`} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(companyLogoAsset.id, 'companyLogo')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{companyLogoAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(companyLogoAsset.id, 'companyLogo')} disabled={companyLogoAsset.isRefining || !companyLogoAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {companyLogoAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={companyLogoAsset.prompt || ''} onChange={(e) => updateAssetPrompt(companyLogoAsset.id, 'companyLogo', e.target.value)} placeholder="Specific prompt for this company logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={companyLogoAsset.material || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={companyLogoAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={companyLogoAsset.position || ''} onChange={(e) => updateAssetDetails(companyLogoAsset.id, 'companyLogo', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => companyLogoInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Company Logo (Dark Bg)</span>
                              </button>
                            )}
                            <input type="file" ref={companyLogoInputRef} onChange={(e) => handleFileUpload(e, 'companyLogo')} accept="image/*" className="hidden" />
                          </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Company Logo (Light Background)</h3>
                            {companyLogoLightAsset ? (
                              <div className="flex gap-3 items-start bg-black/40 p-2 rounded-xl border border-white/10">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 group flex items-center justify-center p-1">
                                  <img src={\`data:\${companyLogoLightAsset.mimeType};base64,\${companyLogoLightAsset.data}\`} alt="Company Logo Light" className="max-w-full max-h-full object-contain" />
                                  <button onClick={() => removeAsset(companyLogoLightAsset.id, 'companyLogoLight')} className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{companyLogoLightAsset.name}</span>
                                    <button onClick={() => refineSpecificAssetPrompt(companyLogoLightAsset.id, 'companyLogoLight')} disabled={companyLogoLightAsset.isRefining || !companyLogoLightAsset.prompt?.trim()} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50">
                                      {companyLogoLightAsset.isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refine
                                    </button>
                                  </div>
                                  <input type="text" value={companyLogoLightAsset.prompt || ''} onChange={(e) => updateAssetPrompt(companyLogoLightAsset.id, 'companyLogoLight', e.target.value)} placeholder="Specific prompt for this company logo..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  <details className="group">
                                    <summary className="text-[10px] text-white/60 cursor-pointer hover:text-white transition-colors flex items-center gap-1 outline-none list-none [&::-webkit-details-marker]:hidden">
                                      <Settings2 className="w-3 h-3" /> Advanced Asset Controls <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform ml-auto" />
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
                                      <input type="text" placeholder="Material (e.g. Matte, Glossy, Metallic)" value={companyLogoLightAsset.material || ''} onChange={(e) => updateAssetDetails(companyLogoLightAsset.id, 'companyLogoLight', { material: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Lighting (e.g. Rim lit, Soft shadows)" value={companyLogoLightAsset.lightingInteraction || ''} onChange={(e) => updateAssetDetails(companyLogoLightAsset.id, 'companyLogoLight', { lightingInteraction: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                      <input type="text" placeholder="Position (e.g. Center foreground)" value={companyLogoLightAsset.position || ''} onChange={(e) => updateAssetDetails(companyLogoLightAsset.id, 'companyLogoLight', { position: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
                                    </div>
                                  </details>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => companyLogoLightInputRef.current?.click()} className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center gap-2 text-white/40 hover:text-indigo-400 transition-all">
                                <ImagePlus className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Add Company Logo (Light Bg)</span>
                              </button>
                            )}
                            <input type="file" ref={companyLogoLightInputRef} onChange={(e) => handleFileUpload(e, 'companyLogoLight')} accept="image/*" className="hidden" />
                          </div>
                      </div>
                    )}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Character/Model</h3>`;
    
    content = content.replace(match[0], cleanGrid);
    fs.writeFileSync(file, content);
    console.log("Successfully fixed the grid!");
} else {
    console.log("Could not find the match to fix.");
}
