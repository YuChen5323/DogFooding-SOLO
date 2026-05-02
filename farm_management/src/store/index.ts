import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import timeReducer from './slices/timeSlice';
import statsReducer from './slices/statsSlice';
import inventoryReducer from './slices/inventorySlice';
import farmReducer from './slices/farmSlice';
import barnReducer from './slices/barnSlice';
import achievementReducer from './slices/achievementSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    time: timeReducer,
    stats: statsReducer,
    inventory: inventoryReducer,
    farm: farmReducer,
    barn: barnReducer,
    achievements: achievementReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
