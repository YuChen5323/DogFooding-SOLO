import { SavedDesign, ChipTemplate, SimulationParameters, ChipTemplateType } from '../types';

const STORAGE_KEY = 'microfluidix_designs';
const DESIGN_DIR = 'designs';

let opfsRoot: FileSystemDirectoryHandle | null = null;

export const isOPFSSupported = (): boolean => {
  return 'storage' in navigator && 'getDirectory' in navigator.storage;
};

export const getOPFSRoot = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (!isOPFSSupported()) {
    console.warn('Origin Private File System is not supported in this browser');
    return null;
  }
  
  if (opfsRoot) {
    return opfsRoot;
  }
  
  try {
    opfsRoot = await navigator.storage.getDirectory();
    return opfsRoot;
  } catch (error) {
    console.error('Failed to access OPFS:', error);
    return null;
  }
};

export const saveDesignToOPFS = async (
  name: string,
  templateType: ChipTemplateType,
  parameters: SimulationParameters,
  chipData: ChipTemplate
): Promise<SavedDesign | null> => {
  const root = await getOPFSRoot();
  if (!root) {
    return saveDesignToLocalStorage(name, templateType, parameters, chipData);
  }
  
  try {
    const designDir = await root.getDirectoryHandle(DESIGN_DIR, { create: true });
    
    const design: SavedDesign = {
      id: `design_${Date.now()}`,
      name,
      templateType,
      parameters: { ...parameters },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chipData: JSON.parse(JSON.stringify(chipData)),
    };
    
    const fileHandle = await designDir.getFileHandle(`${design.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(design, null, 2));
    await writable.close();
    
    return design;
  } catch (error) {
    console.error('Failed to save design to OPFS:', error);
    return saveDesignToLocalStorage(name, templateType, parameters, chipData);
  }
};

export const loadDesignsFromOPFS = async (): Promise<SavedDesign[]> => {
  const root = await getOPFSRoot();
  if (!root) {
    return loadDesignsFromLocalStorage();
  }
  
  const designs: SavedDesign[] = [];
  
  try {
    const designDir = await root.getDirectoryHandle(DESIGN_DIR, { create: false });
    
    const designDirWithEntries = designDir as unknown as {
      entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
    };
    
    for await (const [name, handle] of designDirWithEntries.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        try {
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();
          const design = JSON.parse(content) as SavedDesign;
          designs.push(design);
        } catch (error) {
          console.error(`Failed to load design ${name}:`, error);
        }
      }
    }
  } catch (error) {
    console.log('Designs directory not found, returning empty list');
    return loadDesignsFromLocalStorage();
  }
  
  designs.sort((a, b) => b.updatedAt - a.updatedAt);
  return designs;
};

export const deleteDesignFromOPFS = async (designId: string): Promise<boolean> => {
  const root = await getOPFSRoot();
  if (!root) {
    return deleteDesignFromLocalStorage(designId);
  }
  
  try {
    const designDir = await root.getDirectoryHandle(DESIGN_DIR, { create: false });
    await designDir.removeEntry(`${designId}.json`);
    return true;
  } catch (error) {
    console.error('Failed to delete design from OPFS:', error);
    return deleteDesignFromLocalStorage(designId);
  }
};

export const updateDesignInOPFS = async (design: SavedDesign): Promise<SavedDesign | null> => {
  const root = await getOPFSRoot();
  if (!root) {
    return updateDesignInLocalStorage(design);
  }
  
  try {
    const designDir = await root.getDirectoryHandle(DESIGN_DIR, { create: true });
    
    const updatedDesign: SavedDesign = {
      ...design,
      updatedAt: Date.now(),
    };
    
    const fileHandle = await designDir.getFileHandle(`${design.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(updatedDesign, null, 2));
    await writable.close();
    
    return updatedDesign;
  } catch (error) {
    console.error('Failed to update design in OPFS:', error);
    return updateDesignInLocalStorage(design);
  }
};

const saveDesignToLocalStorage = (
  name: string,
  templateType: ChipTemplateType,
  parameters: SimulationParameters,
  chipData: ChipTemplate
): SavedDesign | null => {
  try {
    const existingDesigns = loadDesignsFromLocalStorage();
    
    const design: SavedDesign = {
      id: `design_${Date.now()}`,
      name,
      templateType,
      parameters: { ...parameters },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chipData: JSON.parse(JSON.stringify(chipData)),
    };
    
    existingDesigns.push(design);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingDesigns));
    
    return design;
  } catch (error) {
    console.error('Failed to save design to localStorage:', error);
    return null;
  }
};

const loadDesignsFromLocalStorage = (): SavedDesign[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const designs = JSON.parse(stored) as SavedDesign[];
      designs.sort((a, b) => b.updatedAt - a.updatedAt);
      return designs;
    }
  } catch (error) {
    console.error('Failed to load designs from localStorage:', error);
  }
  return [];
};

const deleteDesignFromLocalStorage = (designId: string): boolean => {
  try {
    const existingDesigns = loadDesignsFromLocalStorage();
    const filteredDesigns = existingDesigns.filter(d => d.id !== designId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDesigns));
    return true;
  } catch (error) {
    console.error('Failed to delete design from localStorage:', error);
    return false;
  }
};

const updateDesignInLocalStorage = (design: SavedDesign): SavedDesign | null => {
  try {
    const existingDesigns = loadDesignsFromLocalStorage();
    const index = existingDesigns.findIndex(d => d.id === design.id);
    
    if (index !== -1) {
      const updatedDesign: SavedDesign = {
        ...design,
        updatedAt: Date.now(),
      };
      existingDesigns[index] = updatedDesign;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingDesigns));
      return updatedDesign;
    }
  } catch (error) {
    console.error('Failed to update design in localStorage:', error);
  }
  return null;
};

export const getStorageInfo = async (): Promise<{
  used: number;
  quota: number;
  percentage: number;
}> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      
      return {
        used,
        quota,
        percentage,
      };
    }
  } catch (error) {
    console.error('Failed to get storage info:', error);
  }
  
  return {
    used: 0,
    quota: 0,
    percentage: 0,
  };
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
