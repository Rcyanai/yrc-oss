import React, { useState } from 'react';
import { FileNode } from '../types';

interface SidebarProps {
  node: FileNode;
  onSelect: (node: FileNode) => void;
  selectedId: string | null;
  level?: number;
}

export const FolderTree: React.FC<SidebarProps> = ({ node, onSelect, selectedId, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'file') return null;

  const folderChildren = node.children.filter(c => c.type === 'folder');
  const hasSubFolders = folderChildren.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div className="select-none text-sm font-medium">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 rounded-lg mx-3 mb-1 group
          ${isSelected ? 'bg-indigo-600/10 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-0.5 hover:bg-white/10 rounded transition-colors text-gray-500 ${!hasSubFolders ? 'invisible' : ''}`}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <svg className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        
        <span className="truncate">{node.name === 'Root' ? 'My Library' : node.name}</span>
      </div>

      {isOpen && hasSubFolders && (
        <div className="mt-1 border-l border-white/5 ml-6">
          {folderChildren.map((child) => (
            <FolderTree
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level} // Level stays somewhat static because we use border-l for indentation visual
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<{ 
    root: FileNode; 
    selectedNode: FileNode | null; 
    onSelect: (n: FileNode) => void 
}> = ({ root, selectedNode, onSelect }) => {
  return (
    <div className="w-80 flex-shrink-0 h-full flex flex-col bg-transparent">
        <div className="p-8 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                     <span className="text-lg font-black">I</span>
                </div>
                Instant OSS
            </h2>
            <p className="text-xs text-gray-500 mt-2 ml-1">Local Asset Gallery</p>
        </div>
        
        <div className="px-4 py-2">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <FolderTree 
                node={root} 
                onSelect={onSelect} 
                selectedId={selectedNode?.id || null} 
            />
        </div>
        
        <div className="p-6">
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-4 border border-white/5 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/5">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <span className="text-xs font-bold text-white">Status: Secure</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    Your files are processing locally in browser memory. No external uploads.
                </p>
            </div>
        </div>
    </div>
  );
};
