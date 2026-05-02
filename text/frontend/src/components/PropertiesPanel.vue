<template>
  <div class="properties-panel">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="版面设置" name="layout">
        <div class="panel-section">
          <h4 class="section-title">页面尺寸</h4>
          <div class="form-row">
            <el-form-item label="宽度">
              <el-input-number v-model="layoutStore.layoutSettings.pageWidth" :min="100" :max="2000" size="small" style="width: 100%" />
            </el-form-item>
            <el-form-item label="高度">
              <el-input-number v-model="layoutStore.layoutSettings.pageHeight" :min="100" :max="2000" size="small" style="width: 100%" />
            </el-form-item>
          </div>
        </div>
        
        <div class="panel-section">
          <h4 class="section-title">边距设置</h4>
          <div class="form-grid">
            <el-form-item label="上">
              <el-input-number v-model="layoutStore.layoutSettings.marginTop" :min="0" :max="200" size="small" style="width: 100%" />
            </el-form-item>
            <el-form-item label="下">
              <el-input-number v-model="layoutStore.layoutSettings.marginBottom" :min="0" :max="200" size="small" style="width: 100%" />
            </el-form-item>
            <el-form-item label="左">
              <el-input-number v-model="layoutStore.layoutSettings.marginLeft" :min="0" :max="200" size="small" style="width: 100%" />
            </el-form-item>
            <el-form-item label="右">
              <el-input-number v-model="layoutStore.layoutSettings.marginRight" :min="0" :max="200" size="small" style="width: 100%" />
            </el-form-item>
          </div>
        </div>
        
        <div class="panel-section">
          <h4 class="section-title">排版间距</h4>
          <el-form-item label="行距">
            <el-slider v-model="layoutStore.layoutSettings.lineSpacing" :min="0" :max="50" show-input size="small" />
          </el-form-item>
          <el-form-item label="字距">
            <el-slider v-model="layoutStore.layoutSettings.charSpacing" :min="0" :max="20" show-input size="small" />
          </el-form-item>
          <el-form-item label="字号">
            <el-slider v-model="layoutStore.layoutSettings.fontSize" :min="12" :max="72" show-input size="small" />
          </el-form-item>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="界行设置" name="ruling">
        <div class="panel-section">
          <el-form-item label="启用界行">
            <el-switch v-model="layoutStore.rulingSettings.enabled" />
          </el-form-item>
          
          <template v-if="layoutStore.rulingSettings.enabled">
            <el-form-item label="线条样式">
              <el-select v-model="layoutStore.rulingSettings.style" size="small" style="width: 100%">
                <el-option label="单线" value="single" />
                <el-option label="双线" value="double" />
                <el-option label="虚线" value="dashed" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="线条颜色">
              <el-color-picker v-model="layoutStore.rulingSettings.color" size="small" />
            </el-form-item>
            
            <el-form-item label="线条宽度">
              <el-slider v-model="layoutStore.rulingSettings.lineWidth" :min="0.5" :max="5" :step="0.5" show-input size="small" />
            </el-form-item>
            
            <div class="sub-section">
              <h5>垂直界行</h5>
              <el-form-item label="启用">
                <el-switch v-model="layoutStore.rulingSettings.vertical.enabled" />
              </el-form-item>
              <el-form-item label="数量">
                <el-input-number v-model="layoutStore.rulingSettings.vertical.count" :min="1" :max="50" size="small" style="width: 100%" />
              </el-form-item>
              <el-form-item label="间距">
                <el-input-number v-model="layoutStore.rulingSettings.vertical.spacing" :min="20" :max="200" size="small" style="width: 100%" />
              </el-form-item>
            </div>
            
            <div class="sub-section">
              <h5>水平界行</h5>
              <el-form-item label="启用">
                <el-switch v-model="layoutStore.rulingSettings.horizontal.enabled" />
              </el-form-item>
              <el-form-item label="数量">
                <el-input-number v-model="layoutStore.rulingSettings.horizontal.count" :min="1" :max="50" size="small" style="width: 100%" />
              </el-form-item>
              <el-form-item label="间距">
                <el-input-number v-model="layoutStore.rulingSettings.horizontal.spacing" :min="20" :max="200" size="small" style="width: 100%" />
              </el-form-item>
            </div>
          </template>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="雕版预览" name="carving">
        <div class="panel-section">
          <h4 class="section-title">雕刻模式</h4>
          <el-radio-group v-model="layoutStore.carvingPreview.mode" size="small">
            <el-radio value="intaglio">阴刻（凹版）</el-radio>
            <el-radio value="relief">阳刻（凸版）</el-radio>
          </el-radio-group>
        </div>
        
        <div class="panel-section">
          <h4 class="section-title">雕刻参数</h4>
          <el-form-item label="雕刻深度">
            <el-slider v-model="layoutStore.carvingPreview.depth" :min="0.5" :max="5" :step="0.1" show-input size="small" />
          </el-form-item>
          <el-form-item label="刻刀宽度">
            <el-slider v-model="layoutStore.carvingPreview.toolWidth" :min="0.1" :max="3" :step="0.1" show-input size="small" />
          </el-form-item>
          <el-form-item label="刻刀角度">
            <el-slider v-model="layoutStore.carvingPreview.angle" :min="15" :max="90" show-input size="small" />
          </el-form-item>
          <el-form-item label="木质纹理">
            <el-switch v-model="layoutStore.carvingPreview.woodTexture" />
          </el-form-item>
        </div>
        
        <div class="panel-section">
          <el-button type="primary" @click="showCarvingPreview" style="width: 100%">
            生成刀路预览
          </el-button>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="刷印效果" name="print">
        <div class="panel-section">
          <h4 class="section-title">纸张类型</h4>
          <el-radio-group v-model="layoutStore.printPreview.paperType" size="small">
            <el-radio value="xuan">宣纸</el-radio>
            <el-radio value="lianzhi">连史纸</el-radio>
            <el-radio value="maozhi">毛纸</el-radio>
          </el-radio-group>
        </div>
        
        <div class="panel-section">
          <h4 class="section-title">刷印参数</h4>
          <el-form-item label="墨色浓度">
            <el-slider v-model="layoutStore.printPreview.inkDensity" :min="0" :max="1" :step="0.1" show-input size="small" />
          </el-form-item>
          <el-form-item label="墨色渗透">
            <el-slider v-model="layoutStore.printPreview.inkBleed" :min="0" :max="1" :step="0.1" show-input size="small" />
          </el-form-item>
          <el-form-item label="纹理透明度">
            <el-slider v-model="layoutStore.printPreview.textureOpacity" :min="0" :max="1" :step="0.1" show-input size="small" />
          </el-form-item>
          <el-form-item label="老化效果">
            <el-switch v-model="layoutStore.printPreview.agingEffect" />
          </el-form-item>
        </div>
        
        <div class="panel-section">
          <el-button type="primary" @click="showPrintPreview" style="width: 100%">
            生成刷印效果
          </el-button>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="操作" name="actions">
        <div class="panel-section">
          <h4 class="section-title">版面操作</h4>
          <div class="action-buttons">
            <el-button @click="clearLayout" style="width: 100%; margin-bottom: 8px">
              清空版面
            </el-button>
            <el-button @click="saveLayout" style="width: 100%; margin-bottom: 8px">
              保存版面
            </el-button>
            <el-button @click="exportAsImage" style="width: 100%">
              导出图片
            </el-button>
          </div>
        </div>
        
        <div class="panel-section" v-if="selectedChar">
          <h4 class="section-title">选中字符</h4>
          <div class="char-info">
            <div class="char-preview">{{ selectedChar.glyph.character }}</div>
            <div class="char-details">
              <p>Unicode: {{ selectedChar.glyph.unicode }}</p>
              <p>部首: {{ selectedChar.glyph.radical }}</p>
              <p>笔画: {{ selectedChar.glyph.strokeCount }}画</p>
            </div>
          </div>
          <el-button type="danger" @click="deleteSelectedChar" style="width: 100%; margin-top: 12px">
            删除字符
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import { useToast, useConfirm } from '@/utils/toast'

