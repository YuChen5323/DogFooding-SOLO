"use client"

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  RotateCw,
  Info,
  CheckSquare,
  Square
} from 'lucide-react'

const viewTypes = [
  { id: 'front', name: '正立面图', rotation: [0, 0, 0] as [number, number, number] },
  { id: 'side', name: '侧立面图', rotation: [0, Math.PI / 2, 0] as [number, number, number] },
  { id: 'top', name: '平面图', rotation: [-Math.PI / 2, 0, 0] as [number, number, number] },
  { id: 'isometric', name: '轴测图', rotation: [-Math.PI / 4, Math.PI / 4, 0] as [number, number, number] },
]

export default function ExportPage() {
  const { components } = useAppStore()
  
  const [selectedView, setSelectedView] = useState('front')
  const [showLabels, setShowLabels] = useState(true)
  const [showDimensions, setShowDimensions] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [scale, setScale] = useState(100)
  const [isExporting, setIsExporting] = useState(false)
  
  const currentView = viewTypes.find(v => v.id === selectedView)
  
  const generateSVG = (): string => {
    const width = 800
    const height = 600
    const centerX = width / 2
    const centerY = height / 2
    const baseScale = scale / 100 * 30
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .title { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: bold; }
      .subtitle { font-family: 'Noto Serif SC', serif; font-size: 14px; fill: #8b5a2b; }
      .component { stroke: #65341e; stroke-width: 1.5; fill: #e4b887; fill-opacity: 0.6; }
      .component-outline { stroke: #65341e; stroke-width: 2; fill: none; }
      .label-text { font-family: 'Noto Serif SC', serif; font-size: 12px; fill: #361a0e; }
      .dimension-line { stroke: #8b5a2b; stroke-width: 1; }
      .dimension-text { font-family: sans-serif; font-size: 10px; fill: #8b5a2b; }
      .grid-line { stroke: #d4d3c3; stroke-width: 0.5; stroke-dasharray: 4,4; }
      .leader-line { stroke: #65341e; stroke-width: 0.8; }
    </style>
  </defs>
  
  <rect width="${width}" height="${height}" fill="#fdf8f3"/>
  
  <text x="${centerX}" y="40" text-anchor="middle" class="title">中国古建筑木构架构造图</text>
  <text x="${centerX}" y="60" text-anchor="middle" class="subtitle">${currentView?.name} · 比例 1:${Math.round(100 / (scale / 100))}</text>
`

    if (showGrid) {
      for (let x = 0; x <= width; x += 50) {
        svgContent += `<line x1="${x}" y1="80" x2="${x}" y2="${height - 40}" class="grid-line"/>`
      }
      for (let y = 80; y <= height - 40; y += 50) {
        svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" class="grid-line"/>`
      }
    }

    const [rotX, rotY, rotZ] = currentView?.rotation || [0, 0, 0]
    
    components.forEach((comp, index) => {
      const projectX = (comp.position.x * Math.cos(rotY) + comp.position.z * Math.sin(rotY)) * baseScale
      const projectY = (-comp.position.y * Math.cos(rotX)) * baseScale
      
      const rectX = centerX + projectX - (comp.dimensions.width * baseScale / 2)
      const rectY = centerY + projectY - (comp.dimensions.height * baseScale / 2)
      const rectW = comp.dimensions.width * baseScale
      const rectH = comp.dimensions.height * baseScale
      
      svgContent += `
  <rect x="${rectX.toFixed(2)}" y="${rectY.toFixed(2)}" width="${rectW.toFixed(2)}" height="${rectH.toFixed(2)}" class="component"/>
  <rect x="${rectX.toFixed(2)}" y="${rectY.toFixed(2)}" width="${rectW.toFixed(2)}" height="${rectH.toFixed(2)}" class="component-outline"/>`
      
      if (showLabels) {
        const labelX = rectX + rectW + 15
        const labelY = rectY + rectH / 2
        
        svgContent += `
  <line x1="${(rectX + rectW).toFixed(2)}" y1="${labelY.toFixed(2)}" x2="${labelX.toFixed(2)}" y2="${labelY.toFixed(2)}" class="leader-line"/>
  <text x="${(labelX + 5).toFixed(2)}" y="${(labelY + 4).toFixed(2)}" class="label-text">${comp.chineseName} (${comp.name})</text>`
      }
    })

    if (showDimensions && components.length > 0) {
      svgContent += `
  <text x="20" y="${height - 20}" class="dimension-text">注: 图中尺寸单位为米，已按材份制换算</text>`
    }

    svgContent += `
</svg>`

    return svgContent
  }
  
  const handleExport = () => {
    setIsExporting(true)
    
    setTimeout(() => {
      const svgContent = generateSVG()
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `木构架构造图_${currentView?.name}_${new Date().toISOString().slice(0, 10)}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      setIsExporting(false)
    }, 500)
  }
  
  const handlePreview = () => {
    const svgContent = generateSVG()
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-wood-100 border-b border-wood-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-wood-800">构造图册导出</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handlePreview}
            disabled={components.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            预览
          </Button>
          <Button
            onClick={handleExport}
            disabled={components.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                导出 SVG
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-wood-50 border-r border-wood-200 overflow-y-auto scrollbar-wood p-3">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-3 flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                视图设置
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-wood-600 mb-1 block">选择视图</label>
                  <Select
                    value={selectedView}
                    onValueChange={setSelectedView}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {viewTypes.map(view => (
                        <SelectItem key={view.id} value={view.id}>
                          {view.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-wood-600 mb-1 block">
                    绘图比例: {scale}%
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-wood-500 mt-1">
                    <span>20%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-3">显示选项</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-wood-50 transition-colors"
                >
                  <span className="text-sm text-wood-700">构件名称标注</span>
                  {showLabels ? (
                    <CheckSquare className="h-4 w-4 text-wood-600" />
                  ) : (
                    <Square className="h-4 w-4 text-wood-300" />
                  )}
                </button>
                
                <button
                  onClick={() => setShowDimensions(!showDimensions)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-wood-50 transition-colors"
                >
                  <span className="text-sm text-wood-700">尺寸标注</span>
                  {showDimensions ? (
                    <CheckSquare className="h-4 w-4 text-wood-600" />
                  ) : (
                    <Square className="h-4 w-4 text-wood-300" />
                  )}
                </button>
                
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-wood-50 transition-colors"
                >
                  <span className="text-sm text-wood-700">网格背景</span>
                  {showGrid ? (
                    <CheckSquare className="h-4 w-4 text-wood-600" />
                  ) : (
                    <Square className="h-4 w-4 text-wood-300" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                导出信息
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-wood-500">当前视图:</span>
                  <span className="font-medium text-wood-700">{currentView?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-wood-500">构件数量:</span>
                  <span className="font-medium text-wood-700">{components.length} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-wood-500">输出格式:</span>
                  <span className="font-medium text-wood-700">SVG</span>
                </div>
              </div>
            </div>
            
            {components.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">提示</span>
                </div>
                <p className="text-xs text-orange-600">
                  当前场景中没有构件，请先在"搭建沙盒"中添加构件后再导出构造图。
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-wood-100 p-8 flex items-center justify-center overflow-auto">
          <div className="bg-white rounded-lg shadow-xl border border-wood-200 overflow-hidden" style={{ width: '800px', height: '600px' }}>
            <div 
              className="w-full h-full bg-wood-50 flex flex-col"
              dangerouslySetInnerHTML={{
                __html: generateSVG()
                  .replace(/^<\?xml[^>]*\?>/, '')
                  .replace(/<svg[^>]*>/, '')
                  .replace(/<\/svg>$/, '')
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
