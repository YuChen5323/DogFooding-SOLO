import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { 
  AppContextType, 
  AppState, 
  INITIAL_APP_STATE, 
  PartLibraryItem, 
  ProjectData,
  BuildStep,
  ExportFormat,
  ToolType
} from '../types/app';
import { LDrawModelInstance } from '../types/ldraw';
import { 
  BuildModeType, 
  PlacementPreview, 
  SelectionInfo,
  BuildHistoryEntry
} from '../types/buildMode';
import { CommonParts } from '../utils/ldrawParser';
import { getBuildModeManager } from '../utils/buildModeManager';
import { 
  InstructionPDFGenerator, 
  generateBuildSteps 
} from '../utils/pdfGenerator';
import { 
  LDRExporter, 
  GLTFExport, 
  exportToLDR 
} from '../utils/fileExporter';
import { 
  OPFSStorageManager, 
  getStorageManager 
} from '../utils/storageManager';

// Actions
type AppAction =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_BUILD_MODE'; payload: BuildModeType }
  | { type: 'SET_SELECTED_PART_ID'; payload: string | null }
  | { type: 'SET_SELECTED_COLOR'; payload: number }
  | { type: 'SET_PLACEMENT_PREVIEW'; payload: PlacementPreview | null }
  | { type: 'SET_SELECTION'; payload: SelectionInfo }
  | { type: 'ADD_PART'; payload: LDrawModelInstance }
  | { type: 'REMOVE_PART'; payload: string }
  | { type: 'UPDATE_PART'; payload: { id: string; updates: Partial<LDrawModelInstance> } }
  | { type: 'SET_PARTS'; payload: LDrawModelInstance[] }
  | { type: 'SET_PART_LIBRARY'; payload: PartLibraryItem[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_COLOR_FILTER'; payload: number | null }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }
  | { type: 'TOGGLE_PHYSICS'; payload: boolean }
  | { type: 'ADD_HISTORY_ENTRY'; payload: BuildHistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_HISTORY'; payload: { history: BuildHistoryEntry[]; index: number } }
  | { type: 'RESET_STATE' };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.payload };
    case 'SET_BUILD_MODE':
      return { ...state, buildMode: action.payload };
    case 'SET_SELECTED_PART_ID':
      return { ...state, selectedPartId: action.payload };
    case 'SET_SELECTED_COLOR':
      return { ...state, selectedColor: action.payload };
    case 'SET_PLACEMENT_PREVIEW':
      return { ...state, placementPreview: action.payload };
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'ADD_PART': {
      const newParts = [...state.parts, action.payload];
      return { ...state, parts: newParts };
    }
    case 'REMOVE_PART': {
      const newParts = state.parts.filter((p) => p.id !== action.payload);
      const newSelection = {
        ...state.selection,
        selectedPartIds: state.selection.selectedPartIds.filter((id) => id !== action.payload),
        selectionMode:
          state.selection.selectedPartIds.filter((id) => id !== action.payload).length === 0
            ? 'none'
            : state.selection.selectionMode,
      };
      return { ...state, parts: newParts, selection: newSelection };
    }
    case 'UPDATE_PART': {
      const newParts = state.parts.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
      );
      return { ...state, parts: newParts };
    }
    case 'SET_PARTS':
      return { ...state, parts: action.payload };
    case 'SET_PART_LIBRARY':
      return { ...state, partLibrary: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_COLOR_FILTER':
      return { ...state, colorFilter: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingMessage: action.payload.message || '',
      };
    case 'TOGGLE_PHYSICS':
      return { ...state, isPhysicsEnabled: action.payload };
    case 'ADD_HISTORY_ENTRY': {
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), action.payload];
      const newIndex = newHistory.length - 1;
      return {
        ...state,
        history: newHistory,
        historyIndex: newIndex,
        undoAvailable: newIndex >= 0,
        redoAvailable: false,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        historyIndex: newIndex,
        undoAvailable: newIndex > 0,
        redoAvailable: true,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        historyIndex: newIndex,
        undoAvailable: true,
        redoAvailable: newIndex < state.history.length - 1,
      };
    }
    case 'SET_HISTORY':
      return {
        ...state,
        history: action.payload.history,
        historyIndex: action.payload.index,
        undoAvailable: action.payload.index > 0,
        redoAvailable: action.payload.index < action.payload.history.length - 1,
      };
    case 'RESET_STATE':
      return INITIAL_APP_STATE;
    default:
      return state;
  }
}

// Context
const AppContext = createContext<AppContextType | null>(null);

