import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FileNode, ViewMode, GalleryStats, SerializedNode } from './types';
import { parseFilesToTree, deserializeTree } from './utils/fileUtils';
import { Sidebar } from './components/Sidebar';
import { Gallery } from './components/Gallery';
import { Lightbox } from './components/Lightbox';
import { ShareModal } from './components/ShareModal';

const App: React.FC = () => {
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [currentNode, setCurrentNode] = useState<FileNode | null>(null);
  const [allImages, setAllImages] = useState<FileNode[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.HIERARCHY);
  const [lightboxNode, setLightboxNode] = useState<FileNode | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<GalleryStats>({ totalFiles: 0, totalFolders: 0, totalSize: 0 });
  
  // Dummy state to force re-renders when deep properties (isDeleted) change
  const [updateTick, setUpdateTick] = useState(0);

  // Native input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when allImages changes (e.g. new upload or reset)
  useEffect(() => {
    return () => {
        // This runs when the component unmounts or before the effect re-runs
        // However, we want to be careful not to revoke URLs that are still in use if we just added to them.
        // But in this app, handleUpload replaces the entire state.
        allImages.forEach(node => {
            if (node.url && node.url.startsWith('blob:')) {
                URL.revokeObjectURL(node.url);
            }
        });
    };
  }, [allImages]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear the workspace? This will remove all loaded images from memory.")) {
        setRootNode(null);
        setCurrentNode(null);
        setAllImages([]);
        setStats({ totalFiles: 0, totalFolders: 0, totalSize: 0 });
        setViewMode(ViewMode.HIERARCHY);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Revoke old URLs before creating new ones happens automatically via the useEffect cleanup 
    // when setAllImages is called, BUT we need to be careful about the order.
    // Actually, React state updates are batched. The cleanup of the previous effect runs before the new effect.
    // So the old allImages will be cleaned up.

    const { root, allImages: images } = parseFilesToTree(files);
    
    // Calculate stats
    let folders = 0;
    let size = 0;
    const countFolders = (node: FileNode) => {
      if (node.type === 'folder') {
        folders++;
        node.children.forEach(countFolders);
      }
    };
    countFolders(root);
    Array.from(files).forEach((f: File) => size += f.size);

    setRootNode(root);
    setCurrentNode(root);
    setAllImages(images);
    setStats({
      totalFiles: images.length,
      totalFolders: folders - 1, // Subtract root
      totalSize: size
    });
    
    // Reset input so same folder can be selected again if needed
    event.target.value = '';
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = e.target?.result as string;
            const serializedRoot: SerializedNode = JSON.parse(json);
            const allImagesList: FileNode[] = [];
            const restoredRoot = deserializeTree(serializedRoot, allImagesList);

            let folders = 0;
            const countFolders = (node: FileNode) => {
                if (node.type === 'folder') {
                    folders++;
                    node.children.forEach(countFolders);
                }
            };
            countFolders(restoredRoot);

            setRootNode(restoredRoot);
            setCurrentNode(restoredRoot);
            setAllImages(allImagesList);
            setStats({
                totalFiles: allImagesList.length,
                totalFolders: folders - 1,
                totalSize: 0 
            });
        } catch (err) {
            alert("Invalid snapshot file.");
            console.error(err);
        } finally {
            setIsImporting(false);
            // Reset input
            event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handleSelectNode = (node: FileNode) => {
    setCurrentNode(node);
    setViewMode(ViewMode.HIERARCHY); 
  };

  const handlePublish = () => {
    setIsShareModalOpen(true);
  };

  const handleToggleDelete = (node: FileNode) => {
    node.isDeleted = !node.isDeleted;
    setUpdateTick(prev => prev + 1); // Force re-render to reflect change
  };

  const galleryNodes = useMemo(() => {
    if (viewMode === ViewMode.ALL_PHOTOS) {
      return allImages;
    }
    return currentNode ? currentNode.children : [];
  }, [viewMode, currentNode, allImages, updateTick]); // Depend on updateTick

  const handleNextImage = () => {
    if (!lightboxNode) return;
    const currentList = galleryNodes.filter(n => n.type === 'file' && !n.isDeleted); 
    const idx = currentList.findIndex(n => n.id === lightboxNode.id);
    if (idx !== -1 && idx < currentList.length - 1) {
      setLightboxNode(currentList[idx + 1]);
    }
  };

  const handlePrevImage = () => {
    if (!lightboxNode) return;
    const currentList = galleryNodes.filter(n => n.type === 'file' && !n.isDeleted);
    const idx = currentList.findIndex(n => n.id === lightboxNode.id);
    if (idx !== -1 && idx > 0) {
      setLightboxNode(currentList[idx - 1]);
    }
  };

  return (
    <div className="h-screen w-full bg-[#050505] relative overflow-hidden flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Cinematic Atmosphere & Glows (Background) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[60vh] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000 pointer-events-none"></div>
      <div className="absolute top-[30%] left-[40%] w-[30vw] h-[30vh] bg-purple-900/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* 2. Abstract Floating UI Icons (Background Decoration) */}
      
      {/* Icon 1: Data/Structure (Top Left) */}
      <div className="absolute top-[10%] left-[5%] animate-float pointer-events-none opacity-40">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 backdrop-blur-md flex items-center justify-center shadow-lg transform -rotate-12">
            <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        </div>
      </div>

      {/* Icon 2: AI Sparkle (Bottom Right) */}
      <div className="absolute bottom-[15%] right-[8%] animate-float-delayed pointer-events-none opacity-30">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tl from-purple-500/10 to-transparent border border-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl">
             <svg className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
      </div>

      {/* Icon 3: Security Shield (Top Right) */}
      <div className="absolute top-[15%] right-[25%] animate-float pointer-events-none opacity-20" style={{ animationDelay: '2s' }}>
         <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center justify-center transform rotate-6">
            <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
         </div>
      </div>

      {/* 3. Main Web App Layout */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row max-w-[1920px] mx-auto animate-fade-in-up">
        
        {!rootNode ? (
            // --- Landing / Upload State ---
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative">
                <div className="max-w-xl w-full">
                    {/* Hero Icon */}
                    <div className="w-24 h-24 mx-auto mb-8 relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50">
                             <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 tracking-tight">
                        Instant OSS
                    </h1>
                    <p className="text-gray-400 mb-10 text-lg font-light leading-relaxed">
                        A secure, local-first workspace for your visual assets.
                        <br/>
                        <span className="text-sm text-gray-500">No Cloud Uploads</span>
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-5 h-5 text-gray-800 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            Open Local Folder
                        </button>
                        
                        <button 
                            onClick={() => importInputRef.current?.click()}
                            disabled={isImporting}
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 text-gray-300 border border-white/10 font-medium rounded-xl transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {isImporting ? 'Loading...' : 'Import Snapshot'}
                        </button>
                    </div>
                </div>

                 {/* Hidden Inputs */}
                <input ref={fileInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={handleUpload} />
                <input ref={importInputRef} type="file" accept=".afm,.json" className="hidden" onChange={handleImport} />
            </div>
        ) : (
            // --- Main Application Dashboard ---
            <>
                <div className="hidden md:block h-full relative z-20">
                     <Sidebar root={rootNode} selectedNode={currentNode} onSelect={handleSelectNode} />
                </div>
                
                <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white/[0.02] md:rounded-l-3xl border-l border-white/5 shadow-2xl">
                    {/* App Navbar */}
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                             {/* Mobile Sidebar Toggle could go here */}
                             <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                                <button onClick={() => setViewMode(ViewMode.HIERARCHY)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${viewMode === ViewMode.HIERARCHY ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    Folders
                                </button>
                                <button onClick={() => setViewMode(ViewMode.ALL_PHOTOS)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${viewMode === ViewMode.ALL_PHOTOS ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    All Assets
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden lg:flex items-center gap-6 text-right">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total Assets</span>
                                    <span className="text-sm text-gray-200 font-mono">{stats.totalFiles}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Size</span>
                                    <span className="text-sm text-gray-200 font-mono">{stats.totalSize > 0 ? (stats.totalSize / 1024 / 1024).toFixed(0) + ' MB' : 'Local'}</span>
                                </div>
                            </div>
                            
                            <button onClick={handleReset} className="text-gray-500 hover:text-red-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                                Reset Workspace
                            </button>

                            <button onClick={handlePublish} className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-white/5 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                Share Snapshot
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-hidden relative">
                        <Gallery 
                            nodes={galleryNodes} 
                            onImageClick={setLightboxNode} 
                            onFolderClick={handleSelectNode} 
                            onToggleDelete={handleToggleDelete}
                            title={viewMode === ViewMode.ALL_PHOTOS ? 'All Photos' : (currentNode?.name || 'Library')} 
                        />
                    </main>
                </div>
            </>
        )}
      </div>

      {/* Lightbox Overlay (Global z-index 50) */}
      {lightboxNode && (
        <Lightbox node={lightboxNode} onClose={() => setLightboxNode(null)} onNext={handleNextImage} onPrev={handlePrevImage} />
      )}

      {/* Share Modal */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} rootNode={rootNode} stats={{ files: stats.totalFiles, size: stats.totalSize }} />
    </div>
  );
};

export default App;
