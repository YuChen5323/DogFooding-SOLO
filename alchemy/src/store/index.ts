import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import inventoryReducer from './slices/inventorySlice';
import gameReducer from './slices/gameSlice';
import experimentReducer from './slices/experimentSlice';
import questReducer from './slices/questSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    game: gameReducer,
    experiment: experimentReducer,
    quest: questReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
