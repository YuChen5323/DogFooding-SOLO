"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { ComponentMesh } from './ComponentMesh'
import { PhysicsProvider } from './PhysicsProvider'

interface SceneWrapperProps {
  children?: React.ReactNode
  showGrid?: boolean
  showEnvironment?: boolean
}

export function SceneWrapper({ 
  children, 
  showGrid = true,
  showEnvironment = true
}: SceneWrapperProps) {
  const { components, isPhysicsEnabled } = useAppStore()

  return (
    <div className="w-full h-full canvas-container">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera
          makeDefault
          position={[15, 12, 15]}
          fov={50}
        />
        
        <Suspense fallback={null}>
          {showEnvironment && (
            <Environment preset="city" />
          )}
          
          <color attach="background" args={['#fafaf8']} />
          
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight
            position={[-10, 10, -10]}
            intensity={0.3}
          />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          
          {showGrid && (
            <Grid
              position={[0, -0.01, 0]}
              args={[100, 100]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#d4d3c3"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#b8b6a1"
              fadeDistance={50}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />
          )}
          
          <PhysicsProvider enabled={isPhysicsEnabled}>
            {components.map((component) => (
              <ComponentMesh key={component.id} component={component} />
            ))}
            {children}
          </PhysicsProvider>
          
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
