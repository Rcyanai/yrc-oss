import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';
import { serializeTree } from '../utils/fileUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: FileNode | null;
  stats: { files: number; size: number };
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, rootNode, stats }) => {
  const [step, setStep] = useState<'idle' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setProgress(0);
      setDownloadUrl(null);
    }
  }, [isOpen]);

  const handleGenerateSnapshot = async () => {
    if (!rootNode) return;
    setStep('processing');
    
    let processedCount = 0;
    const totalFiles = stats.files;
    
    // Small delay to allow UI to render the 'processing' state before heavy JS work starts
    setTimeout(async () => {
        try {
            const serializedRoot = await serializeTree(rootNode, () => {
                processedCount++;
                setProgress(Math.round((processedCount / totalFiles) * 100));
            });

            const jsonString = JSON.stringify(serializedRoot);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setStep('ready');
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed due to memory limits or file issues. Try exporting fewer folders.");
            setStep('idle');
        }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Share Gallery Snapshot</h2>
        <p className="text-gray-400 text-sm mb-6">
            Since this app runs locally without a cloud server, you can share a "Snapshot File" containing your folder structure and high-quality images.
        </p>
        
        {step === 'idle' && (
            <div className="text-center py-4">
                 <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl mb-6">
                    <p className="text-indigo-200 text-sm font-medium">Ready to bundle {stats.files} items</p>
                    <p className="text-indigo-400/60 text-xs mt-1">Exporting in HD (Short-edge 1024px) for best viewing experience.</p>
                 </div>
                 <button 
                    onClick={handleGenerateSnapshot}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Generate HD Snapshot
                 </button>
            </div>
        )}

        {step === 'processing' && (
          <div className="py-8">
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
              <span>PROCESSING IMAGES (HD)...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-4 animate-pulse">Encoding high-definition assets...</p>
          </div>
        )}

        {step === 'ready' && downloadUrl && (
          <div className="py-2 animate-in slide-in-from-bottom-2">
             <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
             </div>
             
             <h3 className="text-center text-white font-medium mb-1">Snapshot Ready!</h3>
             <p className="text-center text-gray-500 text-xs mb-6">Send this file to your friends. They can open it using the "Import Snapshot" button.</p>

             <a 
                href={downloadUrl}
                download={`instant_oss_snapshot_${new Date().toISOString().slice(0,10)}.afm`}
                className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl text-center transition-colors shadow-lg shadow-green-900/20"
             >
                Download File (.afm)
             </a>
             <button onClick={onClose} className="block w-full mt-3 text-gray-500 hover:text-gray-300 text-sm py-2">
                Close
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
