"use client"

import { useAppStore } from '@/store/appStore'
import {
  ArrowUpDown,
  Move,
  RotateCw,
  Box,
  Ruler,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function PropertyPanel() {
  const { components, selectedComponentId, updateComponent } = useAppStore()
  
  const selectedComponent = components.find(c => c.id === selectedComponentId)
  
  if (!selectedComponent) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-wood-800 mb-4">属性面板</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-wood-100 flex items-center justify-center mb-4">
            <Box className="h-8 w-8 text-wood-400" />
          </div>
          <p className="text-sm text-wood-600 mb-2">未选择构件</p>
          <p className="text-xs text-wood-500">点击场景中的构件以查看和编辑属性</p>
        </div>
        
        <div className="mt-6 p-3 bg-wood-100 rounded-lg border border-wood-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-wood-500" />
            <span className="text-sm font-medium text-wood-700">场景信息</span>
          </div>
          <div className="space-y-2 text-xs text-wood-600">
            <div className="flex justify-between">
              <span>构件数量:</span>
              <span className="font-medium">{components.length}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    updateComponent(selectedComponent.id, {
      position: {
        ...selectedComponent.position,
        [axis]: value
      }
    })
  }
  
  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    updateComponent(selectedComponent.id, {
      rotation: {
        ...selectedComponent.rotation,
        [axis]: value
      }
    })
  }
  
  const handleDimensionChange = (dim: 'width' | 'height' | 'depth', value: number) => {
    updateComponent(selectedComponent.id, {
      dimensions: {
        ...selectedComponent.dimensions,
        [dim]: value
      }
    })
  }

  return (
    <div className="p-3">
      <h2 className="text-sm font-semibold text-wood-800 mb-3">属性面板</h2>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-wood-200 p-3">
          <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            基本信息
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-wood-500">名称:</span>
              <span className="font-medium text-wood-800">
                {selectedComponent.chineseName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-wood-500">类型:</span>
              <span className="font-medium text-wood-800">
                {selectedComponent.type === 'column' ? '柱' : 
                 selectedComponent.type === 'beam' ? '梁' : '斗拱'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-wood-500">材份:</span>
              <span className="font-medium text-wood-800">
                {selectedComponent.caiFen.grade}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-wood-200 p-3">
          <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
            <Move className="h-3 w-3" />
            位置
          </h3>
          <div className="space-y-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                  axis === 'x' ? 'bg-red-100 text-red-600' :
                  axis === 'y' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                )}>
                  {axis.toUpperCase()}
                </span>
                <input
                  type="number"
                  value={selectedComponent.position[axis].toFixed(2)}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
                  className="flex-1 h-7 px-2 text-xs border border-wood-200 rounded focus:outline-none focus:ring-1 focus:ring-wood-400"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-wood-200 p-3">
          <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            旋转 (弧度)
          </h3>
          <div className="space-y-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                  axis === 'x' ? 'bg-red-100 text-red-600' :
                  axis === 'y' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                )}>
                  {axis.toUpperCase()}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedComponent.rotation[axis].toFixed(2)}
                  onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value) || 0)}
                  className="flex-1 h-7 px-2 text-xs border border-wood-200 rounded focus:outline-none focus:ring-1 focus:ring-wood-400"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-wood-200 p-3">
          <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            尺寸
          </h3>
          <div className="space-y-2">
            {([
              { key: 'width' as const, label: '宽' },
              { key: 'height' as const, label: '高' },
              { key: 'depth' as const, label: '深' }
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-8 text-xs text-wood-500">{label}:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={selectedComponent.dimensions[key].toFixed(2)}
                  onChange={(e) => handleDimensionChange(key, parseFloat(e.target.value) || 0.1)}
                  className="flex-1 h-7 px-2 text-xs border border-wood-200 rounded focus:outline-none focus:ring-1 focus:ring-wood-400"
                />
                <span className="text-xs text-wood-500">m</span>
              </div>
            ))}
          </div>
        </div>
        
        {selectedComponent.stress !== undefined && (
          <div className="bg-white rounded-lg border border-wood-200 p-3">
            <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              受力信息
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-wood-500">应力:</span>
                <span className={cn(
                  "font-medium",
                  selectedComponent.stress > 80 ? "text-red-600" :
                  selectedComponent.stress > 50 ? "text-orange-600" :
                  "text-green-600"
                )}>
                  {selectedComponent.stress.toFixed(2)} MPa
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
