"use client"

import { useState } from 'react'
import { 
  Columns2, 
  Layers, 
  Grid3X3,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { COMPONENT_TYPES } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ComponentLibraryProps {
  onSelectComponent: (type: string) => void
}

const categories = [
  { id: 'column', name: '柱类', icon: Columns2 },
  { id: 'beam', name: '梁枋类', icon: Layers },
  { id: 'bracket', name: '斗拱类', icon: Grid3X3 },
]

export function ComponentLibrary({ onSelectComponent }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    column: true,
    beam: true,
    bracket: true
  })
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }
  
  const getComponentsByCategory = (category: string) => {
    return COMPONENT_TYPES.filter(c => c.category === category)
  }

  return (
    <div className="p-3">
      <h2 className="text-sm font-semibold text-wood-800 mb-3 px-1">构件库</h2>
      
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon
          const components = getComponentsByCategory(category.id)
          
          return (
            <div key={category.id} className="border border-wood-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 bg-wood-100 hover:bg-wood-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-wood-600" />
                  <span className="text-sm font-medium text-wood-800">{category.name}</span>
                </div>
                {expandedCategories[category.id] ? (
                  <ChevronDown className="h-4 w-4 text-wood-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-wood-500" />
                )}
              </button>
              
              {expandedCategories[category.id] && (
                <div className="p-2 space-y-1 bg-wood-50">
                  {components.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => onSelectComponent(component.id)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('componentType', component.id)
                      }}
                      className="w-full text-left p-2 rounded-md border border-wood-200 bg-white hover:bg-wood-100 hover:border-wood-300 transition-all draggable-item"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded border",
                          component.category === 'column' ? 'bg-wood-300 border-wood-400' :
                          component.category === 'beam' ? 'bg-wood-400 border-wood-500' :
                          'bg-wood-500 border-wood-600'
                        )}></div>
                        <div>
                          <div className="text-sm font-medium text-wood-800">
                            {component.chineseName}
                          </div>
                          <div className="text-xs text-wood-500">
                            {component.name}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-wood-500 line-clamp-2">
                        {component.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 p-3 bg-wood-100 rounded-lg border border-wood-200">
        <h3 className="text-sm font-medium text-wood-700 mb-2">快速添加</h3>
        <p className="text-xs text-wood-600 mb-2">
          点击构件或拖拽到场景中添加
        </p>
        <div className="text-xs text-wood-500 space-y-1">
          <div>• 柱: 垂直承重构件</div>
          <div>• 梁: 水平承重构件</div>
          <div>• 斗拱: 悬挑装饰构件</div>
        </div>
      </div>
    </div>
  )
}
