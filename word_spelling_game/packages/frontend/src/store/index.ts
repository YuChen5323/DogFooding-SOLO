import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import userReducer from './slices/userSlice'
import gameReducer from './slices/gameSlice'
import levelReducer from './slices/levelSlice'
import achievementReducer from './slices/achievementSlice'
import leaderboardReducer from './slices/leaderboardSlice'
import settingsReducer from './slices/settingsSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    game: gameReducer,
    level: levelReducer,
    achievement: achievementReducer,
    leaderboard: leaderboardReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
