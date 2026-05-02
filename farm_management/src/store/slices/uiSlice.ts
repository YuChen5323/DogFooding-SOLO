import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type MenuType = 'none' | 'inventory' | 'shop' | 'barn' | 'kitchen' | 'achievements' | 'festival' | 'save_load' | 'settings';

interface UIState {
  activeMenu: MenuType;
  isGameMenuOpen: boolean;
  currentDialog: {
    title: string;
    content: string;
    options: { label: string; value: string }[];
  } | null;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  selectedTool: string;
}

const initialState: UIState = {
  activeMenu: 'none',
  isGameMenuOpen: false,
  currentDialog: null,
  notification: null,
  selectedTool: 'hoe',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openMenu: (state, action: PayloadAction<MenuType>) => {
      state.activeMenu = action.payload;
    },
    closeMenu: (state) => {
      state.activeMenu = 'none';
    },
    toggleGameMenu: (state) => {
      state.isGameMenuOpen = !state.isGameMenuOpen;
    },
    openGameMenu: (state) => {
      state.isGameMenuOpen = true;
    },
    closeGameMenu: (state) => {
      state.isGameMenuOpen = false;
    },
    showDialog: (state, action: PayloadAction<{
      title: string;
      content: string;
      options?: { label: string; value: string }[];
    }>) => {
      state.currentDialog = {
        title: action.payload.title,
        content: action.payload.content,
        options: action.payload.options || [],
      };
    },
    closeDialog: (state) => {
      state.currentDialog = null;
    },
    showNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'info';
    }>) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
    selectTool: (state, action: PayloadAction<string>) => {
      state.selectedTool = action.payload;
    },
  },
});

export const {
  openMenu,
  closeMenu,
  toggleGameMenu,
  openGameMenu,
  closeGameMenu,
  showDialog,
  closeDialog,
  showNotification,
  clearNotification,
  selectTool,
} = uiSlice.actions;

export default uiSlice.reducer;
