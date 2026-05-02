"use client"

import { Physics } from '@react-three/cannon'
import { useAppStore } from '@/store/appStore'
import * as CANNON from 'cannon-es'

interface PhysicsProviderProps {
  children: React.ReactNode
  enabled: boolean
}

export function PhysicsProvider({ children, enabled }: PhysicsProviderProps) {
  const { gravity } = useAppStore()
  
  if (!enabled) {
    return <>{children}</>
  }
  
  return (
    <Physics
      gravity={[0, gravity, 0]}
      allowSleep={true}
      defaultContactMaterial={{
        friction: 0.8,
        restitution: 0.3,
        contactEquationStiffness: 1e6,
        contactEquationRelaxation: 3,
      }}
    >
      <PhysicsGround />
      {children}
    </Physics>
  )
}

function PhysicsGround() {
  return null
}
