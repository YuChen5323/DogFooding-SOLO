import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import localforage from 'localforage';
import { HumanBody } from './components/HumanBody';
import { AcupointSystem } from './components/AcupointSystem';
import { MeridianSystem } from './components/MeridianSystem';
import { NeedleSimulation } from './components/NeedleSimulation';
import { UIControlPanel } from './components/UIControlPanel';
import { AcupointInfoPanel } from './components/AcupointInfoPanel';
import { useAcupointStore } from './stores/acupointStore';
import { useUIVisualizationStore } from './stores/uiVisualizationStore';
import { loadAcupointData, initLocalForage } from './data/acupointData';
import { PerspectiveCamera } from '@react-three/drei';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const controlsRef = useRef<any>(null);
  
  const { 
    selectedAcupoint, 
    setSelectedAcupoint,
    isInsertionMode
  } = useAcupointStore();
  
  const {
    showMeridians,
    showAcupoints,
    anatomicalView
  } = useUIVisualizationStore();

  // Camera targets for different anatomical views
  const cameraTargets = {
    front: { position: [0, 1.5, 4] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
    back: { position: [0, 1.5, -4] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
    left: { position: [-3, 1.5, 0] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
    right: { position: [3, 1.5, 0] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
    top: { position: [0, 4, 0] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
    perspective: { position: [2, 2, 3] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] }
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingProgress(10)
        
        // Initialize LocalForage
        await initLocalForage()
        setLoadingProgress(30)
        
        // Load acupoint data
        await loadAcupointData()
        setLoadingProgress(70)
        
        // Verify data was loaded
        const acupointCount = await localforage.length()
        console.log(`Loaded ${acupointCount} acupoints from LocalForage`)
        setLoadingProgress(100)
        
        // Small delay for smooth transition
        setTimeout(() => {
          setLoading(false)
        }, 500)
        
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setLoading(false)
      }
    }
    
    initializeApp()
  }, [])

  // Update camera when anatomical view changes
  useEffect(() => {
    if (controlsRef.current) {
      const { position, target } = cameraTargets[anatomicalView]
      
      // Smoothly animate camera position
      controlsRef.current.setPosition(...position)
      controlsRef.current.setTarget(...target)
      controlsRef.current.update()
    }
  }, [anatomicalView])

  const handleCanvasClick = (event: any) => {
    if (isInsertionMode) {
      // Handle needle insertion
      event.stopPropagation()
    }
  }

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在加载穴位数据... {loadingProgress}%</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        onClick={handleCanvasClick}
        style={{ background: 'linear-gradient(to bottom, #f8f5f0, #f0e6d6)' }}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={cameraTargets[anatomicalView].position}
          fov={45}
          near={0.1}
          far={100}
        />
        
        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          target={cameraTargets[anatomicalView].target}
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.3}
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        
        {/* Human Body Model */}
        <HumanBody />
        
        {/* Meridian System */}
        {showMeridians && <MeridianSystem />}
        
        {/* Acupoint System */}
        {showAcupoints && <AcupointSystem />}
        
        {/* Needle Simulation */}
        {isInsertionMode && <NeedleSimulation />}
      </Canvas>
      
      {/* UI Control Panel */}
      <UIControlPanel />
      
      {/* Acupoint Info Panel - only show when an acupoint is selected */}
      {selectedAcupoint && (
        <AcupointInfoPanel 
          acupoint={selectedAcupoint} 
          onClose={() => setSelectedAcupoint(null)} 
        />
      )}
      
      {/* Status Indicator */}
      {isInsertionMode && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(231, 76, 60, 0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          针刺练习模式 - 点击穴位进行进针练习
        </div>
      )}
    </div>
  )
}

export default App
