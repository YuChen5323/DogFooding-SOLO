"use client"

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import * as THREE from 'three'
import { ComponentInstance } from '@/store/appStore'
import { useAppStore } from '@/store/appStore'
import { getStressColor } from '@/lib/colorUtils'

interface ComponentMeshProps {
  component: ComponentInstance
}

export function ComponentMesh({ component }: ComponentMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { isPhysicsEnabled, selectComponent, selectedComponentId, isStressVisualizationEnabled } = useAppStore()
  
  const [ref] = useBox(() => ({
    mass: 1,
    position: [component.position.x, component.position.y, component.position.z],
    rotation: [component.rotation.x, component.rotation.y, component.rotation.z],
    args: [
      component.dimensions.width,
      component.dimensions.height,
      component.dimensions.depth
    ],
    type: 'Dynamic',
  }), meshRef)
  
  const woodMaterial = useMemo(() => {
    const baseColor = isStressVisualizationEnabled && component.stress !== undefined
      ? getStressColor(component.stress)
      : (component.color || '#c87637')
    
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1,
    })
  }, [component.stress, component.color, isStressVisualizationEnabled])
  
  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: component.isSelected ? '#f59e0b' : '#8b5a2b',
      wireframe: true,
      transparent: true,
      opacity: component.isSelected ? 0.8 : 0.3,
    })
  }, [component.isSelected])
  
  const handleClick = (e: any) => {
    e.stopPropagation()
    selectComponent(component.id)
  }
  
  const dimensionScale = useMemo(() => {
    return {
      width: component.dimensions.width,
      height: component.dimensions.height,
      depth: component.dimensions.depth,
    }
  }, [component.dimensions])
  
  return (
    <group
      position={[component.position.x, component.position.y, component.position.z]}
      rotation={[component.rotation.x, component.rotation.y, component.rotation.z]}
    >
      <mesh
        ref={isPhysicsEnabled ? ref : meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            dimensionScale.width,
            dimensionScale.height,
            dimensionScale.depth,
          ]}
        />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      
      {component.isSelected && (
        <mesh
          position={[0, 0, 0]}
          onClick={handleClick}
        >
          <boxGeometry
            args={[
              dimensionScale.width * 1.01,
              dimensionScale.height * 1.01,
              dimensionScale.depth * 1.01,
            ]}
          />
          <primitive object={wireframeMaterial} attach="material" />
        </mesh>
      )}
      
      <ComponentLabel 
        component={component}
        position={[0, dimensionScale.height / 2 + 0.5, 0]}
      />
    </group>
  )
}

interface ComponentLabelProps {
  component: ComponentInstance
  position: [number, number, number]
}

function ComponentLabel({ component, position }: ComponentLabelProps) {
  const textRef = useRef<THREE.Object3D>(null)
  
  useFrame((state) => {
    if (textRef.current && component.isSelected) {
      textRef.current.lookAt(state.camera.position)
    }
  })
  
  if (!component.isSelected) return null
  
  return (
    <group ref={textRef} position={position}>
      <sprite scale={[2, 0.8, 1]}>
        <spriteMaterial
          color="#fffbeb"
          transparent
          opacity={0.9}
        />
      </sprite>
    </group>
  )
}
