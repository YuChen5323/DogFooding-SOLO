"use client"

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { SceneWrapper } from '@/components/three/SceneWrapper'
import { ComponentLibrary } from '@/components/sandbox/ComponentLibrary'
import { PropertyPanel } from '@/components/sandbox/PropertyPanel'
import { Toolbar } from '@/components/sandbox/Toolbar'
import { COMPONENT_TYPES, TimberGrade, CAI_FEN_TABLE, calculateCaiFenSize } from '@/lib/utils'
import { 
  Trash2, 
  RotateCcw, 
  Play, 
  Pause, 
  Grid3X3, 
  Ruler,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SandboxPage() {
  const { 
    components, 
    timberGrade, 
    setTimberGrade,
    clearComponents,
    selectedComponentId,
    removeComponent,
    isPhysicsEnabled,
    togglePhysics
  } = useAppStore()
  
  const [showGrid, setShowGrid] = useState(true)
  const [showRuler, setShowRuler] = useState(false)
  
  const handleAddComponent = (type: string) => {
    const componentType = COMPONENT_TYPES.find(t => t.id === type)
    if (!componentType) return
    
    const baseDim = calculateCaiFenSize(timberGrade, 10)
    
    let dimensions = { width: baseDim, height: baseDim, depth: baseDim }
    
    switch (componentType.category) {
      case 'column':
        dimensions = { width: baseDim, height: baseDim * 5, depth: baseDim }
        break
      case 'beam':
        dimensions = { width: baseDim * 6, height: baseDim, depth: baseDim }
        break
      case 'bracket':
        dimensions = { width: baseDim * 2, height: baseDim * 0.8, depth: baseDim * 2 }
        break
    }
    
    useAppStore.getState().addComponent({
      type: componentType.category,
      subtype: type,
      name: componentType.name,
      chineseName: componentType.chineseName,
      position: { x: 0, y: dimensions.height / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      dimensions,
      caiFen: {
        grade: timberGrade,
        fenCount: 10
      },
      stress: 0
    })
  }
  
  const handleDeleteSelected = () => {
    if (selectedComponentId) {
      removeComponent(selectedComponentId)
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-wood-100 border-b border-wood-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-wood-800">木构架搭建沙盒</h1>
          
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm text-wood-600">材份等级:</span>
            <Select
              value={timberGrade}
              onValueChange={(value) => setTimberGrade(value as TimberGrade)}
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="选择材份" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CAI_FEN_TABLE).map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            className={showGrid ? 'bg-wood-200' : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRuler(!showRuler)}
            className={showRuler ? 'bg-wood-200' : ''}
          >
            <Ruler className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePhysics}
            className={isPhysicsEnabled ? 'bg-wood-200' : ''}
          >
            {isPhysicsEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteSelected}
            disabled={!selectedComponentId}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={clearComponents}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-wood-50 border-r border-wood-200 overflow-y-auto scrollbar-wood">
          <ComponentLibrary onSelectComponent={handleAddComponent} />
        </div>
        
        <div className="flex-1 relative">
          <SceneWrapper showGrid={showGrid}>
          </SceneWrapper>
          
          <div className="absolute bottom-4 left-4 bg-wood-100/90 backdrop-blur rounded-lg px-3 py-2 text-sm text-wood-700 border border-wood-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>点击构件选择 · 从左侧拖入添加 · 右键旋转视角</span>
            </div>
          </div>
        </div>
        
        <div className="w-72 bg-wood-50 border-l border-wood-200 overflow-y-auto scrollbar-wood">
          <PropertyPanel />
        </div>
      </div>
    </div>
  )
}
