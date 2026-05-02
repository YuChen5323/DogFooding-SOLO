import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameState } from '../../types';

const initialState: GameState = {
  gold: 100,
  reputation: 0,
  currentLevel: 1,
  experience: 0,
  discoveredRecipes: ['recipe_healing', 'recipe_mana'],
  completedQuests: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addGold: (state, action: PayloadAction<number>) => {
      state.gold += action.payload;
    },
    removeGold: (state, action: PayloadAction<number>) => {
      state.gold = Math.max(0, state.gold - action.payload);
    },
    addReputation: (state, action: PayloadAction<number>) => {
      state.reputation += action.payload;
    },
    addExperience: (state, action: PayloadAction<number>) => {
      state.experience += action.payload;
      const expNeeded = state.currentLevel * 100;
      if (state.experience >= expNeeded) {
        state.experience -= expNeeded;
        state.currentLevel += 1;
      }
    },
    discoverRecipe: (state, action: PayloadAction<string>) => {
      if (!state.discoveredRecipes.includes(action.payload)) {
        state.discoveredRecipes.push(action.payload);
      }
    },
    completeQuest: (state, action: PayloadAction<string>) => {
      if (!state.completedQuests.includes(action.payload)) {
        state.completedQuests.push(action.payload);
      }
    },
    resetGame: () => initialState,
  },
});

export const {
  addGold,
  removeGold,
  addReputation,
  addExperience,
  discoverRecipe,
  completeQuest,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
