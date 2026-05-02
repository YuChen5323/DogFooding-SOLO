import axios from 'axios'
import { TimberGrade, ComponentType, MortiseType } from '@/lib/utils'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ComponentData {
  id: string
  type: string
  name: string
  chineseName: string
  category: 'column' | 'beam' | 'bracket' | 'other'
  description: string
  defaultDimensions: {
    width: number
    height: number
    depth: number
  }
  caiFenRequirements: {
    grade: TimberGrade
    widthFen: number
    heightFen: number
    depthFen: number
  }
  compatibleMortises: string[]
}

export interface ProjectData {
  id: string
  name: string
  description: string
  timberGrade: TimberGrade
  components: Array<{
    type: string
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    customDimensions?: { width: number; height: number; depth: number }
  }>
  createdAt: string
  updatedAt: string
}

export const componentApi = {
  getAll: async (): Promise<ComponentData[]> => {
    try {
      const response = await api.get('/components')
      return response.data
    } catch (error) {
      console.error('Failed to fetch components:', error)
      return []
    }
  },
  
  getByCategory: async (category: string): Promise<ComponentData[]> => {
    try {
      const response = await api.get(`/components/category/${category}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch components by category ${category}:`, error)
      return []
    }
  },
  
  getById: async (id: string): Promise<ComponentData | null> => {
    try {
      const response = await api.get(`/components/${id}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch component ${id}:`, error)
      return null
    }
  },
  
  create: async (data: Omit<ComponentData, 'id'>): Promise<ComponentData | null> => {
    try {
      const response = await api.post('/components', data)
      return response.data
    } catch (error) {
      console.error('Failed to create component:', error)
      return null
    }
  },
  
  update: async (id: string, data: Partial<ComponentData>): Promise<ComponentData | null> => {
    try {
      const response = await api.patch(`/components/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Failed to update component ${id}:`, error)
      return null
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/components/${id}`)
      return true
    } catch (error) {
      console.error(`Failed to delete component ${id}:`, error)
      return false
    }
  }
}

export const projectApi = {
  getAll: async (): Promise<ProjectData[]> => {
    try {
      const response = await api.get('/projects')
      return response.data
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      return []
    }
  },
  
  getById: async (id: string): Promise<ProjectData | null> => {
    try {
      const response = await api.get(`/projects/${id}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error)
      return null
    }
  },
  
  create: async (data: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectData | null> => {
    try {
      const response = await api.post('/projects', data)
      return response.data
    } catch (error) {
      console.error('Failed to create project:', error)
      return null
    }
  },
  
  update: async (id: string, data: Partial<ProjectData>): Promise<ProjectData | null> => {
    try {
      const response = await api.patch(`/projects/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error)
      return null
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/projects/${id}`)
      return true
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error)
      return false
    }
  },
  
  exportSVG: async (projectId: string, viewType: string): Promise<string | null> => {
    try {
      const response = await api.get(`/projects/${projectId}/export/${viewType}`, {
        responseType: 'text'
      })
      return response.data
    } catch (error) {
      console.error(`Failed to export SVG for project ${projectId}:`, error)
      return null
    }
  }
}

export const stressAnalysisApi = {
  calculateJointStress: async (params: {
    components: Array<{
      id: string
      dimensions: { width: number; height: number; depth: number }
      material: string
    }>
    joints: Array<{
      id: string
      componentA: string
      componentB: string
      type: string
    }>
    load: { x: number; y: number; z: number }
  }): Promise<Array<{ id: string; stress: number; contactPressure: number[] }> | null> => {
    try {
      const response = await api.post('/analysis/stress', params)
      return response.data
    } catch (error) {
      console.error('Failed to calculate stress:', error)
      return null
    }
  }
}

export const earthquakeSimulationApi = {
  getAvailableWaves: async (): Promise<Array<{ id: string; name: string; magnitude: number; duration: number }>> => {
    try {
      const response = await api.get('/earthquake/waves')
      return response.data
    } catch (error) {
      console.error('Failed to fetch earthquake waves:', error)
      return []
    }
  },
  
  getWaveData: async (waveId: string): Promise<number[] | null> => {
    try {
      const response = await api.get(`/earthquake/waves/${waveId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch wave data ${waveId}:`, error)
      return null
    }
  },
  
  runSimulation: async (params: {
    waveId: string
    magnitude: number
    components: any[]
    joints: any[]
  }): Promise<Array<{
    timestamp: number
    acceleration: { x: number; y: number; z: number }
    displacement: { x: number; y: number; z: number }
    energyDissipated: number
  }> | null> => {
    try {
      const response = await api.post('/earthquake/simulate', params)
      return response.data
    } catch (error) {
      console.error('Failed to run earthquake simulation:', error)
      return null
    }
  }
}

export default api
