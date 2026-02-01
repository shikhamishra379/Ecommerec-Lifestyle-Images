
import React, { useState, useEffect } from 'react';
import { ProductInfo, LifestyleConcept, AssetType, AspectRatio, SavedProject, GroundingSource } from './types';
import { generateLifestyleConcepts } from './services/geminiService';
import { 
  SparklesIcon, 
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  PlusIcon,
  PhotoIcon,
  RectangleGroupIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  TrashIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  HeartIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const getInitialProductState = (): ProductInfo => ({
  name: '',
  url: '',
  productImageBase64: null,
  theme: '',
  assetType: 'Lifestyle',
  aspectRatio: '1:1',
  specificDetails: '',
});

const Mascot = () => (
  <div className="absolute -top-12 -left-4 animate-bounce-slow flex flex-col items-center group/mascot">
    <div className="bg-white px-3 py-1 rounded-full shadow-lg border border-indigo-100 text-[10px] font-black text-indigo-600 mb-1 opacity-0 group-hover/mascot:opacity-100 transition-opacity whitespace-nowrap">
      Let's create! ✨
    </div>
    <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-xl">
      {/* Box Body */}
      <rect x="20" y="40" width="60" height="45" rx="8" fill="#6366f1" />
      <path d="M20 50 L50 40 L80 50 L80 85 L20 85 Z" fill="#4f46e5" />
      {/* Box Flaps */}
      <path d="M20 40 L35 25 L65 25 L80 40" fill="#818cf8" />
      {/* Tape */}
      <rect x="45" y="25" width="10" height="40" fill="#e0e7ff" opacity="0.8" />
      {/* Eyes */}
      <circle cx="40" cy="65" r="4" fill="white" />
      <circle cx="60" cy="65" r="4" fill="white" />
      {/* Smile */}
      <path d="M45 72 Q50 77 55 72" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Heart */}
      <path d="M50 50 L52 48 A2 2 0 0 0 48 48 L50 50" fill="#f87171" transform="translate(-1, 0) scale(2)" />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [product, setProduct] = useState<ProductInfo>(getInitialProductState());
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<LifestyleConcept[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [refinement, setRefinement] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showMascot, setShowMascot] = useState(false);
  
  // Persistence States
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    try {
      const history = localStorage.getItem('lifestyle_lens_history');
      if (history) {
        setSavedProjects(JSON.parse(history));
      }
    } catch (e) {
      console.error("Failed to load history from storage:", e);
      localStorage.removeItem('lifestyle_lens_history');
    }
  }, []);

  const saveToLocalStorage = (projects: SavedProject[]) => {
    try {
      localStorage.setItem('lifestyle_lens_history', JSON.stringify(projects));
    } catch (e) {
      console.warn("LocalStorage storage limit exceeded.");
      alert("Storage full! Try deleting some old projects to save new ones.");
    }
  };

  const handleSaveProject = () => {
    if (concepts.length === 0) return;
    
    const newSavedProject: SavedProject = {
      id: `project-${Date.now()}`,
      timestamp: Date.now(),
      product: { ...product },
      concepts: [...concepts],
      groundingSources: [...groundingSources]
    };
    
    const updatedHistory = [newSavedProject, ...savedProjects];
    setSavedProjects(updatedHistory);
    saveToLocalStorage(updatedHistory);
    alert("Project saved to your local history!");
  };

  const loadProject = (project: SavedProject) => {
    setProduct({ ...project.product });
    setConcepts([...project.concepts]);
    setGroundingSources(project.groundingSources || []);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updatedHistory);
    saveToLocalStorage(updatedHistory);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please upload an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct(prev => ({ 
          ...prev, 
          productImageBase64: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e?: React.FormEvent, isRefinement = false) => {
    if (e) e.preventDefault();
    if (!product.name && !product.url && !product.productImageBase64) {
      alert("Please provide at least a product name, URL, or image to begin.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateLifestyleConcepts(product, isRefinement ? refinement : undefined);
      setConcepts(result.concepts);
      setGroundingSources(result.groundingSources || []);
      if (isRefinement) setRefinement('');
      
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error: any) {
      console.error("Generation failed:", error);
      alert("Creative direction failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
  };

  const handleNewProject = () => {
    setProduct({
      name: '',
      url: '',
      productImageBase64: null,
      theme: '',
      assetType: 'Lifestyle',
      aspectRatio: '1:1',
      specificDetails: '',
    });
    setConcepts([]);
    setGroundingSources([]);
    setRefinement('');
    setCopySuccess(null);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const assetTypes: AssetType[] = ['Lifestyle', 'Infographic'];
  const aspectRatios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];

  return (
    <div className="min-h-screen pb-20 bg-[#FDFDFF] text-gray-900">
      {/* History Slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArchiveBoxIcon className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black tracking-tighter">PROJECT HISTORY</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {savedProjects.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-xs uppercase tracking-widest">No saved projects yet</p>
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div 
                    key={proj.id} 
                    onClick={() => loadProject(proj)}
                    className="group border border-gray-100 bg-gray-50/50 p-5 rounded-[2rem] hover:border-indigo-200 hover:bg-white transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex gap-4">
                      {proj.product.productImageBase64 ? (
                        <img src={proj.product.productImageBase64} className="w-16 h-16 object-cover rounded-2xl bg-white border border-gray-100" alt="" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <h4 className="font-black text-sm truncate">{proj.product.name || 'Untitled Project'}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{proj.product.assetType}</p>
                        <p className="text-[9px] text-gray-400">{new Date(proj.timestamp).toLocaleDateString()} • {proj.concepts.length} concepts</p>
                      </div>
                      <button 
                        onClick={(e) => deleteProject(proj.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group relative" 
            onClick={() => setShowMascot(!showMascot)}
          >
            {showMascot && <Mascot />}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="relative">
              <h1 className="text-xl font-black text-gray-900 tracking-tighter leading-none">LifestyleLens</h1>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Creative Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(true)}
              className="text-gray-400 hover:text-indigo-600 p-2 transition-colors relative"
              title="Project History"
            >
              <ArchiveBoxIcon className="w-6 h-6" />
              {savedProjects.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full" />}
            </button>
            <button 
              onClick={handleNewProject}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95 whitespace-nowrap tracking-widest"
            >
              NEW PROJECT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">
            Design Like Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Best Competitors</span>
          </h2>
          <p className="text-gray-500 text-lg font-medium leading-relaxed">
            Input your product details or <span className="text-indigo-600 font-bold">Smart Link</span> to generate professional concepts. 
            Your projects are saved locally for safety.
          </p>
        </div>

        {/* Input Form */}
        <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/30 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-5">
                    1. Asset Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {assetTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setProduct(prev => ({ ...prev, assetType: type }))}
                        className={`flex flex-col items-center py-5 px-3 rounded-3xl text-xs font-black transition-all border-2 ${
                          product.assetType === type 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 scale-105 z-10' 
                            : 'bg-white text-gray-500 border-gray-50 hover:border-indigo-100'
                        }`}
                      >
                        {type === 'Lifestyle' && <PhotoIcon className="w-7 h-7 mb-2" />}
                        {type === 'Infographic' && <InformationCircleIcon className="w-7 h-7 mb-2" />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-5">
                    2. Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setProduct(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                          product.aspectRatio === ratio 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                            : 'bg-white text-gray-500 border-gray-50 hover:border-indigo-100'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                  Product Image (Reference)
                </label>
                <div className={`relative h-full min-h-[250px] rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center p-4 ${product.productImageBase64 ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-indigo-300 transition-colors'}`}>
                  {product.productImageBase64 ? (
                    <div className="relative w-full h-full group min-h-[200px]">
                      <img src={product.productImageBase64} className="w-full h-full object-contain rounded-2xl" alt="Product" />
                      <button onClick={() => setProduct(p => ({...p, productImageBase64: null}))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl">
                        <PlusIcon className="w-10 h-10 text-white rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center group cursor-pointer relative w-full h-full flex flex-col items-center justify-center">
                      <PhotoIcon className="w-12 h-12 text-gray-300 mb-3 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Upload product photo</span>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-50">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 'Stellar Bloom Lamp'"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
                    value={product.name}
                    onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Smart Listing URL</label>
                    <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                       <MagnifyingGlassIcon className="w-3 h-3 text-indigo-500" />
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Auto-Research</span>
                    </div>
                  </div>
                  <input 
                    type="url" 
                    placeholder="Paste Amazon, Shopify or Web link..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
                    value={product.url}
                    onChange={(e) => setProduct(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Seasonal Theme</label>
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 shadow-sm appearance-none"
                    value={product.theme}
                    onChange={(e) => setProduct(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="">Select a Theme (Optional)</option>
                    <option value="Valentine's">Valentine's (Romantic & Intimate)</option>
                    <option value="Christmas">Christmas (Cozy & Festive)</option>
                    <option value="Summer">Summer (Energetic & Vacation)</option>
                    <option value="Minimalist">Minimalist Studio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Key Features / Specifics</label>
                  <textarea 
                    placeholder="Describe unique details or mechanical parts..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 resize-none h-[60px] shadow-sm"
                    value={product.specificDetails}
                    onChange={(e) => setProduct(prev => ({ ...prev, specificDetails: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-center">
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="group relative w-full md:w-auto px-16 py-6 bg-gray-900 hover:bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-70 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                    <span className="tracking-widest uppercase">
                      {product.url ? 'Researching & Generating...' : 'Directing Concept...'}
                    </span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    <span className="tracking-widest uppercase text-sm">Create Creative Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {concepts.length > 0 && (
          <div id="results-section" className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6 border-b-4 border-gray-900/5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Campaign Assets</h3>
                   <CheckBadgeIcon className="w-10 h-10 text-green-500" />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Project: {product.name || 'Researched Product'}</p>
                  {groundingSources.length > 0 && (
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Grounding Active</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleSaveProject}
                  className="bg-indigo-50 hover:bg-indigo-100 px-6 py-3 rounded-2xl border-2 border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  Save Project to History
                </button>
                <div className="bg-gray-50 px-6 py-3 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{product.assetType} • {product.aspectRatio}</span>
                </div>
              </div>
            </div>

            {/* Research Sources if URL was used */}
            {groundingSources.length > 0 && (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-in fade-in duration-1000">
                <div className="flex items-center gap-2 mb-4">
                  <LinkIcon className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Research Sources Found</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groundingSources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-gray-500 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-gray-100 transition-all truncate max-w-xs"
                    >
                      {source.title || 'View Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-12">
              {concepts.map((concept, index) => (
                <div 
                  key={concept.id}
                  className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-100/20 hover:shadow-indigo-100/40 transition-all duration-700 border border-gray-100 group/card"
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-2/5 p-10 md:p-14 space-y-8 bg-gradient-to-br from-white to-gray-50/50">
                      <div className="flex items-center justify-between">
                        <span className="px-5 py-2 bg-indigo-50 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-500">
                          {concept.category}
                        </span>
                        <span className="text-[40px] font-black text-gray-100 italic select-none leading-none">0{index + 1}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-3xl font-black text-gray-900 leading-tight tracking-tighter group-hover/card:text-indigo-600 transition-colors">
                          {concept.title}
                        </h4>
                        <div className="space-y-3">
                           <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Strategic Logic:</p>
                           <p className="text-gray-500 font-medium leading-relaxed text-sm italic">
                             {concept.description}
                           </p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Researched Specs</p>
                          <div className="flex gap-1.5 pt-1">
                            <div className="w-4 h-4 rounded-full bg-indigo-400" />
                            <div className="w-4 h-4 rounded-full bg-purple-400" />
                            <div className="w-4 h-4 rounded-full bg-gray-200" />
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Technical Accuracy</p>
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Verified</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-3/5 p-4 lg:p-8 bg-gray-50">
                      <div className="bg-gray-900 rounded-[2.5rem] p-10 relative h-full flex flex-col shadow-inner">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">8K AI PROMPT</span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(concept.prompt, concept.id)}
                            className="bg-white/10 hover:bg-indigo-500 p-3.5 rounded-2xl text-white transition-all transform hover:scale-110 active:scale-95 flex items-center gap-3 text-xs font-black uppercase tracking-widest"
                          >
                            {copySuccess === concept.id ? (
                              <>
                                <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex-grow max-h-[300px] overflow-y-auto custom-scrollbar">
                          <p className="text-indigo-100 font-mono text-sm leading-loose whitespace-pre-wrap select-all pr-4 border-l-2 border-indigo-500/30 pl-6">
                            {concept.prompt}
                          </p>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-white/20 text-[10px] font-bold uppercase tracking-widest">
                          <span>{product.aspectRatio} Format</span>
                          <span>High-Res Master</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <section className="bg-indigo-700 rounded-[4rem] p-12 md:p-20 text-white shadow-3xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
                <PencilSquareIcon className="w-96 h-96 -rotate-12" />
              </div>
              
              <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                <div className="lg:w-2/5 space-y-6">
                  <h3 className="text-5xl font-black tracking-tighter leading-tight uppercase">Master <span className="text-indigo-200 underline decoration-white/30 italic">Refine</span></h3>
                  <p className="text-indigo-100 font-medium text-lg leading-relaxed opacity-90">
                    Need technical adjustments? Ask to modify the lighting, background props, or focus on a specific technical detail discovered in the research.
                  </p>
                </div>
                
                <div className="lg:w-3/5 w-full space-y-6">
                  <div className="relative">
                    <textarea 
                      className="w-full bg-white/10 border-2 border-white/20 rounded-[2.5rem] px-8 py-8 text-white placeholder-indigo-300 outline-none focus:ring-8 focus:ring-white/5 focus:border-white/40 transition-all font-black text-xl min-h-[180px] shadow-2xl resize-none"
                      placeholder="e.g. 'Emphasize the ANSI cut level rating' or 'Swap the factory background for a clean white studio'..."
                      value={refinement}
                      onChange={(e) => setRefinement(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleGenerate(undefined, true)}
                      disabled={loading || !refinement.trim()}
                      className="bg-white text-indigo-700 font-black px-16 py-6 rounded-[2rem] hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 flex items-center gap-4 disabled:opacity-50 uppercase tracking-widest text-sm"
                    >
                      {loading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                      Apply Adjustments
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {loading && concepts.length === 0 && (
          <div className="py-20 space-y-12 flex flex-col items-center">
             <div className="relative">
               <div className="w-24 h-24 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin" />
               <SparklesIcon className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
             </div>
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                  {product.url ? 'Researching Product URL...' : 'Analyzing Concepts...'}
                </h2>
                <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-xs">Connecting to Market Knowledge Base...</p>
             </div>
             <div className="w-full max-w-4xl grid grid-cols-1 gap-8 opacity-20">
                <div className="h-64 bg-gray-200 rounded-[3rem]" />
                <div className="h-64 bg-gray-200 rounded-[3rem]" />
             </div>
          </div>
        )}
      </main>

      <footer className="mt-40 border-t border-gray-100 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-xl">
              <SparklesIcon className="w-5 h-5 text-gray-900" />
            </div>
            <span className="font-black text-gray-900 tracking-tighter uppercase">LifestyleLens STUDIO</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
            <span>Made with</span>
            <HeartIcon className="w-4 h-4 text-red-400 fill-current" />
            <span>by SM</span>
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-in.slide-in-from-right {
          animation: slide-in-from-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
