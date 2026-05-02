import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/services/api'

export interface LeaderboardEntry {
  id: string
  userId: string
  username: string
  avatar?: string
  score: number
  rank: number
  gameMode: 'falling' | 'puzzle' | 'speed' | 'all'
  date: string
}

type LeaderboardType = 'global' | 'friends'
type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time'

interface LeaderboardState {
  global: LeaderboardEntry[]
  friends: LeaderboardEntry[]
  currentType: LeaderboardType
  currentPeriod: LeaderboardPeriod
  currentMode: 'falling' | 'puzzle' | 'speed' | 'all'
  loading: boolean
  error: string | null
}

const initialState: LeaderboardState = {
  global: [],
  friends: [],
  currentType: 'global',
  currentPeriod: 'all_time',
  currentMode: 'all',
  loading: false,
  error: null,
}

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (
    params: {
      type: LeaderboardType
      period: LeaderboardPeriod
      mode: 'falling' | 'puzzle' | 'speed' | 'all'
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/leaderboard', {
        params: {
          type: params.type,
          period: params.period,
          mode: params.mode,
        },
      })
      return { type: params.type, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard')
    }
  }
)

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setLeaderboardType: (state, action: PayloadAction<LeaderboardType>) => {
      state.currentType = action.payload
    },
    setLeaderboardPeriod: (state, action: PayloadAction<LeaderboardPeriod>) => {
      state.currentPeriod = action.payload
    },
    setLeaderboardMode: (state, action: PayloadAction<'falling' | 'puzzle' | 'speed' | 'all'>) => {
      state.currentMode = action.payload
    },
    clearLeaderboardError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.type === 'global') {
          state.global = action.payload.data
        } else {
          state.friends = action.payload.data
        }
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setLeaderboardType,
  setLeaderboardPeriod,
  setLeaderboardMode,
  clearLeaderboardError,
} = leaderboardSlice.actions

export default leaderboardSlice.reducer
