import { create } from 'zustand';
import type {
  GlobalParameters,
  SceneState,
  CameraState,
  LightSettings,
  GardenElement,
  GridCell,
  Season,
  TimeOfDay,
  CameraMode,
} from '../types';

interface GardenStore {
  globalParams: GlobalParameters;
  sceneState: SceneState;
  cameraState: CameraState;
  lightSettings: LightSettings;
  
  setGlobalParams: (params: Partial<GlobalParameters>) => void;
  updateGlobalParam: <K extends keyof GlobalParameters>(
    key: K,
    value: GlobalParameters[K]
  ) => void;
  
  setSceneState: (state: Partial<SceneState>) => void;
  setElements: (elements: GardenElement[]) => void;
  setGrid: (grid: GridCell[][]) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  
  setCameraState: (state: Partial<CameraState>) => void;
  setCameraMode: (mode: CameraMode) => void;
  
  updateLightSettings: (timeOfDay: TimeOfDay, season: Season) => void;
  
  regenerateScene: () => void;
  randomizeSeed: () => void;
}

const getLightSettingsForTime = (
  timeOfDay: TimeOfDay,
  season: Season
): LightSettings => {
  const seasonMultiplier = season === 'winter' ? 0.7 : season === 'autumn' ? 0.85 : 1;
  
  const timeConfigs: Record<TimeOfDay, Partial<LightSettings>> = {
    dawn: {
      sunIntensity: 0.6 * seasonMultiplier,
      sunPosition: { x: -15, y: 8, z: 0 },
      sunColor: '#ff9966',
      ambientIntensity: 0.4,
      ambientColor: '#ffccaa',
      fogDensity: 0.015,
      fogColor: '#ffe4cc',
    },
    day: {
      sunIntensity: 1.2 * seasonMultiplier,
      sunPosition: { x: 0, y: 25, z: 10 },
      sunColor: '#ffffff',
      ambientIntensity: 0.6,
      ambientColor: '#e8f0f8',
      fogDensity: 0.008,
      fogColor: '#d0e0f0',
    },
    dusk: {
      sunIntensity: 0.5 * seasonMultiplier,
      sunPosition: { x: 15, y: 6, z: 0 },
      sunColor: '#ff6644',
      ambientIntensity: 0.35,
      ambientColor: '#ffaa88',
      fogDensity: 0.02,
      fogColor: '#ffd4cc',
    },
    night: {
      sunIntensity: 0.1,
      sunPosition: { x: -10, y: 15, z: -10 },
      sunColor: '#aaccff',
      ambientIntensity: 0.15,
      ambientColor: '#1a2a4a',
      fogDensity: 0.012,
      fogColor: '#0a1428',
    },
  };
  
  return {
    sunIntensity: 1,
    sunPosition: { x: 0, y: 20, z: 0 },
    sunColor: '#ffffff',
    ambientIntensity: 0.5,
    ambientColor: '#e8f0f8',
    fogDensity: 0.01,
    fogColor: '#d0e0f0',
    ...timeConfigs[timeOfDay],
  };
};

const initialGlobalParams: GlobalParameters = {
  lakeSize: 0.35,
  vegetationDensity: 0.6,
  season: 'spring',
  timeOfDay: 'day',
  seed: Date.now(),
  gridSize: 12,
};

const initialSceneState: SceneState = {
  elements: [],
  grid: [],
  isGenerating: false,
  generationProgress: 0,
  lastUpdateTime: Date.now(),
};

const initialCameraState: CameraState = {
  mode: 'birdseye',
  position: { x: 0, y: 40, z: 0 },
  target: { x: 0, y: 0, z: 0 },
  fov: 45,
};

const initialLightSettings: LightSettings = getLightSettingsForTime(
  initialGlobalParams.timeOfDay,
  initialGlobalParams.season
);

export const useGardenStore = create<GardenStore>((set, get) => ({
  globalParams: initialGlobalParams,
  sceneState: initialSceneState,
  cameraState: initialCameraState,
  lightSettings: initialLightSettings,

  setGlobalParams: (params) => {
    set((state) => ({
      globalParams: { ...state.globalParams, ...params },
    }));
    
    const { timeOfDay, season } = get().globalParams;
    get().updateLightSettings(timeOfDay, season);
  },

  updateGlobalParam: (key, value) => {
    set((state) => ({
      globalParams: { ...state.globalParams, [key]: value },
    }));
    
    if (key === 'timeOfDay' || key === 'season') {
      const { timeOfDay, season } = get().globalParams;
      get().updateLightSettings(timeOfDay, season);
    }
  },

  setSceneState: (state) => {
    set((prev) => ({
      sceneState: { ...prev.sceneState, ...state },
    }));
  },

  setElements: (elements) => {
    set((state) => ({
      sceneState: {
        ...state.sceneState,
        elements,
        lastUpdateTime: Date.now(),
      },
    }));
  },

  setGrid: (grid) => {
    set((state) => ({
      sceneState: {
        ...state.sceneState,
        grid,
        lastUpdateTime: Date.now(),
      },
    }));
  },

  setGenerating: (isGenerating) => {
    set((state) => ({
      sceneState: { ...state.sceneState, isGenerating },
    }));
  },

  setGenerationProgress: (progress) => {
    set((state) => ({
      sceneState: { ...state.sceneState, generationProgress: progress },
    }));
  },

  setCameraState: (state) => {
    set((prev) => ({
      cameraState: { ...prev.cameraState, ...state },
    }));
  },

  setCameraMode: (mode) => {
    const { globalParams } = get();
    const halfGrid = (globalParams.gridSize * 2) / 2;
    
    if (mode === 'birdseye') {
      set((state) => ({
        cameraState: {
          ...state.cameraState,
          mode,
          position: { x: 0, y: 40, z: 0 },
          target: { x: 0, y: 0, z: 0 },
          fov: 45,
        },
      }));
    } else {
      set((state) => ({
        cameraState: {
          ...state.cameraState,
          mode,
          position: { x: -halfGrid + 2, y: 2, z: halfGrid - 2 },
          target: { x: 0, y: 1.5, z: 0 },
          fov: 60,
        },
      }));
    }
  },

  updateLightSettings: (timeOfDay, season) => {
    const settings = getLightSettingsForTime(timeOfDay, season);
    set({ lightSettings: settings });
  },

  regenerateScene: () => {
    const { seed } = get().globalParams;
    set((state) => ({
      sceneState: {
        ...state.sceneState,
        elements: [],
        isGenerating: true,
        generationProgress: 0,
        lastUpdateTime: Date.now(),
      },
    }));
  },

  randomizeSeed: () => {
    const newSeed = Date.now() + Math.random() * 10000;
    set((state) => ({
      globalParams: { ...state.globalParams, seed: newSeed },
    }));
  },
}));
