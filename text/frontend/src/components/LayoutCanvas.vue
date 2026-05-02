<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <div 
      class="drop-zone"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="{ 'is-drag-over': isDragOver }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { fabric } from 'fabric'
import { useLayoutStore } from '@/stores/layout'
import type { CharacterGlyph, LayoutCharacter } from '@/types'
import { useToast } from '@/utils/toast'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvas = ref<fabric.Canvas | null>(null)
const isDragOver = ref(false)
const fabricObjects = ref<Map<string, fabric.Object>>(new Map())

const layoutStore = useLayoutStore()

const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return
  
  const { pageWidth, pageHeight, backgroundColor } = layoutStore.layoutSettings
  
  canvas.value = new fabric.Canvas(canvasRef.value, {
    width: pageWidth,
    height: pageHeight,
    backgroundColor: backgroundColor,
    selection: true,
    preserveObjectStacking: true
  })
  
  canvas.value.on('object:selected', (e) => {
    if (e.target && e.target.dataId) {
      layoutStore.selectedItem = e.target.dataId as string
    }
  })
  
  canvas.value.on('selection:cleared', () => {
    layoutStore.selectedItem = null
  })
  
  canvas.value.on('object:modified', (e) => {
    if (e.target && e.target.dataId) {
      const id = e.target.dataId as string
      const obj = e.target
      
      layoutStore.updateCharacter(id, {
        x: obj.left || 0,
        y: obj.top || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        rotation: obj.angle || 0,
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1)
      })
    }
  })
  
  renderRulings()
  renderCharacters()
}

const renderRulings = () => {
  if (!canvas.value) return
  
  const { rulingSettings, pageContentArea, layoutSettings } = layoutStore
  
  if (!rulingSettings.enabled) return
  
  const { x, y, width, height } = pageContentArea
  
  const border = new fabric.Rect({
    left: x - 10,
    top: y - 10,
    width: width + 20,
    height: height + 20,
    fill: 'transparent',
    stroke: rulingSettings.color,
    strokeWidth: rulingSettings.lineWidth,
    selectable: false,
    evented: false
  })
  
  canvas.value.add(border)
  
  if (rulingSettings.vertical.enabled) {
    const { count, spacing } = rulingSettings.vertical
    for (let i = 1; i < count; i++) {
      const lineX = x + i * spacing
      if (lineX < x + width) {
        const line = new fabric.Line([lineX, y, lineX, y + height], {
          stroke: rulingSettings.color,
          strokeWidth: rulingSettings.lineWidth,
          strokeDashArray: rulingSettings.style === 'dashed' ? [5, 5] : undefined,
          selectable: false,
          evented: false
        })
        canvas.value.add(line)
      }
    }
  }
  
  if (rulingSettings.horizontal.enabled) {
    const { count, spacing } = rulingSettings.horizontal
    for (let i = 1; i < count; i++) {
      const lineY = y + i * spacing
      if (lineY < y + height) {
        const line = new fabric.Line([x, lineY, x + width, lineY], {
          stroke: rulingSettings.color,
          strokeWidth: rulingSettings.lineWidth,
          strokeDashArray: rulingSettings.style === 'dashed' ? [5, 5] : undefined,
          selectable: false,
          evented: false
        })
        canvas.value.add(line)
      }
    }
  }
}

const renderCharacters = () => {
  if (!canvas.value) return
  
  layoutStore.layoutCharacters.forEach(char => {
    addCharacterToCanvas(char)
  })
}

const addCharacterToCanvas = (char: LayoutCharacter) => {
  if (!canvas.value) return
  
  const text = new fabric.Text(char.glyph.character, {
    left: char.x,
    top: char.y,
    fontSize: layoutStore.layoutSettings.fontSize,
    fontFamily: layoutStore.layoutSettings.fontFamily,
    fill: layoutStore.layoutSettings.textColor,
    originX: 'left',
    originY: 'top',
    dataId: char.id,
    selectable: true,
    hasControls: true,
    hasBorders: true
  })
  
  canvas.value.add(text)
  fabricObjects.value.set(char.id, text)
}

const removeCharacterFromCanvas = (charId: string) => {
  if (!canvas.value) return
  
  const obj = fabricObjects.value.get(charId)
  if (obj) {
    canvas.value.remove(obj)
    fabricObjects.value.delete(charId)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (!event.dataTransfer || !canvas.value) return
  
  const data = event.dataTransfer.getData('text/plain')
  if (!data) return
  
  try {
    const glyph: CharacterGlyph = JSON.parse(data)
    
    const canvasRect = canvasRef.value?.getBoundingClientRect()
    if (!canvasRect) return
    
    const x = event.clientX - canvasRect.left
    const y = event.clientY - canvasRect.top
    
    const newChar = layoutStore.addCharacter(glyph, x, y)
    addCharacterToCanvas(newChar)
    
    useToast('success', `已添加字模: ${glyph.character}`)
  } catch (error) {
    console.error('Failed to parse drag data:', error)
    useToast('error', '添加字模失败')
  }
}

const refreshCanvas = () => {
  if (!canvas.value) return
  
  canvas.value.clear()
  renderRulings()
  renderCharacters()
  canvas.value.renderAll()
}

watch(() => layoutStore.layoutSettings, () => {
  refreshCanvas()
}, { deep: true })

watch(() => layoutStore.rulingSettings, () => {
  refreshCanvas()
}, { deep: true })

watch(() => layoutStore.selectedItem, (newId, oldId) => {
  if (!canvas.value) return
  
  if (oldId) {
    const oldObj = fabricObjects.value.get(oldId)
    if (oldObj) {
      oldObj.set('stroke', undefined)
      oldObj.set('strokeWidth', 0)
    }
  }
  
  if (newId) {
    const newObj = fabricObjects.value.get(newId)
    if (newObj) {
      newObj.set('stroke', '#8b4513')
      newObj.set('strokeWidth', 2)
      canvas.value.setActiveObject(newObj)
    }
  } else {
    canvas.value.discardActiveObject()
  }
  
  canvas.value.renderAll()
})

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (canvas.value) {
    canvas.value.dispose()
  }
})

defineExpose({
  refreshCanvas,
  getCanvas: () => canvas.value
})
</script>

<style lang="scss" scoped>
.canvas-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--paper-color);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px dashed transparent;
  transition: all var(--transition-fast);
  pointer-events: none;
  
  &.is-drag-over {
    border-color: var(--accent-color);
    background: rgba(139, 69, 19, 0.05);
    pointer-events: auto;
  }
}

:deep(canvas) {
  display: block;
  box-shadow: var(--shadow-md);
}
</style>
