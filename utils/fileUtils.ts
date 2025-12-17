import { FileNode, SerializedNode } from '../types';

export const parseFilesToTree = (files: FileList): { root: FileNode, allImages: FileNode[] } => {
  const root: FileNode = {
    id: 'root',
    name: 'Root',
    path: '',
    type: 'folder',
    children: [],
  };

  const allImages: FileNode[] = [];

  Array.from(files).forEach((file) => {
    // webkitRelativePath is something like "MyFolder/Sub/image.jpg"
    // If not available (rare in modern browsers for directory upload), use name
    const pathParts = file.webkitRelativePath 
      ? file.webkitRelativePath.split('/') 
      : [file.name];
    
    // Ignore dotfiles or system files if necessary
    if (file.name.startsWith('.')) return;
    
    // Only process images
    if (!file.type.startsWith('image/')) return;

    let currentNode = root;

    // Traverse/Build the tree structure
    pathParts.forEach((part, index) => {
      const isFile = index === pathParts.length - 1;
      
      if (isFile) {
        const fileNode: FileNode = {
          id: `${currentNode.path}/${part}`,
          name: part,
          path: file.webkitRelativePath,
          type: 'file',
          children: [],
          file: file,
          url: URL.createObjectURL(file),
          parent: currentNode,
          isDeleted: false
        };
        currentNode.children.push(fileNode);
        allImages.push(fileNode);
      } else {
        // It's a folder
        let folderNode = currentNode.children.find(child => child.name === part && child.type === 'folder');
        
        if (!folderNode) {
          folderNode = {
            id: `${currentNode.path}/${part}`,
            name: part,
            path: currentNode.path ? `${currentNode.path}/${part}` : part,
            type: 'folder',
            children: [],
            parent: currentNode
          };
          currentNode.children.push(folderNode);
        }
        currentNode = folderNode;
      }
    });
  });

  return { root, allImages };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// --- Export/Import Logic ---

const processImageForExport = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Smart HD Scaling: Short edge 1024px
        const SHORT_EDGE_TARGET = 1024;
        let width = img.width;
        let height = img.height;
        const shortEdge = Math.min(width, height);

        // Only scale down if image is larger than target
        if (shortEdge > SHORT_EDGE_TARGET) {
            const scale = SHORT_EDGE_TARGET / shortEdge;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Enable high quality image scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            // High Quality JPEG (0.85) - Good balance for HD display
            resolve(canvas.toDataURL('image/jpeg', 0.85)); 
        } else {
            // Fallback if canvas context fails
            resolve('');
        }
      };
      
      img.onerror = () => {
          console.warn('Failed to load image for processing:', file.name);
          resolve('');
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
        console.warn('Failed to read file:', file.name);
        resolve('');
    };
    
    reader.readAsDataURL(file);
  });
};

export const serializeTree = async (node: FileNode, onProgress?: () => void): Promise<SerializedNode> => {
  const serialized: SerializedNode = {
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    children: [],
    isDeleted: node.isDeleted
  };

  if (node.type === 'file' && node.file) {
    try {
        serialized.thumbnailData = await processImageForExport(node.file);
    } catch (e) {
        console.error("Error processing file", node.name, e);
    }
    if (onProgress) onProgress();
  }

  if (node.children) {
    // Process children sequentially to avoid freezing browser with too many parallel canvas ops
    for (const child of node.children) {
      serialized.children.push(await serializeTree(child, onProgress));
    }
  }

  return serialized;
};

const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const deserializeTree = (
  node: SerializedNode, 
  allImagesAccumulator: FileNode[], 
  parent?: FileNode
): FileNode => {
  const restoredNode: FileNode = {
    id: node.id,
    name: node.name,
    path: node.path,
    type: node.type,
    children: [],
    parent: parent,
    isDeleted: node.isDeleted || false
  };

  if (node.type === 'file' && node.thumbnailData) {
    const blob = base64ToBlob(node.thumbnailData);
    restoredNode.url = URL.createObjectURL(blob);
    // Note: We don't have the original File object anymore, but we have a viewable blob
    // We create a File object so the UI treats it correctly (though size is the compressed size)
    restoredNode.file = new File([blob], node.name, { type: blob.type }); 
    allImagesAccumulator.push(restoredNode);
  }

  if (node.children) {
    node.children.forEach(child => {
      restoredNode.children.push(deserializeTree(child, allImagesAccumulator, restoredNode));
    });
  }

  return restoredNode;
};
