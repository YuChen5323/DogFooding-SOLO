import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/services/api'

export interface Word {
  id: string
  text: string
  pronunciation?: string
  translation: Record<string, string>
  difficulty: number
  category: string
  hints: string[]
}

export interface Level {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  difficulty: number
  words: Word[]
  wordCount: number
  timeLimit: number
  stars: number
  unlocked: boolean
  completed: boolean
  bestScore?: number
}

export interface Category {
  id: string
  name: Record<string, string>
  icon: string
  levels: Level[]
  unlocked: boolean
}

interface LevelState {
  categories: Category[]
  currentCategory: Category | null
  currentLevel: Level | null
  loading: boolean
  error: string | null
}

const initialState: LevelState = {
  categories: [],
  currentCategory: null,
  currentLevel: null,
  loading: false,
  error: null,
}

export const fetchCategories = createAsyncThunk(
  'level/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/levels/categories')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

export const fetchLevelWords = createAsyncThunk(
  'level/fetchLevelWords',
  async (levelId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/levels/${levelId}/words`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch level words')
    }
  }
)

const levelSlice = createSlice({
  name: 'level',
  initialState,
  reducers: {
    setCurrentCategory: (state, action: PayloadAction<Category | null>) => {
      state.currentCategory = action.payload
    },
    setCurrentLevel: (state, action: PayloadAction<Level | null>) => {
      state.currentLevel = action.payload
    },
    unlockLevel: (state, action: PayloadAction<string>) => {
      const levelId = action.payload
      for (const category of state.categories) {
        const level = category.levels.find((l) => l.id === levelId)
        if (level) {
          level.unlocked = true
          break
        }
      }
    },
    completeLevel: (state, action: PayloadAction<{ levelId: string; score: number; stars: number }>) => {
      const { levelId, score, stars } = action.payload
      for (const category of state.categories) {
        const level = category.levels.find((l) => l.id === levelId)
        if (level) {
          level.completed = true
          level.bestScore = Math.max(level.bestScore || 0, score)
          level.stars = Math.max(level.stars, stars)
          
          const levelIndex = category.levels.findIndex((l) => l.id === levelId)
          if (levelIndex < category.levels.length - 1) {
            category.levels[levelIndex + 1].unlocked = true
          }
          break
        }
      }
    },
    clearLevelError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentCategory,
  setCurrentLevel,
  unlockLevel,
  completeLevel,
  clearLevelError,
} = levelSlice.actions

export default levelSlice.reducer
