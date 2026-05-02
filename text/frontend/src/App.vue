<template>
  <div class="app-container">
    <el-header class="app-header">
      <div class="header-title">
        <span class="logo">🖨️</span>
        <span class="title">印刷术活字排版系统</span>
      </div>
      <div class="header-actions">
        <el-button @click="saveLayout">保存版面</el-button>
        <el-button @click="loadLayout">加载版面</el-button>
      </div>
    </el-header>
    <el-container class="main-container">
      <el-aside width="300px" class="sidebar">
        <router-view name="sidebar" />
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
      <el-aside width="280px" class="right-sidebar">
        <router-view name="properties" />
      </el-aside>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'
import { useToast } from '@/utils/toast'

const layoutStore = useLayoutStore()

const saveLayout = () => {
  layoutStore.saveLayoutToServer()
  useToast('success', '版面已保存')
}

const loadLayout = () => {
  // TODO: 实现加载版面的选择对话框
  useToast('info', '请选择要加载的版面')
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%);
  border-bottom: 2px solid #c4a77d;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(196, 167, 125, 0.3);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 28px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: #5c4a3d;
  letter-spacing: 2px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.sidebar {
  background: #faf7f3;
  border-right: 1px solid #e0d5c5;
  overflow-y: auto;
}

.main-content {
  background: #f5f0e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}

.right-sidebar {
  background: #faf7f3;
  border-left: 1px solid #e0d5c5;
  overflow-y: auto;
  padding: 16px;
}
</style>
