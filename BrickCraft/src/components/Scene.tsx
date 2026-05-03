import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState } from 'react'
import LegoPart from './LegoPart'

/**
 * 场景内容组件
 * 包含所有3D元素
 */
function SceneContent() {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)

  // 示例零件数据
  const exampleParts = [
    { id: 'brick1', partId: '3001', color: 14, position: [-3, 0, -3] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'brick2', partId: '3001', color: 4, position: [3, 0, -3] as [number, number, number], rotation: [0, 45, 0] as [number, number, number] },
    { id: 'brick3', partId: '3001', color: 1, position: [-3, 0, 3] as [number, number, number], rotation: [0, 90, 0] as [number, number, number] },
    { id: 'brick4', partId: '3001', color: 2, position: [3, 0, 3] as [number, number, number], rotation: [0, 135, 0] as [number, number, number] },
    { id: 'plate1', partId: '3020', color: 15, position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'plate2', partId: '3020', color: 71, position: [0, 0.333, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { id: 'plate3', partId: '3020', color: 72, position: [0, 0.666, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
  ]

  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 8, 12]} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        minDistance={2} 
        maxDistance={50}
        target={[0, 0, 0]}
      />
      
      {/* 环境光 */}
      <ambientLight intensity={0.6} />
      
      {/* 主方向光 */}
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 补光 */}
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />
      
      {/* 环境 */}
      <Environment preset="city" />
      
      {/* 示例零件展示 */}
      {exampleParts.map((part) => (
        <LegoPart
          key={part.id}
          partId={part.partId}
          color={part.color}
          position={part.position}
          rotation={part.rotation}
          onPointerOver={() => setHoveredPart(part.id)}
          onPointerOut={() => setHoveredPart(null)}
          onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
        />
      ))}
      
      {/* 网格地面 */}
      <Grid 
        position={[0, -0.5, 0]} 
        args={[40, 40]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#a5a5a5" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#595959" 
        fadeDistance={30} 
        fadeStrength={1} 
        followCamera={false} 
        infiniteGrid={true}
      />
    </>
  )
}

/**
 * 主场景组件
 */
export default function Scene() {
  return (
    <Canvas 
      shadows 
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}
