"use client"

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { SceneWrapper } from '@/components/three/SceneWrapper'
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
  Earthquake,
  Play,
  Pause,
  RefreshCw,
  Square,
  Activity,
  TrendingUp,
  Gauge,
  Info
} from 'lucide-react'

const earthquakeWaves = [
  { id: 'elcentro', name: 'El Centro 波 (1940)', duration: 30 },
  { id: 'northridge', name: 'Northridge 波 (1994)', duration: 40 },
  { id: 'kobe', name: 'Kobe 波 (1995)', duration: 50 },
  { id: 'tangshan', name: '唐山波 (模拟)', duration: 45 },
  { id: 'wenchuan', name: '汶川波 (模拟)', duration: 60 },
]

function generateWaveData(duration: number, magnitude: number): number[] {
  const data: number[] = []
  const sampleRate = 100
  
  for (let i = 0; i < duration * sampleRate; i++) {
    const t = i / sampleRate
    const pga = magnitude * 0.1
    const decay = Math.exp(-t / (duration * 0.3))
    
    const freq1 = Math.sin(t * 2 * Math.PI * 1.5)
    const freq2 = Math.sin(t * 2 * Math.PI * 3.2) * 0.6
    const freq3 = Math.sin(t * 2 * Math.PI * 5.5) * 0.3
    const noise = (Math.random() - 0.5) * 0.2
    
    const value = (freq1 + freq2 + freq3 + noise) * pga * decay
    data.push(value)
  }
  
  return data
}

