export interface FileNode {
  id: string;
  name: string;
  path: string; // Relative path
  type: 'file' | 'folder';
  children: FileNode[]; // Only populated if type is folder
  file?: File; // Only populated if type is file
  url?: string; // Blob URL for preview
  parent?: FileNode; // Reference to parent for navigation
  isDeleted?: boolean; // Soft delete status
}

// Serializable version of the node for JSON export
export interface SerializedNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: SerializedNode[];
  thumbnailData?: string; // Base64 string for images
  isDeleted?: boolean; // Persist soft delete status
}

export enum ViewMode {
  HIERARCHY = 'HIERARCHY',
  ALL_PHOTOS = 'ALL_PHOTOS',
}

export interface GalleryStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
}
