import { Vec2 } from 'planck-js'

export type EntityId = string

export enum EntityType {
  GEAR = 'gear',
  LINK = 'link',
  SPRING = 'spring',
  MOTOR = 'motor',
  HINGE = 'hinge',
  BALL = 'ball',
  BASKET = 'basket',
  FIXED_POINT = 'fixedPoint',
  GROUND = 'ground',
}

export enum JointType {
  REVOLUTE = 'revolute',
  PRISMATIC = 'prismatic',
  DISTANCE = 'distance',
  WELD = 'weld',
  MOTOR = 'motor',
  GEAR = 'gear',
}

export interface EntityProps {
  id: EntityId
  type: EntityType
  position: Vec2
  angle: number
  isStatic: boolean
  density: number
  friction: number
  restitution: number
  properties: Record<string, unknown>
}

export interface EntitySnapshot {
  id: EntityId
  position: { x: number; y: number }
  angle: number
  velocity: { x: number; y: number }
  angularVelocity: number
  stress: number
}

export interface FrameSnapshot {
  frameIndex: number
  entities: EntitySnapshot[]
  joints: JointSnapshot[]
  timestamp: number
}

export interface JointSnapshot {
  id: string
  type: string
  force: number
  torque: number
}

export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  isReplaying: boolean
  currentFrame: number
  totalFrames: number
  timeScale: number
}

export interface Challenge {
  id: string
  name: string
  description: string
  initialEntities: EntityProps[]
  goalDescription: string
  checkGoal: (entities: Map<EntityId, unknown>) => boolean
}

export interface UserWork {
  id: string
  name: string
  description: string
  entities: EntityProps[]
  createdAt: number
  updatedAt: number
}

export interface CameraState {
  position: Vec2
  zoom: number
}

export interface PhysicsWorldConfig {
  gravity: Vec2
  allowSleeping: boolean
}
