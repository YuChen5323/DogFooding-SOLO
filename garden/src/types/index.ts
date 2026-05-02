export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type CameraMode = 'birdseye' | 'firstperson';

export type GardenElementType = 
  | 'pavilion' 
  | 'corridor' 
  | 'waterside_pavilion'
  | 'rockery'
  | 'taihu_stone'
  | 'tree'
  | 'shrub'
  | 'water'
  | 'bridge'
  | 'path';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface Scale3D {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Position3D;
  rotation: Rotation3D;
  scale: Scale3D;
}

export interface GardenElement {
  id: string;
  type: GardenElementType;
  transform: Transform;
  seed: number;
  parameters: Record<string, number | boolean | string>;
}

export interface GridCell {
  x: number;
  z: number;
  element: GardenElement | null;
  constraints: WFCConstraint[];
  availableTypes: GardenElementType[];
  entropy: number;
}

export interface WFCConstraint {
  direction: 'north' | 'south' | 'east' | 'west';
  allowedTypes: GardenElementType[];
  forbiddenTypes: GardenElementType[];
}

export interface LSystemRule {
  symbol: string;
  replacement: string;
  probability?: number;
}

export interface LSystemConfig {
  axiom: string;
  rules: LSystemRule[];
  iterations: number;
  angle: number;
  stepSize: number;
}

export interface FengShuiRules {
  waterPosition: 'north' | 'south' | 'east' | 'west' | 'center';
  mountainPosition: 'north' | 'northeast' | 'northwest';
  entranceDirection: 'south' | 'east' | 'southeast';
  avoidNegativeEnergy: boolean;
  balanceElements: boolean;
}

export interface GlobalParameters {
  lakeSize: number;
  vegetationDensity: number;
  season: Season;
  timeOfDay: TimeOfDay;
  seed: number;
  gridSize: number;
}

export interface SceneState {
  elements: GardenElement[];
  grid: GridCell[][];
  isGenerating: boolean;
  generationProgress: number;
  lastUpdateTime: number;
}

export interface CameraState {
  mode: CameraMode;
  position: Position3D;
  target: Position3D;
  fov: number;
}

export interface LightSettings {
  sunIntensity: number;
  sunPosition: Position3D;
  sunColor: string;
  ambientIntensity: number;
  ambientColor: string;
  fogDensity: number;
  fogColor: string;
}

export interface ExportOptions {
  format: 'glb' | 'gltf';
  includeMaterials: boolean;
  includeAnimations: boolean;
  compressTextures: boolean;
}

export interface ScreenshotOptions {
  width: number;
  height: number;
  transparentBackground: boolean;
  layers: ('terrain' | 'architecture' | 'vegetation' | 'water' | 'rocks')[];
}
