import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/services/api'

export interface Achievement {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  icon: string
  category: 'beginner' | 'intermediate' | 'advanced' | 'master'
  condition: {
    type: 'words_learned' | 'score' | 'combo' | 'streak' | 'levels_completed' | 'perfect_games'
    value: number
  }
  unlocked: boolean
  unlockedAt?: string
  reward: number
}

interface AchievementState {
  achievements: Achievement[]
  loading: boolean
  error: string | null
  showAchievementModal: boolean
  latestAchievement: Achievement | null
}

const initialState: AchievementState = {
  achievements: [],
  loading: false,
  error: null,
  showAchievementModal: false,
  latestAchievement: null,
}

export const fetchAchievements = createAsyncThunk(
  'achievement/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/achievements')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch achievements')
    }
  }
)

export const checkAchievements = createAsyncThunk(
  'achievement/checkAchievements',
  async (stats: {
    totalWordsLearned: number
    highScore: number
    maxCombo: number
    streak: number
    levelsCompleted: number
    perfectGames: number
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/achievements/check', stats)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check achievements')
    }
  }
)

const achievementSlice = createSlice({
  name: 'achievement',
  initialState,
  reducers: {
    unlockAchievement: (state, action: PayloadAction<string>) => {
      const achievement = state.achievements.find((a) => a.id === action.payload)
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true
        achievement.unlockedAt = new Date().toISOString()
        state.latestAchievement = achievement
        state.showAchievementModal = true
      }
    },
    hideAchievementModal: (state) => {
      state.showAchievementModal = false
      state.latestAchievement = null
    },
    clearAchievementError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading = false
        state.achievements = action.payload
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
        const newlyUnlocked = action.payload as Achievement[]
        newlyUnlocked.forEach((achievement) => {
          const existing = state.achievements.find((a) => a.id === achievement.id)
          if (existing && !existing.unlocked) {
            existing.unlocked = true
            existing.unlockedAt = achievement.unlockedAt
          }
        })
        if (newlyUnlocked.length > 0) {
          state.latestAchievement = newlyUnlocked[newlyUnlocked.length - 1]
          state.showAchievementModal = true
        }
      })
  },
})

export const { unlockAchievement, hideAchievementModal, clearAchievementError } =
  achievementSlice.actions

export default achievementSlice.reducer
