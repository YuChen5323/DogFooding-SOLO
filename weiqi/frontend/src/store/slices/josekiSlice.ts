import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Joseki, JosekiCategory, MoveNode } from '@/types'
import { josekiApi } from '@/services/api'

interface JosekiSliceState {
  categories: JosekiCategory[]
  josekiList: Joseki[]
  currentJoseki: Joseki | null
  currentMoveNode: MoveNode | null
  autoplaySpeed: number
  isAutoplaying: boolean
  searchQuery: string
  selectedCategory: string | null
  loading: boolean
  error: string | null
}

const initialState: JosekiSliceState = {
  categories: [],
  josekiList: [],
  currentJoseki: null,
  currentMoveNode: null,
  autoplaySpeed: 1000,
  isAutoplaying: false,
  searchQuery: '',
  selectedCategory: null,
  loading: false,
  error: null,
}

export const fetchCategories = createAsyncThunk(
  'joseki/fetchCategories',
  async () => {
    return await josekiApi.getCategories()
  }
)

export const fetchJosekiByCategory = createAsyncThunk(
  'joseki/fetchByCategory',
  async (categoryId: string) => {
    return await josekiApi.getJosekiByCategory(categoryId)
  }
)

export const searchJoseki = createAsyncThunk(
  'joseki/search',
  async (query: string) => {
    return await josekiApi.searchJoseki(query)
  }
)

export const fetchJoseki = createAsyncThunk(
  'joseki/fetch',
  async (id: string) => {
    return await josekiApi.getJoseki(id)
  }
)

export const fetchRandomJoseki = createAsyncThunk(
  'joseki/fetchRandom',
  async (difficulty?: string) => {
    return await josekiApi.getRandomJoseki(difficulty)
  }
)

export const josekiSlice = createSlice({
  name: 'joseki',
  initialState,
  reducers: {
    selectJoseki: (state, action: PayloadAction<Joseki | null>) => {
      state.currentJoseki = action.payload
      state.currentMoveNode = action.payload ? action.payload.moveTree : null
    },

    setCurrentMoveNode: (state, action: PayloadAction<MoveNode | null>) => {
      state.currentMoveNode = action.payload
    },

    goToParentNode: (state) => {
      if (state.currentMoveNode && state.currentMoveNode.parentId) {
        let parent: MoveNode | null = null
        const findParent = (node: MoveNode, targetId: string): MoveNode | null => {
          if (node.id === targetId) return node
          for (const child of node.children) {
            const found = findParent(child, targetId)
            if (found) return found
          }
          return null
        }
        if (state.currentJoseki) {
          parent = findParent(state.currentJoseki.moveTree, state.currentMoveNode.parentId)
        }
        state.currentMoveNode = parent
      }
    },

    goToChildNode: (state, action: PayloadAction<number>) => {
      if (state.currentMoveNode && state.currentMoveNode.children.length > action.payload) {
        state.currentMoveNode = state.currentMoveNode.children[action.payload]
      }
    },

    setAutoplaySpeed: (state, action: PayloadAction<number>) => {
      state.autoplaySpeed = action.payload
    },

    setIsAutoplaying: (state, action: PayloadAction<boolean>) => {
      state.isAutoplaying = action.payload
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload
    },

    clearError: (state) => {
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
        state.categories = action.payload
        state.loading = false
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.error.message || '获取分类失败'
        state.loading = false
      })

      .addCase(fetchJosekiByCategory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJosekiByCategory.fulfilled, (state, action) => {
        state.josekiList = action.payload
        state.loading = false
      })
      .addCase(fetchJosekiByCategory.rejected, (state, action) => {
        state.error = action.error.message || '获取定式列表失败'
        state.loading = false
      })

      .addCase(searchJoseki.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchJoseki.fulfilled, (state, action) => {
        state.josekiList = action.payload
        state.loading = false
      })
      .addCase(searchJoseki.rejected, (state, action) => {
        state.error = action.error.message || '搜索定式失败'
        state.loading = false
      })

      .addCase(fetchJoseki.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJoseki.fulfilled, (state, action) => {
        state.currentJoseki = action.payload
        state.currentMoveNode = action.payload.moveTree
        state.loading = false
      })
      .addCase(fetchJoseki.rejected, (state, action) => {
        state.error = action.error.message || '获取定式失败'
        state.loading = false
      })

      .addCase(fetchRandomJoseki.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRandomJoseki.fulfilled, (state, action) => {
        state.currentJoseki = action.payload
        state.currentMoveNode = action.payload.moveTree
        state.loading = false
      })
      .addCase(fetchRandomJoseki.rejected, (state, action) => {
        state.error = action.error.message || '获取随机定式失败'
        state.loading = false
      })
  },
})

export const {
  selectJoseki,
  setCurrentMoveNode,
  goToParentNode,
  goToChildNode,
  setAutoplaySpeed,
  setIsAutoplaying,
  setSearchQuery,
  setSelectedCategory,
  clearError,
} = josekiSlice.actions

export default josekiSlice.reducer
