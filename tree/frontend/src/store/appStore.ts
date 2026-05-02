import { create } from 'zustand'
import { TimberGrade, CaiFenSpec, CAI_FEN_TABLE } from '@/lib/utils'

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Rotation3D {
  x: number
  y: number
  z: number
}

export interface ComponentInstance {
  id: string
  type: 'column' | 'beam' | 'bracket'
  subtype: string
  name: string
  chineseName: string
  position: Position3D
  rotation: Rotation3D
  scale: number
  dimensions: {
    width: number
    height: number
    depth: number
  }
  caiFen: {
    grade: TimberGrade
    fenCount: number
  }
  mortiseType?: string
  isSelected: boolean
  stress?: number
  color?: string
}

export interface Joint {
  id: string
  componentA: string
  componentB: string
  type: string
  stress: number
  contactPressure: number[]
}

export interface EarthquakeRecord {
  timestamp: number
  acceleration: Position3D
  displacement: Position3D
  velocity: Position3D
  energyDissipated: number
}

export interface AppState {
  currentModule: 'sandbox' | 'stress' | 'earthquake' | 'export'
  
  timberGrade: TimberGrade
  caiFenSpec: CaiFenSpec
  
  components: ComponentInstance[]
  selectedComponentId: string | null
  joints: Joint[]
  
  isPhysicsEnabled: boolean
  gravity: number
  isStressVisualizationEnabled: boolean
  
  earthquakeData: {
    isPlaying: boolean
    currentTime: number
    records: EarthquakeRecord[]
    waveData: number[]
    magnitude: number
  }
  
  setCurrentModule: (module: 'sandbox' | 'stress' | 'earthquake' | 'export') => void
  
  setTimberGrade: (grade: TimberGrade) => void
  
  addComponent: (component: Omit<ComponentInstance, 'id' | 'isSelected'>) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void
  selectComponent: (id: string | null) => void
  clearComponents: () => void
  
  addJoint: (joint: Omit<Joint, 'id'>) => void
  updateJointsFromPhysics: (jointData: { id: string; stress: number; contactPressure: number[] }[]) => void
  
  togglePhysics: () => void
  setGravity: (gravity: number) => void
  toggleStressVisualization: () => void
  
  setEarthquakeWaveData: (data: number[]) => void
  setEarthquakeMagnitude: (magnitude: number) => void
  startEarthquakeSimulation: () => void
  stopEarthquakeSimulation: () => void
  addEarthquakeRecord: (record: Omit<EarthquakeRecord, 'timestamp'>) => void
  clearEarthquakeRecords: () => void
}

const createComponentId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const createJointId = () => `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useAppStore = create<AppState>((set, get) => ({
  currentModule: 'sandbox',
  
  timberGrade: '三等材',
  caiFenSpec: CAI_FEN_TABLE['三等材'],
  
  components: [],
  selectedComponentId: null,
  joints: [],
  
  isPhysicsEnabled: false,
  gravity: -9.81,
  isStressVisualizationEnabled: false,
  
  earthquakeData: {
    isPlaying: false,
    currentTime: 0,
    records: [],
    waveData: [],
    magnitude: 5.0
  },
  
  setCurrentModule: (module) => set({ currentModule: module }),
  
  setTimberGrade: (grade) => set({ 
    timberGrade: grade, 
    caiFenSpec: CAI_FEN_TABLE[grade] 
  }),
  
  addComponent: (component) => set((state) => ({
    components: [...state.components, {
      ...component,
      id: createComponentId(),
      isSelected: false
    }]
  })),
  
  removeComponent: (id) => set((state) => ({
    components: state.components.filter(c => c.id !== id),
    selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    joints: state.joints.filter(j => j.componentA !== id && j.componentB !== id)
  })),
  
  updateComponent: (id, updates) => set((state) => ({
    components: state.components.map(c => 
      c.id === id ? { ...c, ...updates } : c
    )
  })),
  
  selectComponent: (id) => set((state) => ({
    selectedComponentId: id,
    components: state.components.map(c => ({
      ...c,
      isSelected: c.id === id
    }))
  })),
  
  clearComponents: () => set({
    components: [],
    selectedComponentId: null,
    joints: []
  }),
  
  addJoint: (joint) => set((state) => ({
    joints: [...state.joints, { ...joint, id: createJointId() }]
  })),
  
  updateJointsFromPhysics: (jointData) => set((state) => ({
    joints: state.joints.map(j => {
      const data = jointData.find(d => d.id === j.id)
      return data ? { ...j, stress: data.stress, contactPressure: data.contactPressure } : j
    })
  })),
  
  togglePhysics: () => set((state) => ({ isPhysicsEnabled: !state.isPhysicsEnabled })),
  
  setGravity: (gravity) => set({ gravity }),
  
  toggleStressVisualization: () => set((state) => ({ 
    isStressVisualizationEnabled: !state.isStressVisualizationEnabled 
  })),
  
  setEarthquakeWaveData: (data) => set((state) => ({
    earthquakeData: { ...state.earthquakeData, waveData: data }
  })),
  
  setEarthquakeMagnitude: (magnitude) => set((state) => ({
    earthquakeData: { ...state.earthquakeData, magnitude }
  })),
  
  startEarthquakeSimulation: () => set((state) => ({
    earthquakeData: { ...state.earthquakeData, isPlaying: true }
  })),
  
  stopEarthquakeSimulation: () => set((state) => ({
    earthquakeData: { ...state.earthquakeData, isPlaying: false }
  })),
  
  addEarthquakeRecord: (record) => set((state) => ({
    earthquakeData: {
      ...state.earthquakeData,
      records: [
        ...state.earthquakeData.records,
        { ...record, timestamp: Date.now() }
      ]
    }
  })),
  
  clearEarthquakeRecords: () => set((state) => ({
    earthquakeData: { ...state.earthquakeData, records: [], currentTime: 0 }
  }))
}))
