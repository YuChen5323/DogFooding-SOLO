import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CharacterGlyph,
  LayoutCharacter,
  LayoutSettings,
  LayoutElement,
  Layout,
  RulingSettings,
  FishTail,
  CarvingPreview,
  PrintPreview
} from '@/types'
import { layoutApi } from '@/api/layout'

export const useLayoutStore = defineStore('layout', () => {
  const currentLayout = ref<Layout | null>(null)
  const layoutCharacters = ref<LayoutCharacter[]>([])
  const layoutElements = ref<LayoutElement[]>([])
  const selectedItem = ref<string | null>(null)
  const layoutSettings = ref<LayoutSettings>({
    pageWidth: 600,
    pageHeight: 800,
    marginTop: 40,
    marginBottom: 40,
    marginLeft: 40,
    marginRight: 40,
    lineSpacing: 8,
    charSpacing: 2,
    fontSize: 24,
    fontFamily: 'STKaiti',
    textColor: '#2c2420',
    backgroundColor: '#f5f0e8'
  })

  const rulingSettings = ref<RulingSettings>({
    enabled: true,
    style: 'single',
    color: '#8b7355',
    lineWidth: 1,
    horizontal: {
      enabled: true,
      count: 10,
      spacing: 40
    },
    vertical: {
      enabled: true,
      count: 8,
      spacing: 60
    }
  })

  const fishTails = ref<FishTail[]>([])

  const carvingPreview = ref<CarvingPreview>({
    mode: 'intaglio',
    depth: 2,
    toolWidth: 1,
    angle: 45,
    woodTexture: true
  })

  const printPreview = ref<PrintPreview>({
    paperType: 'xuan',
    inkDensity: 0.8,
    inkBleed: 0.3,
    textureOpacity: 0.6,
    agingEffect: true
  })

  const glyphLibrary = ref<CharacterGlyph[]>([])
  const currentRadical = ref<string>('全部')
  const currentStrokeCount = ref<number>(0)

  const radicals = computed(() => {
    const uniqueRadicals = new Set<string>()
    glyphLibrary.value.forEach(glyph => uniqueRadicals.add(glyph.radical))
    return ['全部', ...Array.from(uniqueRadicals).sort()]
  })

  const strokeCounts = computed(() => {
    const uniqueCounts = new Set<number>()
    glyphLibrary.value.forEach(glyph => uniqueCounts.add(glyph.strokeCount))
    return [0, ...Array.from(uniqueCounts).sort((a, b) => a - b)]
  })

  const filteredGlyphs = computed(() => {
    return glyphLibrary.value.filter(glyph => {
      const matchRadical = currentRadical.value === '全部' || glyph.radical === currentRadical.value
      const matchStroke = currentStrokeCount.value === 0 || glyph.strokeCount === currentStrokeCount.value
      return matchRadical && matchStroke
    })
  })

  const pageContentArea = computed(() => {
    return {
      x: layoutSettings.value.marginLeft,
      y: layoutSettings.value.marginTop,
      width: layoutSettings.value.pageWidth - layoutSettings.value.marginLeft - layoutSettings.value.marginRight,
      height: layoutSettings.value.pageHeight - layoutSettings.value.marginTop - layoutSettings.value.marginBottom
    }
  })

  const initializeLayout = (name: string = '新版面') => {
    currentLayout.value = {
      name,
      settings: { ...layoutSettings.value },
      characters: [],
      elements: []
    }
    layoutCharacters.value = []
    layoutElements.value = []
  }

  const addCharacter = (glyph: CharacterGlyph, x: number, y: number) => {
    const newChar: LayoutCharacter = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      glyph,
      x,
      y,
      width: layoutSettings.value.fontSize,
      height: layoutSettings.value.fontSize,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: layoutCharacters.value.length
    }
    layoutCharacters.value.push(newChar)
    if (currentLayout.value) {
      currentLayout.value.characters = [...layoutCharacters.value]
    }
    return newChar
  }

  const removeCharacter = (charId: string) => {
    const index = layoutCharacters.value.findIndex(c => c.id === charId)
    if (index > -1) {
      layoutCharacters.value.splice(index, 1)
      if (currentLayout.value) {
        currentLayout.value.characters = [...layoutCharacters.value]
      }
    }
  }

  const updateCharacter = (charId: string, updates: Partial<LayoutCharacter>) => {
    const char = layoutCharacters.value.find(c => c.id === charId)
    if (char) {
      Object.assign(char, updates)
    }
  }

  const addElement = (element: Omit<LayoutElement, 'id'>) => {
    const newElement: LayoutElement = {
      ...element,
      id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    layoutElements.value.push(newElement)
    if (currentLayout.value) {
      currentLayout.value.elements = [...layoutElements.value]
    }
    return newElement
  }

  const removeElement = (elemId: string) => {
    const index = layoutElements.value.findIndex(e => e.id === elemId)
    if (index > -1) {
      layoutElements.value.splice(index, 1)
      if (currentLayout.value) {
        currentLayout.value.elements = [...layoutElements.value]
      }
    }
  }

  const addFishTail = (tail: Omit<FishTail, 'id'>) => {
    const newTail: FishTail = {
      ...tail,
      id: `tail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    fishTails.value.push(newTail)
    return newTail
  }

  const removeFishTail = (tailId: string) => {
    const index = fishTails.value.findIndex(t => t.id === tailId)
    if (index > -1) {
      fishTails.value.splice(index, 1)
    }
  }

  const loadGlyphLibrary = async () => {
    try {
      const response = await layoutApi.getGlyphs()
      if (response.success) {
        glyphLibrary.value = response.data || []
      }
    } catch (error) {
      console.error('Failed to load glyph library:', error)
      initSampleGlyphs()
    }
  }

  const initSampleGlyphs = () => {
    const sampleGlyphs: CharacterGlyph[] = [
      { id: '1', character: '一', radical: '一', strokeCount: 1, unicode: 'U+4E00', fontStyle: 'kai' },
      { id: '2', character: '二', radical: '二', strokeCount: 2, unicode: 'U+4E8C', fontStyle: 'kai' },
      { id: '3', character: '三', radical: '一', strokeCount: 3, unicode: 'U+4E09', fontStyle: 'kai' },
      { id: '4', character: '四', radical: '囗', strokeCount: 5, unicode: 'U+56DB', fontStyle: 'kai' },
      { id: '5', character: '五', radical: '一', strokeCount: 4, unicode: 'U+4E94', fontStyle: 'kai' },
      { id: '6', character: '六', radical: '八', strokeCount: 4, unicode: 'U+516D', fontStyle: 'kai' },
      { id: '7', character: '七', radical: '一', strokeCount: 2, unicode: 'U+4E03', fontStyle: 'kai' },
      { id: '8', character: '八', radical: '八', strokeCount: 2, unicode: 'U+516B', fontStyle: 'kai' },
      { id: '9', character: '九', radical: '丿', strokeCount: 2, unicode: 'U+4E5D', fontStyle: 'kai' },
      { id: '10', character: '十', radical: '十', strokeCount: 2, unicode: 'U+5341', fontStyle: 'kai' },
      { id: '11', character: '天', radical: '大', strokeCount: 4, unicode: 'U+5929', fontStyle: 'kai' },
      { id: '12', character: '地', radical: '土', strokeCount: 6, unicode: 'U+5730', fontStyle: 'kai' },
      { id: '13', character: '人', radical: '人', strokeCount: 2, unicode: 'U+4EBA', fontStyle: 'kai' },
      { id: '14', character: '日', radical: '日', strokeCount: 4, unicode: 'U+65E5', fontStyle: 'kai' },
      { id: '15', character: '月', radical: '月', strokeCount: 4, unicode: 'U+6708', fontStyle: 'kai' },
      { id: '16', character: '山', radical: '山', strokeCount: 3, unicode: 'U+5C71', fontStyle: 'kai' },
      { id: '17', character: '水', radical: '水', strokeCount: 4, unicode: 'U+6C34', fontStyle: 'kai' },
      { id: '18', character: '木', radical: '木', strokeCount: 4, unicode: 'U+6728', fontStyle: 'kai' },
      { id: '19', character: '火', radical: '火', strokeCount: 4, unicode: 'U+706B', fontStyle: 'kai' },
      { id: '20', character: '土', radical: '土', strokeCount: 3, unicode: 'U+571F', fontStyle: 'kai' },
      { id: '21', character: '春', radical: '日', strokeCount: 9, unicode: 'U+6625', fontStyle: 'kai' },
      { id: '22', character: '夏', radical: '夂', strokeCount: 10, unicode: 'U+590F', fontStyle: 'kai' },
      { id: '23', character: '秋', radical: '禾', strokeCount: 9, unicode: 'U+79CB', fontStyle: 'kai' },
      { id: '24', character: '冬', radical: '夂', strokeCount: 5, unicode: 'U+51AC', fontStyle: 'kai' },
      { id: '25', character: '风', radical: '风', strokeCount: 4, unicode: 'U+98CE', fontStyle: 'kai' },
      { id: '26', character: '花', radical: '艹', strokeCount: 7, unicode: 'U+82B1', fontStyle: 'kai' },
      { id: '27', character: '雪', radical: '雨', strokeCount: 11, unicode: 'U+96EA', fontStyle: 'kai' },
      { id: '28', character: '月', radical: '月', strokeCount: 4, unicode: 'U+6708', fontStyle: 'kai' },
      { id: '29', character: '诗', radical: '讠', strokeCount: 8, unicode: 'U+8BD7', fontStyle: 'kai' },
      { id: '30', character: '书', radical: '乙', strokeCount: 4, unicode: 'U+4E66', fontStyle: 'kai' },
    ]
    glyphLibrary.value = sampleGlyphs
  }

  const saveLayoutToServer = async () => {
    if (!currentLayout.value) return
    try {
      currentLayout.value.characters = [...layoutCharacters.value]
      currentLayout.value.elements = [...layoutElements.value]
      currentLayout.value.settings = { ...layoutSettings.value }
      const response = await layoutApi.saveLayout(currentLayout.value)
      if (response.success && response.data?.id) {
        currentLayout.value.id = response.data.id
      }
      return response
    } catch (error) {
      console.error('Failed to save layout:', error)
      throw error
    }
  }

  const loadLayoutFromServer = async (layoutId: string) => {
    try {
      const response = await layoutApi.getLayout(layoutId)
      if (response.success && response.data) {
        currentLayout.value = response.data
        layoutCharacters.value = [...response.data.characters]
        layoutElements.value = [...response.data.elements]
        layoutSettings.value = { ...response.data.settings }
      }
      return response
    } catch (error) {
      console.error('Failed to load layout:', error)
      throw error
    }
  }

  const clearLayout = () => {
    layoutCharacters.value = []
    layoutElements.value = []
    fishTails.value = []
    if (currentLayout.value) {
      currentLayout.value.characters = []
      currentLayout.value.elements = []
    }
  }

  return {
    currentLayout,
    layoutCharacters,
    layoutElements,
    selectedItem,
    layoutSettings,
    rulingSettings,
    fishTails,
    carvingPreview,
    printPreview,
    glyphLibrary,
    currentRadical,
    currentStrokeCount,
    radicals,
    strokeCounts,
    filteredGlyphs,
    pageContentArea,
    initializeLayout,
    addCharacter,
    removeCharacter,
    updateCharacter,
    addElement,
    removeElement,
    addFishTail,
    removeFishTail,
    loadGlyphLibrary,
    initSampleGlyphs,
    saveLayoutToServer,
    loadLayoutFromServer,
    clearLayout
  }
})
