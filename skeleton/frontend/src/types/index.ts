export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Scale {
  x: number;
  y: number;
  z: number;
}

export interface BoneFragment {
  id: string;
  name: string;
  type: string;
  targetPosition: Position;
  targetRotation: Rotation;
  targetScale: Scale;
  anatomyPosition: string;
  isExposed: boolean;
  isAssembled: boolean;
  damageLevel: number;
  buriedPosition: Position;
  buriedRotation: Rotation;
  depth: number;
}

export interface Fossil {
  _id: string;
  name: string;
  species: string;
  period: string;
  description: string;
  difficulty: number;
  bones: BoneFragment[];
  createdAt: string;
  updatedAt: string;
}

export enum GamePhase {
  EXCAVATION = 'excavation',
  ASSEMBLY = 'assembly',
  RECONSTRUCTION = 'reconstruction',
  MUSEUM = 'museum',
}

export interface AssembledBone {
  position: Position;
  rotation: Rotation;
  correct: boolean;
}

export interface GameSession {
  _id: string;
  playerId: string;
  fossil: Fossil;
  currentPhase: GamePhase;
  excavatedBones: Record<string, boolean>;
  assembledBones: Record<string, AssembledBone>;
  score: number;
  damagePenalty: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssemblyCheckResult {
  isCorrect: boolean;
  positionAccuracy: number;
  rotationAccuracy: number;
  feedback: string;
}

export interface ExcavationResult {
  success: boolean;
  damage: number;
  bone: BoneFragment;
}

export interface BrushTool {
  size: number;
  strength: number;
  type: 'soft' | 'medium' | 'hard';
}

export interface ExcavationGridCell {
  id: string;
  row: number;
  col: number;
  depth: number;
  hasBone: boolean;
  boneId?: string;
  excavatedLevel: number;
}

export interface GridCellState {
  id: string;
  excavated: boolean;
  hasBone: boolean;
  boneVisible: boolean;
  damage: number;
}
