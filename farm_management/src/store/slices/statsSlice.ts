import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerStats } from '@/types';

interface StatsState extends PlayerStats {
  dayStartTime: number;
}

const initialState: StatsState = {
  money: 500,
  stamina: 270,
  maxStamina: 270,
  totalHarvested: 0,
  totalSold: 0,
  daysPlayed: 1,
  animalsOwned: 0,
  cropsPlanted: 0,
  dayStartTime: 0,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    addMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, state.money + action.payload);
    },
    subtractMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, state.money - action.payload);
    },
    setMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, action.payload);
    },
    addStamina: (state, action: PayloadAction<number>) => {
      state.stamina = Math.min(state.maxStamina, state.stamina + action.payload);
    },
    subtractStamina: (state, action: PayloadAction<number>) => {
      state.stamina = Math.max(0, state.stamina - action.payload);
    },
    setStamina: (state, action: PayloadAction<number>) => {
      state.stamina = Math.max(0, Math.min(state.maxStamina, action.payload));
    },
    increaseMaxStamina: (state, action: PayloadAction<number>) => {
      state.maxStamina += action.payload;
      state.stamina = state.maxStamina;
    },
    incrementHarvested: (state, action: PayloadAction<number>) => {
      state.totalHarvested += action.payload;
    },
    incrementSold: (state, action: PayloadAction<number>) => {
      state.totalSold += action.payload;
    },
    incrementDaysPlayed: (state) => {
      state.daysPlayed += 1;
    },
    setAnimalsOwned: (state, action: PayloadAction<number>) => {
      state.animalsOwned = action.payload;
    },
    setCropsPlanted: (state, action: PayloadAction<number>) => {
      state.cropsPlanted = action.payload;
    },
    resetDay: (state) => {
      state.stamina = state.maxStamina;
      state.daysPlayed += 1;
    },
  },
});

export const {
  addMoney,
  subtractMoney,
  setMoney,
  addStamina,
  subtractStamina,
  setStamina,
  increaseMaxStamina,
  incrementHarvested,
  incrementSold,
  incrementDaysPlayed,
  setAnimalsOwned,
  setCropsPlanted,
  resetDay,
} = statsSlice.actions;

export default statsSlice.reducer;