// Provider Component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);
  const [placementPartId, setPlacementPartId] = useState<string | null>(null);
  const [placementColor, setPlacementColor] = useState<number>(14);

  // Initialize part library
  useEffect(() => {
    const library: PartLibraryItem[] = [];
    
    // Convert CommonParts to library items
    for (const [partId, partData] of Object.entries(CommonParts)) {
      library.push({
        partId,
        name: partData.name,
        category: partData.category || 'Brick',
        availableColors: [1, 2, 4, 14, 15, 21, 22, 23, 24, 25, 26, 27, 28],
        partData,
      });
    }
    
    dispatch({ type: 'SET_PART_LIBRARY', payload: library });
  }, []);

  // Initialize build mode manager
  useEffect(() => {
    const manager = getBuildModeManager();
    manager.setMode(state.buildMode);
  }, []);

  // Actions
  const setTool = useCallback((tool: ToolType) => {
    dispatch({ type: 'SET_TOOL', payload: tool });
  }, []);

  const setBuildMode = useCallback((mode: BuildModeType) => {
    dispatch({ type: 'SET_BUILD_MODE', payload: mode });
    const manager = getBuildModeManager();
    manager.setMode(mode);
  }, []);

  const setViewMode = useCallback((mode: 'perspective' | 'orthographic' | 'top' | 'front' | 'side') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setSelectedPartId = useCallback((partId: string | null) => {
    dispatch({ type: 'SET_SELECTED_PART_ID', payload: partId });
  }, []);

  const setSelectedColor = useCallback((color: number) => {
    dispatch({ type: 'SET_SELECTED_COLOR', payload: color });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setColorFilter = useCallback((color: number | null) => {
    dispatch({ type: 'SET_COLOR_FILTER', payload: color });
  }, []);

  // Placement
  const startPlacement = useCallback((partId: string, color: number) => {
    setPlacementPartId(partId);
    setPlacementColor(color);
    dispatch({ type: 'SET_TOOL', payload: 'place' });
  }, []);

  const updatePlacement = useCallback((position: [number, number, number], rotation: [number, number, number]) => {
    if (!placementPartId) return;
    
    const manager = getBuildModeManager();
    const preview = manager.calculatePlacementPreview(
      placementPartId,
      placementColor,
      position,
      rotation
    );
    dispatch({ type: 'SET_PLACEMENT_PREVIEW', payload: preview });
  }, [placementPartId, placementColor]);

  const confirmPlacement = useCallback(() => {
    if (!state.placementPreview || !placementPartId) return;
    
    const newPart: LDrawModelInstance = {
      id: uuidv4(),
      partId: placementPartId,
      color: state.placementPreview.color,
      position: state.placementPreview.position,
      rotation: state.placementPreview.rotation,
      visible: true,
      locked: false,
    };
    
    dispatch({ type: 'ADD_PART', payload: newPart });
    dispatch({ type: 'SET_PLACEMENT_PREVIEW', payload: null });
    
    // Add to history
    dispatch({
      type: 'ADD_HISTORY_ENTRY',
      payload: {
        id: uuidv4(),
        type: 'add',
        timestamp: Date.now(),
        description: `添加零件 ${placementPartId}`,
        affectedPartIds: [newPart.id],
        afterState: { ...newPart },
      },
    });
  }, [state.placementPreview, placementPartId]);

  const cancelPlacement = useCallback(() => {
    dispatch({ type: 'SET_PLACEMENT_PREVIEW', payload: null });
    setPlacementPartId(null);
  }, []);

  // Selection
  const selectPart = useCallback((partId: string, addToSelection: boolean = false) => {
    const manager = getBuildModeManager();
    manager.selectPart(partId, addToSelection);
    const selection = manager.getSelection();
    dispatch({ type: 'SET_SELECTION', payload: selection });
  }, []);

  const deselectPart = useCallback((partId: string) => {
    const manager = getBuildModeManager();
    manager.deselectPart(partId);
    const selection = manager.getSelection();
    dispatch({ type: 'SET_SELECTION', payload: selection });
  }, []);

  const clearSelection = useCallback(() => {
    const manager = getBuildModeManager();
    manager.clearSelection();
    dispatch({ type: 'SET_SELECTION', payload: { selectedPartIds: [], selectionMode: 'none' } });
  }, []);

  // Part manipulation
  const deleteSelectedParts = useCallback(() => {
    const partIdsToDelete = [...state.selection.selectedPartIds];
    partIdsToDelete.forEach((id) => {
      dispatch({ type: 'REMOVE_PART', payload: id });
    });
    
    if (partIdsToDelete.length > 0) {
      dispatch({
        type: 'ADD_HISTORY_ENTRY',
        payload: {
          id: uuidv4(),
          type: 'remove',
          timestamp: Date.now(),
          description: `删除 ${partIdsToDelete.length} 个零件`,
          affectedPartIds: partIdsToDelete,
        },
      });
    }
  }, [state.selection.selectedPartIds]);

  const rotateSelected = useCallback((axis: 'x' | 'y' | 'z', degrees: number) => {
    state.selection.selectedPartIds.forEach((partId) => {
      const part = state.parts.find((p) => p.id === partId);
      if (!part) return;
      
      const newRotation: [number, number, number] = [...part.rotation] as [number, number, number];
      const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      newRotation[axisIndex] = (newRotation[axisIndex] + degrees) % 360;
      
      dispatch({ type: 'UPDATE_PART', payload: { id: partId, updates: { rotation: newRotation } } });
    });
    
    if (state.selection.selectedPartIds.length > 0) {
      dispatch({
        type: 'ADD_HISTORY_ENTRY',
        payload: {
          id: uuidv4(),
          type: 'rotate',
          timestamp: Date.now(),
          description: `旋转 ${state.selection.selectedPartIds.length} 个零件`,
          affectedPartIds: [...state.selection.selectedPartIds],
        },
      });
    }
  }, [state.selection.selectedPartIds, state.parts]);

  // Undo/Redo
  const undo = useCallback(() => {
    const manager = getBuildModeManager();
    if (manager.canUndo()) {
      manager.undo();
      dispatch({ type: 'UNDO' });
    }
  }, []);

  const redo = useCallback(() => {
    const manager = getBuildModeManager();
    if (manager.canRedo()) {
      manager.redo();
      dispatch({ type: 'REDO' });
    }
  }, []);

  // Physics
  const togglePhysics = useCallback(() => {
    dispatch({ type: 'TOGGLE_PHYSICS', payload: !state.isPhysicsEnabled });
  }, [state.isPhysicsEnabled]);

  // Project operations
  const newProject = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    const manager = getBuildModeManager();
    manager.clearAllParts();
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: '加载项目...' } });
    try {
      const storageManager = getStorageManager();
      await storageManager.initialize();
      const project = await storageManager.loadProject(projectId);
      
      dispatch({ type: 'SET_PARTS', payload: project.parts });
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('加载项目失败:', error);
      alert('加载项目失败: ' + (error as Error).message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, []);

  const saveProject = useCallback(async (name: string = '我的乐高模型') => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: '保存项目...' } });
    try {
      const storageManager = getStorageManager();
      await storageManager.initialize();
      
      // 生成拼装步骤
      const steps = generateBuildSteps(state.parts);
      
      await storageManager.saveProject(state.parts, name, steps);
      alert('项目保存成功！');
    } catch (error) {
      console.error('保存项目失败:', error);
      alert('保存项目失败: ' + (error as Error).message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [state.parts]);

  const exportProject = useCallback(async (format: ExportFormat) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: `导出 ${format.toUpperCase()}...` } });
    try {
      if (state.parts.length === 0) {
        alert('没有零件可以导出！');
        return;
      }
      
      const timestamp = new Date().toISOString().slice(0, 10);
      
      if (format === 'ldr') {
        exportToLDR(state.parts, `brickcraft_model_${timestamp}.ldr`);
      } else if (format === 'gltf') {
        const gltfExporter = new GLTFExport();
        await gltfExporter.downloadGLTF(state.parts, `brickcraft_model_${timestamp}.gltf`);
      }
      
      alert(`导出 ${format.toUpperCase()} 成功！`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败: ' + (error as Error).message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [state.parts]);

  const generateInstructions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: '生成拼装步骤...' } });
    try {
      if (state.parts.length === 0) {
        alert('没有零件可以生成步骤！');
        return;
      }
      
      // 生成拼装步骤
      const steps = generateBuildSteps(state.parts);
      console.log('生成的步骤:', steps);
      
      alert(`生成了 ${steps.length} 个拼装步骤！`);
    } catch (error) {
      console.error('生成步骤失败:', error);
      alert('生成步骤失败: ' + (error as Error).message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [state.parts]);

  const exportPDF = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: '生成PDF说明书...' } });
    try {
      if (state.parts.length === 0) {
        alert('没有零件可以生成说明书！');
        return;
      }
      
      // 生成拼装步骤
      const steps = generateBuildSteps(state.parts);
      
      // 生成PDF
      const pdfGenerator = new InstructionPDFGenerator();
      const doc = pdfGenerator.generate('BrickCraft 模型', state.parts, steps);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`brickcraft_instructions_${timestamp}.pdf`);
      
      alert('PDF说明书生成成功！');
    } catch (error) {
      console.error('生成PDF失败:', error);
      alert('生成PDF失败: ' + (error as Error).message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [state.parts]);

  // Part library
  const getPartById = useCallback((partId: string) => {
    return state.partLibrary.find((p) => p.partId === partId);
  }, [state.partLibrary]);

  const getFilteredParts = useCallback(() => {
    let filtered = [...state.partLibrary];
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.partId.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query)
      );
    }
    
    if (state.colorFilter !== null) {
      filtered = filtered.filter((p) => p.availableColors.includes(state.colorFilter!));
    }
    
    return filtered;
  }, [state.partLibrary, state.searchQuery, state.colorFilter]);

  const contextValue: AppContextType = {
    state,
    setTool,
    setBuildMode,
    setViewMode,
    setSelectedPartId,
    setSelectedColor,
    setSearchQuery,
    setColorFilter,
    startPlacement,
    updatePlacement,
    confirmPlacement,
    cancelPlacement,
    selectPart,
    deselectPart,
    clearSelection,
    deleteSelectedParts,
    rotateSelected,
    undo,
    redo,
    togglePhysics,
    newProject,
    loadProject,
    saveProject,
    exportProject,
    generateInstructions,
    exportPDF,
    getPartById,
    getFilteredParts,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Hook
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export default AppContext;
