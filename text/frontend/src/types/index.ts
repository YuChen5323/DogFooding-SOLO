export interface CharacterGlyph {
  id: string
  character: string
  radical: string
  strokeCount: number
  unicode: string
  fontStyle: 'standard' | 'regular' | 'song' | 'kai'
  imageUrl?: string
}

export interface LayoutCharacter {
  id: string
  glyph: CharacterGlyph
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  zIndex: number
}

export interface LayoutSettings {
  pageWidth: number
  pageHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  lineSpacing: number
  charSpacing: number
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
}

export interface LayoutElement {
  id: string
  type: 'border' | 'ruling' | 'fishTail' | 'pageNumber' | 'custom'
  x: number
  y: number
  width: number
  height: number
  style: Record<string, any>
  zIndex: number
}

export interface Layout {
  id?: string
  name: string
  description?: string
  settings: LayoutSettings
  characters: LayoutCharacter[]
  elements: LayoutElement[]
  createdAt?: string
  updatedAt?: string
}

export interface RulingSettings {
  enabled: boolean
  style: 'single' | 'double' | 'dashed'
  color: string
  lineWidth: number
  horizontal: {
    enabled: boolean
    count: number
    spacing: number
  }
  vertical: {
    enabled: boolean
    count: number
    spacing: number
  }
}

export interface FishTail {
  id: string
  type: 'black' | 'white' | 'doubleBlack' | 'doubleWhite'
  position: 'top' | 'bottom' | 'middle'
  x: number
  y: number
  width: number
  height: number
  style: {
    color: string
    fillColor: string
  }
}

export interface CarvingPreview {
  mode: 'intaglio' | 'relief'
  depth: number
  toolWidth: number
  angle: number
  woodTexture: boolean
}

export interface PrintPreview {
  paperType: 'xuan' | 'lianzhi' | 'maozhi'
  inkDensity: number
  inkBleed: number
  textureOpacity: number
  agingEffect: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