const layoutStore = useLayoutStore()
const activeTab = ref('layout')

const selectedChar = computed(() => {
  if (!layoutStore.selectedItem) return null
  return layoutStore.layoutCharacters.find(c => c.id === layoutStore.selectedItem)
})

const showCarvingPreview = () => {
  useToast('info', '雕版刀路预览功能开发中...')
}

const showPrintPreview = () => {
  useToast('info', '刷印效果模拟功能开发中...')
}

const clearLayout = async () => {
  const confirmed = await useConfirm('确定要清空当前版面吗？此操作不可撤销。', '确认清空')
  if (confirmed) {
    layoutStore.clearLayout()
    useToast('success', '版面已清空')
  }
}

const saveLayout = async () => {
  try {
    await layoutStore.saveLayoutToServer()
    useToast('success', '版面已保存到服务器')
  } catch (error) {
    useToast('warning', '服务器未连接，已保存到本地')
  }
}

const exportAsImage = () => {
  useToast('info', '导出图片功能开发中...')
}

const deleteSelectedChar = async () => {
  if (!layoutStore.selectedItem) return
  
  const confirmed = await useConfirm('确定要删除选中的字符吗？', '确认删除')
  if (confirmed) {
    layoutStore.removeCharacter(layoutStore.selectedItem)
    layoutStore.selectedItem = null
    useToast('success', '字符已删除')
  }
}
</script>

<style lang="scss" scoped>
.properties-panel {
  height: 100%;
  
  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
  }
  
  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  
  &:last-child {
    border-bottom: none;
  }
}

.form-row {
  display: flex;
  gap: 12px;
  
  > .el-form-item {
    flex: 1;
    margin-bottom: 0;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  
  .el-form-item {
    margin-bottom: 0;
  }
}

.sub-section {
  margin-top: 16px;
  padding: 12px;
  background: var(--paper-color);
  border-radius: var(--radius-sm);
  
  h5 {
    font-size: 13px;
    color: var(--ink-light);
    margin-bottom: 12px;
    font-weight: 600;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
}

.char-info {
  display: flex;
  gap: 12px;
  align-items: center;
  
  .char-preview {
    font-size: 48px;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--paper-color);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    font-family: 'STKaiti', 'KaiTi', serif;
  }
  
  .char-details {
    flex: 1;
    
    p {
      font-size: 13px;
      color: var(--ink-light);
      margin: 4px 0;
    }
  }
}

.el-form-item {
  margin-bottom: 12px;
  
  :deep(.el-form-item__label) {
    color: var(--ink-light);
    font-size: 13px;
  }
}
</style>
