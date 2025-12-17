import React from 'react';
import { FileNode } from '../types';

interface GalleryProps {
  nodes: FileNode[]; // Can be immediate children or all images depending on view
  onImageClick: (node: FileNode) => void;
  onFolderClick?: (node: FileNode) => void;
  onToggleDelete?: (node: FileNode) => void;
  title: string;
}

export const Gallery: React.FC<GalleryProps> = ({ nodes, onImageClick, onFolderClick, onToggleDelete, title }) => {
  const folders = nodes.filter(n => n.type === 'folder');
  const files = nodes.filter(n => n.type === 'file');

  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault(); // Prevent browser context menu
    if (onToggleDelete) {
        onToggleDelete(node);
    }
  };

  if (nodes.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                  <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-1">Empty Directory</h3>
              <p className="text-sm font-light tracking-wide text-gray-500">There are no files to display here.</p>
          </div>
      )
  }

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6">
        <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                {title}
            </h1>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Active Viewer
            </p>
        </div>
        <div className="text-right hidden sm:block">
             <span className="text-3xl font-light text-white block">{nodes.length}</span>
             <span className="text-xs text-gray-500 uppercase tracking-widest">Items</span>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 pl-1">
             Directories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {folders.map((folder) => (
              <div 
                key={folder.id} 
                onClick={() => onFolderClick && onFolderClick(folder)}
                className="group cursor-pointer bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.05] rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1 flex flex-col items-center justify-center aspect-[4/3]"
              >
                <div className="mb-4 text-gray-600 group-hover:text-indigo-400 transition-colors duration-300 transform group-hover:scale-110">
                   <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                   </svg>
                </div>
                <div className="text-center w-full">
                    <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors">{folder.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{folder.children.length} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Section */}
      {files.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 pl-1">
            Media Assets
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {files.map((fileNode) => (
              <div 
                key={fileNode.id} 
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border transition-all duration-500 hover:-translate-y-1
                    ${fileNode.isDeleted 
                        ? 'bg-gray-900 border-red-900/30' 
                        : 'bg-black/40 border-white/5 hover:border-indigo-500/50 hover:shadow-[0_15px_40px_-10px_rgba(99,102,241,0.2)]'}
                `}
                onClick={() => !fileNode.isDeleted && onImageClick(fileNode)}
                onContextMenu={(e) => handleRightClick(e, fileNode)}
              >
                {fileNode.url && (
                    <img 
                        src={fileNode.url} 
                        alt={fileNode.name}
                        className={`w-full h-full object-cover transition-all duration-700
                            ${fileNode.isDeleted 
                                ? 'grayscale brightness-50 contrast-50' 
                                : 'group-hover:scale-105 opacity-80 group-hover:opacity-100'}
                        `}
                        loading="lazy"
                    />
                )}
                
                {/* Deleted State Icon */}
                {fileNode.isDeleted && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/50 flex items-center justify-center animate-in zoom-in duration-200">
                             <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                )}
                
                {/* Overlay Details (Only show if not deleted) */}
                {!fileNode.isDeleted && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <p className="text-white text-sm truncate font-medium">{fileNode.name}</p>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-indigo-300 text-[9px] uppercase tracking-wider">{fileNode.type}</p>
                            <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};