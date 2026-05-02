import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GameSession, GamePhase, BoneFragment, Position, Rotation, BrushTool, GridCellState } from '../types';
import { gameApi } from '../services/api';

interface GameState {
  session: GameSession | null;
  currentPhase: GamePhase;
  excavatedBones: Record<string, boolean>;
  assembledBones: Record<string, { position: Position; rotation: Rotation; correct: boolean }>;
  gridCells: GridCellState[];
  brushTool: BrushTool;
  selectedBone: BoneFragment | null;
  draggedBone: BoneFragment | null;
  score: number;
  damagePenalty: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: GameState = {
  session: null,
  currentPhase: GamePhase.EXCAVATION,
  excavatedBones: {},
  assembledBones: {},
  gridCells: [],
  brushTool: {
    size: 0.5,
    strength: 0.3,
    type: 'medium',
  },
  selectedBone: null,
  draggedBone: null,
  score: 0,
  damagePenalty: 0,
  isLoading: false,
  error: null,
};

export const createGameSession = createAsyncThunk(
  'game/createSession',
  async (fossilId: string) => {
    return gameApi.createSession(fossilId);
  }
);

export const recordExcavation = createAsyncThunk(
  'game/recordExcavation',
  async ({ sessionId, boneId, damage }: { sessionId: string; boneId: string; damage: number }) => {
    return gameApi.recordExcavation(sessionId, boneId, damage);
  }
);

export const checkAssembly = createAsyncThunk(
  'game/checkAssembly',
  async ({
    boneId,
    position,
    rotation,
    targetPosition,
    targetRotation,
  }: {
    boneId: string;
    position: Position;
    rotation: Rotation;
    targetPosition: Position;
    targetRotation: Rotation;
  }) => {
    return gameApi.checkAssembly(boneId, position, rotation, targetPosition, targetRotation);
  }
);

export const recordAssembly = createAsyncThunk(
  'game/recordAssembly',
  async ({
    sessionId,
    boneId,
    position,
    rotation,
    isCorrect,
  }: {
    sessionId: string;
    boneId: string;
    position: Position;
    rotation: Rotation;
    isCorrect: boolean;
  }) => {
    return gameApi.recordAssembly(sessionId, boneId, position, rotation, isCorrect);
  }
);

export const advancePhase = createAsyncThunk(
  'game/advancePhase',
  async (sessionId: string) => {
    return gameApi.advancePhase(sessionId);
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentPhase: (state, action: PayloadAction<GamePhase>) => {
      state.currentPhase = action.payload;
    },
    setBrushTool: (state, action: PayloadAction<Partial<BrushTool>>) => {
      state.brushTool = { ...state.brushTool, ...action.payload };
    },
    setSelectedBone: (state, action: PayloadAction<BoneFragment | null>) => {
      state.selectedBone = action.payload;
    },
    setDraggedBone: (state, action: PayloadAction<BoneFragment | null>) => {
      state.draggedBone = action.payload;
    },
    setGridCells: (state, action: PayloadAction<GridCellState[]>) => {
      state.gridCells = action.payload;
    },
    updateGridCell: (state, action: PayloadAction<{ cellId: string; updates: Partial<GridCellState> }>) => {
      const cellIndex = state.gridCells.findIndex((cell) => cell.id === action.payload.cellId);
      if (cellIndex !== -1) {
        state.gridCells[cellIndex] = { ...state.gridCells[cellIndex], ...action.payload.updates };
      }
    },
    excavateBone: (state, action: PayloadAction<{ boneId: string; damage: number }>) => {
      state.excavatedBones[action.payload.boneId] = true;
      if (action.payload.damage > 0.5) {
        state.damagePenalty += action.payload.damage * 10;
      }
      state.score += Math.max(0, 100 - action.payload.damage * 100);
    },
    assembleBone: (
      state,
      action: PayloadAction<{
        boneId: string;
        position: Position;
        rotation: Rotation;
        correct: boolean;
      }>
    ) => {
      state.assembledBones[action.payload.boneId] = {
        position: action.payload.position,
        rotation: action.payload.rotation,
        correct: action.payload.correct,
      };
      if (action.payload.correct) {
        state.score += 200;
      }
    },
    resetGame: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGameSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGameSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = action.payload;
        state.currentPhase = action.payload.currentPhase;
        state.excavatedBones = action.payload.excavatedBones as Record<string, boolean>;
        state.assembledBones = action.payload.assembledBones;
        state.score = action.payload.score;
        state.damagePenalty = action.payload.damagePenalty;
      })
      .addCase(createGameSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create game session';
      })
      .addCase(recordExcavation.fulfilled, (state, action) => {
        if (action.payload.bone) {
          state.excavatedBones[action.payload.bone.id] = true;
        }
        if (action.payload.damage > 0.5) {
          state.damagePenalty += action.payload.damage * 10;
        }
        state.score += Math.max(0, 100 - action.payload.damage * 100);
      })
      .addCase(recordAssembly.fulfilled, (state, action) => {
        state.session = action.payload;
        state.currentPhase = action.payload.currentPhase;
        state.assembledBones = action.payload.assembledBones;
        state.score = action.payload.score;
      })
      .addCase(advancePhase.fulfilled, (state, action) => {
        state.session = action.payload;
        state.currentPhase = action.payload.currentPhase;
      });
  },
});

export const {
  setCurrentPhase,
  setBrushTool,
  setSelectedBone,
  setDraggedBone,
  setGridCells,
  updateGridCell,
  excavateBone,
  assembleBone,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
