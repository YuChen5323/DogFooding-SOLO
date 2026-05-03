import { writable, type Writable } from 'svelte/store'
import type { AccessibilitySettings, AppSettings } from '../types'

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  vibration: true,
  sound: true,
  largeText: false,
  reducedMotion: false,
  fontSize: 'medium',
  colorScheme: 'warm'
}

const DEFAULT_SETTINGS: AppSettings = {
  accessibility: DEFAULT_ACCESSIBILITY,
  recognition: {
    confidenceThreshold: 0.7,
    frameBufferSize: 30,
    modelName: 'sign-transformer-mini',
    inferenceInterval: 100
  },
  practice: {
    dailyGoal: 20,
    reviewInterval: 24,
    maxWordsPerSession: 10
  }
}

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('signflow_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem('signflow_settings', JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

function createSettingsStore(): Writable<AppSettings> {
  const initial = loadSettings()
  const { subscribe, set, update } = writable<AppSettings>(initial)

  subscribe((settings) => {
    saveSettings(settings)
    applySettings(settings.accessibility)
  })

  return {
    subscribe,
    set,
    update
  }
}

function applySettings(a11y: AccessibilitySettings): void {
  const root = document.documentElement
  
  if (a11y.highContrast) {
    root.style.setProperty('--bg-main', '#000000')
    root.style.setProperty('--bg-secondary', '#111111')
    root.style.setProperty('--bg-card', '#222222')
    root.style.setProperty('--primary', '#FFD700')
    root.style.setProperty('--text-primary', '#FFFFFF')
  } else {
    root.style.removeProperty('--bg-main')
    root.style.removeProperty('--bg-secondary')
    root.style.removeProperty('--bg-card')
    if (a11y.colorScheme === 'warm') {
      root.style.setProperty('--primary', '#FF7B3C')
    } else if (a11y.colorScheme === 'cool') {
      root.style.setProperty('--primary', '#4ECDC4')
    }
  }
  
  if (a11y.largeText || a11y.fontSize === 'large') {
    document.documentElement.style.fontSize = '18px'
  } else if (a11y.fontSize === 'small') {
    document.documentElement.style.fontSize = '14px'
  } else {
    document.documentElement.style.fontSize = '16px'
  }
  
  if (a11y.reducedMotion) {
    document.documentElement.style.setProperty('--transition', 'none')
  } else {
    document.documentElement.style.setProperty('--transition', 'all 0.3s ease')
  }
}

export const settingsStore = createSettingsStore()

export const accessibilityStore = {
  subscribe: (fn: (value: AccessibilitySettings) => void) => {
    return settingsStore.subscribe(settings => fn(settings.accessibility))
  },
  
  update: (updater: (a11y: AccessibilitySettings) => AccessibilitySettings) => {
    settingsStore.update(settings => ({
      ...settings,
      accessibility: updater(settings.accessibility)
    }))
  },
  
  set: (value: AccessibilitySettings) => {
    settingsStore.update(settings => ({
      ...settings,
      accessibility: value
    }))
  }
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export function playSound(type: 'success' | 'error' | 'warning' | 'click'): void {
  const unsubscribe = accessibilityStore.subscribe(a11y => {
    if (!a11y.sound) {
      return
    }
    
    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      const frequencies: Record<string, number> = {
        success: 880,
        error: 220,
        warning: 440,
        click: 660
      }
      
      oscillator.type = type === 'error' ? 'sawtooth' : 'sine'
      oscillator.frequency.value = frequencies[type]
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
    } catch (e) {
      console.error('Failed to play sound:', e)
    }
  })
  
  unsubscribe()
}

export function triggerVibration(pattern: number | number[] = [100]): void {
  const unsubscribe = accessibilityStore.subscribe(a11y => {
    if (!a11y.vibration || !navigator.vibrate) {
      return
    }
    
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      console.error('Failed to trigger vibration:', e)
    }
  })
  
  unsubscribe()
}

export function provideFeedback(type: 'success' | 'error' | 'warning'): void {
  const vibratePatterns: Record<string, number[]> = {
    success: [100],
    error: [100, 50, 100, 50, 100],
    warning: [200, 100, 200]
  }
  
  triggerVibration(vibratePatterns[type])
  playSound(type)
}
