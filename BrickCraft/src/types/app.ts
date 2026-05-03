import { LDrawModelInstance, LDrawPart } from './ldraw';
import { BuildModeType, PlacementPreview, SelectionInfo, BuildHistoryEntry, SnapType } from './buildMode';

export type ToolType = 'select' | 'place' | 'move' | 'rotate' | 'delete';
export type ViewMode = 'perspective' | 'orthographic' | 'top' | 'front' | 'side';
export type ExportFormat = 'ldr' | 'gltf';

export interface PartInventory {
  partId: string;
  count: number;
  color: number;
}

export interface BuildStep {
  stepNumber: number;
  parts: LDrawModelInstance[];
  description?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  parts: LDrawModelInstance[];
  steps?: BuildStep[];
  thumbnail?: string;
}

export interface PartLibraryItem {
  partId: string;
  name: string;
  category: string;
  availableColors: number[];
  partData: LDrawPart;
}

export interface AppState {
  tool: ToolType;
  buildMode: BuildModeType;
  viewMode: ViewMode;
  selectedPartId: string | null;
  selectedColor: number;
  placementPreview: PlacementPreview | null;
  selection: SelectionInfo;
  history: BuildHistoryEntry[];
  historyIndex: number;
  parts: LDrawModelInstance[];
  partLibrary: PartLibraryItem[];
  searchQuery: string;
  colorFilter: number | null;
  isPhysicsEnabled: boolean;
  isLoading: boolean;
  loadingMessage: string;
  undoAvailable: boolean;
  redoAvailable: boolean;
}

export interface AppContextType {
  state: AppState;
  
  // Tool and mode controls
  setTool: (tool: ToolType) => void;
  setBuildMode: (mode: BuildModeType) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Part selection for placing
  setSelectedPartId: (partId: string | null) => void;
  setSelectedColor: (color: number) => void;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setColorFilter: (color: number | null) => void;
  
  // Placement
  startPlacement: (partId: string, color: number) => void;
  updatePlacement: (position: [number, number, number], rotation: [number, number, number]) => void;
  confirmPlacement: () => void;
  cancelPlacement: () => void;
  
  // Selection
  selectPart: (partId: string, addToSelection?: boolean) => void;
  deselectPart: (partId: string) => void;
  clearSelection: () => void;
  
  // Part manipulation
  deleteSelectedParts: () => void;
  rotateSelected: (axis: 'x' | 'y' | 'z', degrees: number) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  
  // Physics
  togglePhysics: () => void;
  
  // Project operations
  newProject: () => void;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (name?: string) => Promise<void>;
  exportProject: (format: ExportFormat) => Promise<void>;
  generateInstructions: () => Promise<void>;
  exportPDF: () => Promise<void>;
  
  // Part library
  getPartById: (partId: string) => PartLibraryItem | undefined;
  getFilteredParts: () => PartLibraryItem[];
}

export const INITIAL_APP_STATE: AppState = {
  tool: 'place',
  buildMode: 'precision',
  viewMode: 'perspective',
  selectedPartId: '3001',
  selectedColor: 14,
  placementPreview: null,
  selection: {
    selectedPartIds: [],
    selectionMode: 'none',
  },
  history: [],
  historyIndex: -1,
  parts: [],
  partLibrary: [],
  searchQuery: '',
  colorFilter: null,
  isPhysicsEnabled: true,
  isLoading: false,
  loadingMessage: '',
  undoAvailable: false,
  redoAvailable: false,
};
