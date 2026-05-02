import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ExperimentState, SymbolType } from '../../types';

const initialState: ExperimentState = {
  currentIngredients: [],
  isBrewing: false,
  lastResult: null,
};

const experimentSlice = createSlice({
  name: 'experiment',
  initialState,
  reducers: {
    addIngredient: (
      state,
      action: PayloadAction<{ itemId: string; slotIndex: number; symbol: SymbolType | null }>
    ) => {
      const { itemId, slotIndex, symbol } = action.payload;
      const existing = state.currentIngredients.find((i) => i.slotIndex === slotIndex);
      
      if (existing) {
        existing.itemId = itemId;
        existing.symbol = symbol;
      } else {
        state.currentIngredients.push({ itemId, slotIndex, symbol });
      }
    },
    removeIngredient: (state, action: PayloadAction<number>) => {
      state.currentIngredients = state.currentIngredients.filter(
        (i) => i.slotIndex !== action.payload
      );
    },
    updateSymbol: (
      state,
      action: PayloadAction<{ slotIndex: number; symbol: SymbolType | null }>
    ) => {
      const ingredient = state.currentIngredients.find(
        (i) => i.slotIndex === action.payload.slotIndex
      );
      if (ingredient) {
        ingredient.symbol = action.payload.symbol;
      }
    },
    clearIngredients: (state) => {
      state.currentIngredients = [];
      state.lastResult = null;
    },
    startBrewing: (state) => {
      state.isBrewing = true;
      state.lastResult = null;
    },
    finishBrewing: (
      state,
      action: PayloadAction<{
        success: boolean;
        explosion: boolean;
        resultItemId: string | null;
        message: string;
      }>
    ) => {
      state.isBrewing = false;
      state.lastResult = action.payload;
    },
    clearResult: (state) => {
      state.lastResult = null;
    },
  },
});

export const {
  addIngredient,
  removeIngredient,
  updateSymbol,
  clearIngredients,
  startBrewing,
  finishBrewing,
  clearResult,
} = experimentSlice.actions;

export default experimentSlice.reducer;
