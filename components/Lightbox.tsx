import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';

interface LightboxProps {
  node: FileNode;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ node, onClose, onNext, onPrev }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!node.url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
            <h2 className="font-medium text-lg">{node.name}</h2>
            <p className="text-xs text-gray-400 font-mono">{node.path}</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setShowInfo(!showInfo)} className="p-2 text-white hover:bg-white/10 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full overflow-hidden">
        {/* Previous Button */}
        <button onClick={onPrev} className="absolute left-4 p-4 text-white hover:bg-white/10 rounded-full z-10 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        {/* Image */}
        <img 
            src={node.url} 
            alt={node.name} 
            className="max-h-full max-w-full object-contain shadow-2xl"
        />

        {/* Next Button */}
        <button onClick={onNext} className="absolute right-4 p-4 text-white hover:bg-white/10 rounded-full z-10 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
        </button>

        {/* Info Panel Overlay */}
        {showInfo && (
             <div className="absolute right-0 top-16 bottom-16 w-80 bg-gray-900/90 backdrop-blur-md border-l border-gray-700 p-6 transform transition-transform overflow-y-auto">
                <h3 className="text-white font-bold mb-4">Image Details</h3>
                
                <div className="space-y-4 text-sm text-gray-300">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase mb-1">Filename</span>
                        {node.name}
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase mb-1">Path</span>
                        <span className="break-all font-mono text-xs">{node.path}</span>
                    </div>
                     <div>
                        <span className="block text-gray-500 text-xs uppercase mb-1">Size</span>
                        {node.file ? (node.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Snapshot Preview'}
                    </div>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};
