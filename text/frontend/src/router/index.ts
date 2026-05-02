import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LayoutView from '@/views/LayoutView.vue'
import TypeCabinet from '@/components/TypeCabinet.vue'
import LayoutCanvas from '@/components/LayoutCanvas.vue'
import PropertiesPanel from '@/components/PropertiesPanel.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'layout',
    components: {
      default: LayoutView,
      sidebar: TypeCabinet,
      properties: PropertiesPanel
    },
    children: [
      {
        path: '',
        component: LayoutCanvas
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
