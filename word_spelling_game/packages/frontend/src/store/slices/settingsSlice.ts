import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Language = 'en' | 'ja' | 'zh'
export type SoundVolume = 'off' | 'low' | 'medium' | 'high'

export interface SettingsState {
  language: Language
  soundEffects: SoundVolume
  musicVolume: SoundVolume
  ttsEnabled: boolean
  ttsVoice: string
  darkMode: boolean
  touchControls: boolean
  notifications: boolean
}

const initialState: SettingsState = {
  language: (localStorage.getItem('language') as Language) || 'en',
  soundEffects: (localStorage.getItem('soundEffects') as SoundVolume) || 'medium',
  musicVolume: (localStorage.getItem('musicVolume') as SoundVolume) || 'medium',
  ttsEnabled: localStorage.getItem('ttsEnabled') !== 'false',
  ttsVoice: localStorage.getItem('ttsVoice') || 'default',
  darkMode: localStorage.getItem('darkMode') !== 'false',
  touchControls: localStorage.getItem('touchControls') !== 'false',
  notifications: localStorage.getItem('notifications') !== 'false',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload
      localStorage.setItem('language', action.payload)
    },
    setSoundEffects: (state, action: PayloadAction<SoundVolume>) => {
      state.soundEffects = action.payload
      localStorage.setItem('soundEffects', action.payload)
    },
    setMusicVolume: (state, action: PayloadAction<SoundVolume>) => {
      state.musicVolume = action.payload
      localStorage.setItem('musicVolume', action.payload)
    },
    setTtsEnabled: (state, action: PayloadAction<boolean>) => {
      state.ttsEnabled = action.payload
      localStorage.setItem('ttsEnabled', action.payload.toString())
    },
    setTtsVoice: (state, action: PayloadAction<string>) => {
      state.ttsVoice = action.payload
      localStorage.setItem('ttsVoice', action.payload)
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload
      localStorage.setItem('darkMode', action.payload.toString())
    },
    setTouchControls: (state, action: PayloadAction<boolean>) => {
      state.touchControls = action.payload
      localStorage.setItem('touchControls', action.payload.toString())
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload
      localStorage.setItem('notifications', action.payload.toString())
    },
    resetSettings: () => {
      localStorage.removeItem('language')
      localStorage.removeItem('soundEffects')
      localStorage.removeItem('musicVolume')
      localStorage.removeItem('ttsEnabled')
      localStorage.removeItem('ttsVoice')
      localStorage.removeItem('darkMode')
      localStorage.removeItem('touchControls')
      localStorage.removeItem('notifications')
      return initialState
    },
  },
})

export const {
  setLanguage,
  setSoundEffects,
  setMusicVolume,
  setTtsEnabled,
  setTtsVoice,
  setDarkMode,
  setTouchControls,
  setNotifications,
  resetSettings,
} = settingsSlice.actions

export default settingsSlice.reducer
