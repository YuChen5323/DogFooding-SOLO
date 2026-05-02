import * as planck from 'planck-js'
import { PhysicsWorldConfig } from '../types'
import type {
  Joint,
  RevoluteJoint,
  RevoluteJointDef,
  DistanceJoint,
  DistanceJointDef,
  PrismaticJoint,
  PrismaticJointDef,
} from 'planck-js'

const RevoluteJointCtor = (planck as any).RevoluteJoint
const DistanceJointCtor = (planck as any).DistanceJoint
const PrismaticJointCtor = (planck as any).PrismaticJoint

export class PhysicsWorld {
  private world: planck.World
  private config: PhysicsWorldConfig
  private timeStep: number = 1 / 60
  private accumulatedTime: number = 0
  private _isPaused: boolean = false
  private isStepping: boolean = false
  private stepCount: number = 0

  constructor(config?: Partial<PhysicsWorldConfig>) {
    this.config = {
      gravity: planck.Vec2(0, 9.8),
      allowSleeping: true,
      ...config,
    }

    this.world = planck.World({
      gravity: this.config.gravity,
      allowSleep: this.config.allowSleeping,
    })
  }

  getWorld(): planck.World {
    return this.world
  }

  setGravity(gravity: planck.Vec2): void {
    this.config.gravity = gravity
    this.world.setGravity(gravity)
  }

  getGravity(): planck.Vec2 {
    return this.config.gravity.clone()
  }

  setPaused(paused: boolean): void {
    this._isPaused = paused
  }

  isPaused(): boolean {
    return this._isPaused
  }

  stepSingle(): void {
    this.isStepping = true
    this.stepCount = 1
  }

  update(deltaTime: number): void {
    if (this._isPaused && !this.isStepping) {
      return
    }

    if (this.isStepping) {
      if (this.stepCount > 0) {
        this.world.step(this.timeStep)
        this.stepCount--
      }
      if (this.stepCount === 0) {
        this.isStepping = false
      }
      return
    }

    this.accumulatedTime += deltaTime

    while (this.accumulatedTime >= this.timeStep) {
      this.world.step(this.timeStep)
      this.accumulatedTime -= this.timeStep
    }
  }

  reset(): void {
    this.world = planck.World({
      gravity: this.config.gravity,
      allowSleep: this.config.allowSleeping,
    })
    this.accumulatedTime = 0
    this._isPaused = false
    this.isStepping = false
    this.stepCount = 0
  }

  clear(): void {
    let body = this.world.getBodyList()
    while (body) {
      const nextBody = body.getNext()
      this.world.destroyBody(body)
      body = nextBody
    }

    let joint = this.world.getJointList()
    while (joint) {
      const nextJoint = joint.getNext()
      this.world.destroyJoint(joint)
      joint = nextJoint
    }
  }

  createRevoluteJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    anchor: planck.Vec2,
    options?: {
      enableMotor?: boolean
      motorSpeed?: number
      maxMotorTorque?: number
      enableLimit?: boolean
      lowerAngle?: number
      upperAngle?: number
    }
  ): RevoluteJoint {
    const jointDef: RevoluteJointDef = {
      bodyA: bodyA,
      bodyB: bodyB,
      localAnchorA: anchor,
      localAnchorB: anchor,
      referenceAngle: 0,
      enableMotor: options?.enableMotor ?? false,
      motorSpeed: options?.motorSpeed ?? 0,
      maxMotorTorque: options?.maxMotorTorque ?? 0,
      enableLimit: options?.enableLimit ?? false,
      lowerAngle: options?.lowerAngle ?? 0,
      upperAngle: options?.upperAngle ?? 0,
    }

    return this.world.createJoint(RevoluteJointCtor(jointDef)) as RevoluteJoint
  }

  createDistanceJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    anchorA: planck.Vec2,
    anchorB: planck.Vec2,
    options?: {
      length?: number
      frequency?: number
      dampingRatio?: number
    }
  ): DistanceJoint {
    const jointDef: DistanceJointDef = {
      bodyA: bodyA,
      bodyB: bodyB,
      localAnchorA: anchorA,
      localAnchorB: anchorB,
      length: options?.length,
      frequencyHz: options?.frequency,
      dampingRatio: options?.dampingRatio,
    }

    return this.world.createJoint(DistanceJointCtor(jointDef)) as DistanceJoint
  }

  createPrismaticJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    anchor: planck.Vec2,
    axis: planck.Vec2,
    options?: {
      enableMotor?: boolean
      motorSpeed?: number
      maxMotorForce?: number
      enableLimit?: boolean
      lowerTranslation?: number
      upperTranslation?: number
    }
  ): PrismaticJoint {
    const jointDef: PrismaticJointDef = {
      bodyA: bodyA,
      bodyB: bodyB,
      localAnchorA: anchor,
      localAnchorB: anchor,
      localAxisA: axis,
      referenceAngle: 0,
      enableMotor: options?.enableMotor ?? false,
      motorSpeed: options?.motorSpeed ?? 0,
      maxMotorForce: options?.maxMotorForce ?? 0,
      enableLimit: options?.enableLimit ?? false,
      lowerTranslation: options?.lowerTranslation ?? 0,
      upperTranslation: options?.upperTranslation ?? 0,
    }

    return this.world.createJoint(PrismaticJointCtor(jointDef)) as PrismaticJoint
  }

  destroyJoint(joint: Joint): void {
    this.world.destroyJoint(joint)
  }
}
