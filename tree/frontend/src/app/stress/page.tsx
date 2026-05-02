"use client"

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { SceneWrapper } from '@/components/three/SceneWrapper'
import { STRESS_COLOR_SCALE, getStressColor } from '@/lib/colorUtils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Play,
  Pause,
  RefreshCw,
  ArrowUpDown,
  Info,
  Eye,
  EyeOff
} from 'lucide-react'

export default function StressPage() {
  const { 
    components, 
    joints,
    toggleStressVisualization,
    isStressVisualizationEnabled,
    updateComponent
  } = useAppStore()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loadDirection, setLoadDirection] = useState<'x' | 'y' | 'z'>('y')
  const [loadMagnitude, setLoadMagnitude] = useState(100)
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null)
  
  const runStressAnalysis = () => {
    setIsAnalyzing(true)
    
    setTimeout(() => {
      components.forEach((comp, index) => {
        const stress = Math.random() * 100
        updateComponent(comp.id, { stress })
      })
      
      setIsAnalyzing(false)
      toggleStressVisualization()
    }, 1500)
  }
  
  const toggleVisualization = () => {
    toggleStressVisualization()
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-wood-100 border-b border-wood-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-wood-800">节点受力分析</h1>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm text-wood-600">荷载方向:</span>
            <Select
              value={loadDirection}
              onValueChange={(v: 'x' | 'y' | 'z') => setLoadDirection(v)}
            >
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">X轴</SelectItem>
                <SelectItem value="y">Y轴</SelectItem>
                <SelectItem value="z">Z轴</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVisualization}
            className={isStressVisualizationEnabled ? 'bg-wood-200' : ''}
          >
            {isStressVisualizationEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={runStressAnalysis}
            disabled={isAnalyzing || components.length === 0}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-wood-50 border-r border-wood-200 overflow-y-auto scrollbar-wood p-3">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-3 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                荷载设置
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-wood-600 mb-1 block">
                    荷载大小: {loadMagnitude} N
                  </label>
                  <Slider
                    value={[loadMagnitude]}
                    onValueChange={([value]) => setLoadMagnitude(value)}
                    min={10}
                    max={1000}
                    step={10}
                  />
                </div>
                <div>
                  <Button 
                    className="w-full" 
                    onClick={runStressAnalysis}
                    disabled={isAnalyzing || components.length === 0}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        运行受力分析
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                应力颜色图例
              </h3>
              <div className="space-y-2">
                {STRESS_COLOR_SCALE.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: stop.color }}
                    />
                    <span className="text-xs text-wood-600">
                      {(stop.value * 100).toFixed(0)}% 应力
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-wood-50 rounded text-xs text-wood-500">
                蓝色: 低应力 → 红色: 高应力
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-2">构件应力列表</h3>
              {components.length === 0 ? (
                <p className="text-xs text-wood-500 text-center py-4">
                  暂无构件<br />
                  请先在搭建沙盒中添加构件
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {components.map((comp) => (
                    <div 
                      key={comp.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-wood-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ 
                            backgroundColor: comp.stress !== undefined 
                              ? getStressColor(comp.stress) 
                              : '#d4d3c3' 
                          }}
                        />
                        <span className="text-xs text-wood-700">
                          {comp.chineseName}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        comp.stress && comp.stress > 80 ? "text-red-600" :
                        comp.stress && comp.stress > 50 ? "text-orange-600" :
                        "text-green-600"
                      )}>
                        {comp.stress !== undefined ? `${comp.stress.toFixed(1)} MPa` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <SceneWrapper>
          </SceneWrapper>
          
          <div className="absolute bottom-4 left-4 bg-wood-100/90 backdrop-blur rounded-lg px-3 py-2 text-sm text-wood-700 border border-wood-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>
                {isStressVisualizationEnabled 
                  ? '应力可视化已启用 - 颜色表示应力大小' 
                  : '点击"运行受力分析"按钮开始分析'}
              </span>
            </div>
          </div>
          
          {components.some(c => c.stress !== undefined) && (
            <div className="absolute top-4 right-4 bg-wood-100/90 backdrop-blur rounded-lg px-3 py-2 border border-wood-200">
              <div className="text-xs text-wood-600">最大应力</div>
              <div className="text-lg font-bold text-red-600">
                {Math.max(...components.map(c => c.stress || 0)).toFixed(1)} MPa
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
