export interface ColorStop {
  value: number
  color: string
}

export const STRESS_COLOR_SCALE: ColorStop[] = [
  { value: 0, color: '#3b82f6' },
  { value: 0.25, color: '#22c55e' },
  { value: 0.5, color: '#eab308' },
  { value: 0.75, color: '#f97316' },
  { value: 1.0, color: '#ef4444' },
]

export function getStressColor(stress: number, maxStress: number = 100): string {
  const normalized = Math.min(Math.max(stress / maxStress, 0), 1)
  
  for (let i = 0; i < STRESS_COLOR_SCALE.length - 1; i++) {
    const lower = STRESS_COLOR_SCALE[i]
    const upper = STRESS_COLOR_SCALE[i + 1]
    
    if (normalized >= lower.value && normalized <= upper.value) {
      const range = upper.value - lower.value
      const position = (normalized - lower.value) / range
      return interpolateColor(lower.color, upper.color, position)
    }
  }
  
  return STRESS_COLOR_SCALE[STRESS_COLOR_SCALE.length - 1].color
}

export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  
  if (!c1 || !c2) return color1
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  
  return rgbToHex(r, g, b)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export const WOOD_COLORS = {
  pine: '#d4a574',
  oak: '#b87333',
  mahogany: '#8c4a21',
  cedar: '#c8956a',
  teak: '#a3794c',
  default: '#c87637'
}

export function getWoodColor(type: keyof typeof WOOD_COLORS = 'default'): string {
  return WOOD_COLORS[type] || WOOD_COLORS.default
}
