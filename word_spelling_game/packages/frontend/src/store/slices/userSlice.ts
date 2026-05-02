import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/services/api'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  level: number
  experience: number
  coins: number
  totalWordsLearned: number
  streak: number
  lastLogin: string
  friends: string[]
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      return { token, user }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'user/register',
  async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      return { token, user }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const logout = createAsyncThunk('user/logout', async () => {
  localStorage.removeItem('token')
  return null
})

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as { user: AuthState }
    if (!state.user.token) {
      return rejectWithValue('No token')
    }
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user')
    }
  }
)

export const updateProgress = createAsyncThunk(
  'user/updateProgress',
  async (progress: { levelId: string; score: number; wordsLearned: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/update', progress)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update progress')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateLocalUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.token = null
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
  },
})

export const { clearError, updateLocalUser } = userSlice.actions
export default userSlice.reducer
