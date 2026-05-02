<template>
  <div class="layout-view">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()

onMounted(() => {
  layoutStore.initializeLayout()
  layoutStore.initSampleGlyphs()
})
</script>

<style lang="scss" scoped>
.layout-view {
  width: 100%;
  height: 100%;
}
</style>
