import * as planck from 'planck-js'
import { v4 as uuidv4 } from 'uuid'
import { JointType } from '../types'
import type {
  Joint,
  RevoluteJoint,
  RevoluteJointDef,
  DistanceJoint,
  DistanceJointDef,
  PrismaticJoint,
  PrismaticJointDef,
  WeldJoint,
  WeldJointDef,
} from 'planck-js'

const RevoluteJointCtor = (planck as any).RevoluteJoint
const DistanceJointCtor = (planck as any).DistanceJoint
const PrismaticJointCtor = (planck as any).PrismaticJoint
const WeldJointCtor = (planck as any).WeldJoint

interface JointData {
  id: string
  type: JointType
  joint: Joint
  bodyAId: string
  bodyBId: string
  properties: Record<string, unknown>
}

export class JointManager {
  private joints: Map<string, JointData> = new Map()
  private world: planck.World | null = null

  setWorld(world: planck.World): void {
    this.world = world
  }

  createRevoluteJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    bodyAId: string,
    bodyBId: string,
    anchor: planck.Vec2,
    options?: {
      enableMotor?: boolean
      motorSpeed?: number
      maxMotorTorque?: number
      enableLimit?: boolean
      lowerAngle?: number
      upperAngle?: number
    }
  ): string | null {
    if (!this.world) return null

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

    const joint = this.world.createJoint(RevoluteJointCtor(jointDef)) as RevoluteJoint
    const id = uuidv4()

    this.joints.set(id, {
      id: id,
      type: JointType.REVOLUTE,
      joint: joint,
      bodyAId: bodyAId,
      bodyBId: bodyBId,
      properties: {
        enableMotor: options?.enableMotor,
        motorSpeed: options?.motorSpeed,
        maxMotorTorque: options?.maxMotorTorque,
        enableLimit: options?.enableLimit,
        lowerAngle: options?.lowerAngle,
        upperAngle: options?.upperAngle,
      },
    })

    return id
  }

  createDistanceJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    bodyAId: string,
    bodyBId: string,
    anchorA: planck.Vec2,
    anchorB: planck.Vec2,
    options?: {
      length?: number
      frequency?: number
      dampingRatio?: number
    }
  ): string | null {
    if (!this.world) return null

    const jointDef: DistanceJointDef = {
      bodyA: bodyA,
      bodyB: bodyB,
      localAnchorA: anchorA,
      localAnchorB: anchorB,
      length: options?.length,
      frequencyHz: options?.frequency,
      dampingRatio: options?.dampingRatio,
    }

    const joint = this.world.createJoint(DistanceJointCtor(jointDef)) as DistanceJoint
    const id = uuidv4()

    this.joints.set(id, {
      id: id,
      type: JointType.DISTANCE,
      joint: joint,
      bodyAId: bodyAId,
      bodyBId: bodyBId,
      properties: {
        length: options?.length,
        frequency: options?.frequency,
        dampingRatio: options?.dampingRatio,
      },
    })

    return id
  }

  createPrismaticJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    bodyAId: string,
    bodyBId: string,
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
  ): string | null {
    if (!this.world) return null

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

    const joint = this.world.createJoint(PrismaticJointCtor(jointDef)) as PrismaticJoint
    const id = uuidv4()

    this.joints.set(id, {
      id: id,
      type: JointType.PRISMATIC,
      joint: joint,
      bodyAId: bodyAId,
      bodyBId: bodyBId,
      properties: {
        enableMotor: options?.enableMotor,
        motorSpeed: options?.motorSpeed,
        maxMotorForce: options?.maxMotorForce,
        enableLimit: options?.enableLimit,
        lowerTranslation: options?.lowerTranslation,
        upperTranslation: options?.upperTranslation,
      },
    })

    return id
  }

  createWeldJoint(
    bodyA: planck.Body,
    bodyB: planck.Body,
    bodyAId: string,
    bodyBId: string,
    anchor: planck.Vec2
  ): string | null {
    if (!this.world) return null

    const jointDef: WeldJointDef = {
      bodyA: bodyA,
      bodyB: bodyB,
      localAnchorA: anchor,
      localAnchorB: anchor,
      localAxisA: planck.Vec2(1, 0),
      referenceAngle: 0,
    }

    const joint = this.world.createJoint(WeldJointCtor(jointDef)) as WeldJoint
    const id = uuidv4()

    this.joints.set(id, {
      id: id,
      type: JointType.WELD,
      joint: joint,
      bodyAId: bodyAId,
      bodyBId: bodyBId,
      properties: {},
    })

    return id
  }

  destroyJoint(id: string): boolean {
    const jointData = this.joints.get(id)
    if (!jointData || !this.world) return false

    this.world.destroyJoint(jointData.joint)
    return this.joints.delete(id)
  }

  getJoint(id: string): Joint | null {
    const jointData = this.joints.get(id)
    return jointData ? jointData.joint : null
  }

  getJointsByEntity(entityId: string): Joint[] {
    const joints: Joint[] = []
    this.joints.forEach((data) => {
      if (data.bodyAId === entityId || data.bodyBId === entityId) {
        joints.push(data.joint)
      }
    })
    return joints
  }

  clear(): void {
    if (this.world) {
      this.joints.forEach((data) => {
        this.world!.destroyJoint(data.joint)
      })
    }
    this.joints.clear()
  }

  getCount(): number {
    return this.joints.size
  }

  getAllJoints(): Map<string, Joint> {
    const result = new Map<string, Joint>()
    this.joints.forEach((data, id) => {
      result.set(id, data.joint)
    })
    return result
  }
}