export default function EarthquakePage() {
  const { 
    components,
    earthquakeData,
    startEarthquakeSimulation,
    stopEarthquakeSimulation,
    setEarthquakeMagnitude,
    addEarthquakeRecord,
    clearEarthquakeRecords,
    isPhysicsEnabled
  } = useAppStore()
  
  const [selectedWave, setSelectedWave] = useState('elcentro')
  const [magnitude, setMagnitude] = useState(6.0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [waveData, setWaveData] = useState<number[]>([])
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  
  useEffect(() => {
    const wave = earthquakeWaves.find(w => w.id === selectedWave)
    if (wave) {
      const data = generateWaveData(wave.duration, magnitude)
      setWaveData(data)
    }
  }, [selectedWave, magnitude])
  
  const startSimulation = () => {
    if (components.length === 0) return
    
    setIsSimulating(true)
    setCurrentTime(0)
    clearEarthquakeRecords()
    startEarthquakeSimulation()
    startTimeRef.current = performance.now()
    
    const wave = earthquakeWaves.find(w => w.id === selectedWave)
    const duration = wave?.duration || 30
    
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTimeRef.current) / 1000
      setCurrentTime(Math.min(elapsed, duration))
      
      if (elapsed < duration && isSimulating) {
        const waveIndex = Math.floor(elapsed * 100)
        const accel = waveData[waveIndex] || 0
        
        addEarthquakeRecord({
          acceleration: { x: accel * 0.5, y: 0, z: accel },
          displacement: { x: Math.sin(elapsed) * magnitude * 0.01, y: 0, z: Math.cos(elapsed) * magnitude * 0.01 },
          velocity: { x: accel * 0.1, y: 0, z: accel * 0.1 },
          energyDissipated: magnitude * elapsed * 10
        })
        
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsSimulating(false)
        stopEarthquakeSimulation()
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }
  
  const stopSimulation = () => {
    setIsSimulating(false)
    stopEarthquakeSimulation()
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  const resetSimulation = () => {
    stopSimulation()
    setCurrentTime(0)
    clearEarthquakeRecords()
  }

  const wave = earthquakeWaves.find(w => w.id === selectedWave)
  const maxDisplacement = Math.max(
    ...earthquakeData.records.map(r => 
      Math.max(Math.abs(r.displacement.x), Math.abs(r.displacement.z))
    ),
    0.01
  )

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-wood-100 border-b border-wood-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-wood-800">抗震推演</h1>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm text-wood-600">地震波:</span>
            <Select
              value={selectedWave}
              onValueChange={setSelectedWave}
              disabled={isSimulating}
            >
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {earthquakeWaves.map(wave => (
                  <SelectItem key={wave.id} value={wave.id}>
                    {wave.name}
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
            onClick={resetSimulation}
            disabled={isSimulating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={isSimulating ? stopSimulation : startSimulation}
            disabled={components.length === 0}
          >
            {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-wood-50 border-r border-wood-200 overflow-y-auto scrollbar-wood p-3">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-3 flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                地震参数设置
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-wood-600 mb-1 block">
                    震级: {magnitude.toFixed(1)} 级
                  </label>
                  <Slider
                    value={[magnitude]}
                    onValueChange={([value]) => {
                      setMagnitude(value)
                      setEarthquakeMagnitude(value)
                    }}
                    min={3.0}
                    max={9.0}
                    step={0.1}
                    disabled={isSimulating}
                  />
                  <div className="flex justify-between text-xs text-wood-500 mt-1">
                    <span>3.0</span>
                    <span>6.0</span>
                    <span>9.0</span>
                  </div>
                </div>
                
                <div className="p-2 bg-wood-50 rounded text-xs text-wood-600">
                  <div className="flex justify-between mb-1">
                    <span>波类型:</span>
                    <span className="font-medium">{wave?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>持续时间:</span>
                    <span className="font-medium">{wave?.duration}秒</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-wood-200 p-3">
              <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                模拟控制
              </h3>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={isSimulating ? stopSimulation : startSimulation}
                  disabled={components.length === 0}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      暂停模拟
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始推演
                    </>
                  )}
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={resetSimulation}
                  disabled={isSimulating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置
                </Button>
              </div>
              
              {components.length === 0 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-600">
                  请先在搭建沙盒中添加构件
                </div>
              )}
            </div>
            
            {earthquakeData.records.length > 0 && (
              <div className="bg-white rounded-lg border border-wood-200 p-3">
                <h3 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  实时数据
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-wood-500">模拟时间:</span>
                    <span className="font-medium text-wood-800">
                      {currentTime.toFixed(1)}s / {wave?.duration}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">最大位移:</span>
                    <span className="font-medium text-wood-800">
                      {(maxDisplacement * 100).toFixed(2)} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-wood-500">能量耗散:</span>
                    <span className="font-medium text-wood-800">
                      {earthquakeData.records.length > 0 
                        ? earthquakeData.records[earthquakeData.records.length - 1].energyDissipated.toFixed(0)
                        : 0} J
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-wood-100">
                  <div className="text-xs text-wood-500 mb-1">模拟进度</div>
                  <div className="h-2 bg-wood-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-wood-500 transition-all duration-100"
                      style={{ 
                        width: `${(currentTime / (wave?.duration || 30)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <SceneWrapper>
          </SceneWrapper>
          
          <div className="absolute bottom-4 left-4 bg-wood-100/90 backdrop-blur rounded-lg px-3 py-2 text-sm text-wood-700 border border-wood-200">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>
                {isSimulating 
                  ? '地震模拟进行中 - 观察屋架摇摆响应' 
                  : components.length > 0 
                    ? '点击"开始推演"按钮启动地震模拟' 
                    : '请先在搭建沙盒中添加构件'}
              </span>
            </div>
          </div>
          
          {isSimulating && (
            <div className="absolute top-4 right-4 bg-red-500/90 text-white rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
              <Earthquake className="h-5 w-5" />
              <span className="font-medium">地震模拟中 - {magnitude.toFixed(1)}级</span>
            </div>
          )}
          
          {waveData.length > 0 && (
            <div className="absolute bottom-20 left-4 right-4 h-24 bg-wood-100/80 backdrop-blur rounded-lg border border-wood-200 overflow-hidden">
              <div className="p-2 text-xs text-wood-600 font-medium">地震波加速度时程</div>
              <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end">
                {waveData.slice(0, Math.floor(currentTime * 100)).map((value, i) => {
                  const normalized = (value + magnitude * 0.1) / (magnitude * 0.2)
                  return (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        height: `${normalized * 100}%`,
                        backgroundColor: value > 0 ? '#b95f2d' : '#d59359',
                        minHeight: '2px'
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
