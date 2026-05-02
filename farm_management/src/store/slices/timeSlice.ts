import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameTime, Season, TimeOfDay } from '@/types';
import { getFestivalByDate } from '@/data/festivals';

interface TimeState extends GameTime {
  isPaused: boolean;
  timeSpeed: number;
  festivalActive: boolean;
}

const getInitialSeason = (month: number): Season => {
  if (month >= 1 && month <= 3) return Season.SPRING;
  if (month >= 4 && month <= 6) return Season.SUMMER;
  if (month >= 7 && month <= 9) return Season.AUTUMN;
  return Season.WINTER;
};

const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 6 && hour < 10) return TimeOfDay.MORNING;
  if (hour >= 10 && hour < 14) return TimeOfDay.NOON;
  if (hour >= 14 && hour < 18) return TimeOfDay.AFTERNOON;
  if (hour >= 18 && hour < 21) return TimeOfDay.EVENING;
  return TimeOfDay.NIGHT;
};

const initialState: TimeState = {
  day: 1,
  month: 1,
  year: 1,
  hour: 6,
  minute: 0,
  season: Season.SPRING,
  timeOfDay: TimeOfDay.MORNING,
  isPaused: false,
  timeSpeed: 1,
  festivalActive: false,
};

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    updateTime: (state, action: PayloadAction<{ minutes: number }>) => {
      if (state.isPaused) return;

      const { minutes } = action.payload;
      state.minute += minutes * state.timeSpeed;

      while (state.minute >= 60) {
        state.minute -= 60;
        state.hour += 1;
      }

      while (state.hour >= 24) {
        state.hour -= 24;
        state.day += 1;
      }

      while (state.day > 28) {
        state.day -= 28;
        state.month += 1;
      }

      while (state.month > 12) {
        state.month -= 12;
        state.year += 1;
      }

      state.season = getInitialSeason(state.month);
      state.timeOfDay = getTimeOfDay(state.hour);

      const festival = getFestivalByDate(state.season, state.day);
      if (festival && state.hour >= festival.startTime && state.hour < festival.endTime) {
        state.festivalActive = true;
      } else {
        state.festivalActive = false;
      }
    },
    setTime: (state, action: PayloadAction<Partial<GameTime>>) => {
      Object.assign(state, action.payload);
      if (action.payload.month !== undefined) {
        state.season = getInitialSeason(action.payload.month);
      }
      if (action.payload.hour !== undefined) {
        state.timeOfDay = getTimeOfDay(action.payload.hour);
      }
    },
    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },
    setPause: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
    setTimeSpeed: (state, action: PayloadAction<number>) => {
      state.timeSpeed = Math.max(0.5, Math.min(5, action.payload));
    },
    advanceDay: (state) => {
      state.day += 1;
      if (state.day > 28) {
        state.day = 1;
        state.month += 1;
        if (state.month > 12) {
          state.month = 1;
          state.year += 1;
        }
        state.season = getInitialSeason(state.month);
      }
      state.hour = 6;
      state.minute = 0;
      state.timeOfDay = getTimeOfDay(6);
    },
  },
});

export const { 
  updateTime, 
  setTime, 
  togglePause, 
  setPause, 
  setTimeSpeed,
  advanceDay 
} = timeSlice.actions;

export default timeSlice.reducer;
