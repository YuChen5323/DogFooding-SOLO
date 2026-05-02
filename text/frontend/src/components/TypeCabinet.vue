<template>
  <div class="type-cabinet">
    <div class="cabinet-header">
      <h3 class="section-title">活字柜</h3>
    </div>
    
    <div class="filter-section">
      <div class="filter-item">
        <label>偏旁部首：</label>
        <el-select v-model="layoutStore.currentRadical" placeholder="选择部首" size="small" style="width: 100%">
          <el-option
            v-for="radical in layoutStore.radicals"
            :key="radical"
            :label="radical"
            :value="radical"
          />
        </el-select>
      </div>
      
      <div class="filter-item">
        <label>笔画数：</label>
        <el-select v-model="layoutStore.currentStrokeCount" placeholder="选择笔画数" size="small" style="width: 100%">
          <el-option
            v-for="count in layoutStore.strokeCounts"
            :key="count"
            :label="count === 0 ? '全部' : `${count} 画`"
            :value="count"
          />
        </el-select>
      </div>
    </div>
    
    <div class="glyph-grid">
      <div
        v-for="glyph in layoutStore.filteredGlyphs"
        :key="glyph.id"
        class="glyph-item"
        :class="`stroke-${Math.min(glyph.strokeCount, 10)}`"
        draggable="true"
        @dragstart="handleDragStart($event, glyph)"
        @click="handleGlyphClick(glyph)"
      >
        <div class="glyph-character">{{ glyph.character }}</div>
        <div class="glyph-info">
          <span class="stroke-count">{{ glyph.strokeCount }}画</span>
          <span class="radical">{{ glyph.radical }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="layoutStore.filteredGlyphs.length === 0" class="empty-state">
      <el-empty description="暂无字模" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'
import type { CharacterGlyph } from '@/types'
import { useToast } from '@/utils/toast'

const layoutStore = useLayoutStore()

const handleDragStart = (event: DragEvent, glyph: CharacterGlyph) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(glyph))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleGlyphClick = (glyph: CharacterGlyph) => {
  useToast('info', `已选择字模: ${glyph.character}，可拖拽到排版区域`)
}
</script>

<style lang="scss" scoped>
.type-cabinet {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--paper-light);
}

.cabinet-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
}

.filter-section {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  background: var(--paper-color);
}

.filter-item {
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 13px;
    color: var(--ink-light);
    margin-bottom: 6px;
  }
}

.glyph-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  align-content: start;
}

.glyph-item {
  aspect-ratio: 1;
  background: var(--paper-color);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &:active {
    cursor: grabbing;
  }
}

.glyph-character {
  font-size: 28px;
  line-height: 1;
  color: var(--ink-color);
  font-family: 'STKaiti', 'KaiTi', serif;
}

.glyph-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 4px;
  font-size: 10px;
  color: var(--ink-light);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .glyph-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
