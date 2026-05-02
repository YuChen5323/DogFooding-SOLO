import { FrameSnapshot, EntitySnapshot, JointSnapshot } from '../types'
import * as planck from 'planck-js'
import type { Joint } from 'planck-js'

export class ReplaySystem {
  private snapshots: FrameSnapshot[] = []
  private maxSnapshots: number = 10000
  private isRecording: boolean = false
  private isReplaying: boolean = false
  private currentFrameIndex: number = 0
  private frameRate: number = 60
  private lastFrameTime: number = 0

  startRecording(): void {
    this.snapshots = []
    this.isRecording = true
    this.isReplaying = false
    this.currentFrameIndex = 0
  }

  stopRecording(): void {
    this.isRecording = false
  }

  isRecordingActive(): boolean {
    return this.isRecording
  }

  recordFrame(
    entities: Map<string, { body: planck.Body; stress: number }>,
    joints: Map<string, Joint>
  ): void {
    if (!this.isRecording) return

    if (this.snapshots.length >= this.maxSnapshots) {
      this.snapshots.shift()
    }

    const entitySnapshots: EntitySnapshot[] = []
    entities.forEach((entityData, id) => {
      const body = entityData.body
      const position = body.getPosition()
      const velocity = body.getLinearVelocity()

      entitySnapshots.push({
        id: id,
        position: { x: position.x, y: position.y },
        angle: body.getAngle(),
        velocity: { x: velocity.x, y: velocity.y },
        angularVelocity: body.getAngularVelocity(),
        stress: entityData.stress,
      })
    })

    const jointSnapshots: JointSnapshot[] = []
    joints.forEach((joint, id) => {
      const reactionForce = joint.getReactionForce(1 / this.frameRate)
      const reactionTorque = joint.getReactionTorque(1 / this.frameRate)

      jointSnapshots.push({
        id: id,
        type: joint.getType(),
        force: Math.sqrt(reactionForce.x * reactionForce.x + reactionForce.y * reactionForce.y),
        torque: Math.abs(reactionTorque),
      })
    })

    this.snapshots.push({
      frameIndex: this.snapshots.length,
      entities: entitySnapshots,
      joints: jointSnapshots,
      timestamp: performance.now(),
    })
  }

  startReplay(): void {
    if (this.snapshots.length === 0) return

    this.isRecording = false
    this.isReplaying = true
    this.currentFrameIndex = 0
    this.lastFrameTime = performance.now()
  }

  stopReplay(): void {
    this.isReplaying = false
  }

  isReplayingActive(): boolean {
    return this.isReplaying
  }

  updateReplay(
    entities: Map<string, { body: planck.Body }>
  ): FrameSnapshot | null {
    if (!this.isReplaying || this.snapshots.length === 0) {
      return null
    }

    const now = performance.now()
    const frameInterval = 1000 / this.frameRate

    if (now - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = now

      if (this.currentFrameIndex >= this.snapshots.length) {
        this.isReplaying = false
        return null
      }

      const snapshot = this.snapshots[this.currentFrameIndex]

      snapshot.entities.forEach((entitySnapshot) => {
        const entityData = entities.get(entitySnapshot.id)
        if (entityData && entityData.body) {
          const body = entityData.body
          body.setTransform(
            planck.Vec2(entitySnapshot.position.x, entitySnapshot.position.y),
            entitySnapshot.angle
          )
          body.setLinearVelocity(
            planck.Vec2(entitySnapshot.velocity.x, entitySnapshot.velocity.y)
          )
          body.setAngularVelocity(entitySnapshot.angularVelocity)
        }
      })

      this.currentFrameIndex++
      return snapshot
    }

    return null
  }

  goToFrame(frameIndex: number): FrameSnapshot | null {
    if (frameIndex < 0 || frameIndex >= this.snapshots.length) {
      return null
    }

    this.currentFrameIndex = frameIndex
    return this.snapshots[frameIndex]
  }

  getCurrentFrameIndex(): number {
    return this.currentFrameIndex
  }

  getTotalFrames(): number {
    return this.snapshots.length
  }

  getSnapshot(index: number): FrameSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) {
      return null
    }
    return this.snapshots[index]
  }

  clearSnapshots(): void {
    this.snapshots = []
    this.currentFrameIndex = 0
  }

  getFrameRate(): number {
    return this.frameRate
  }

  setFrameRate(rate: number): void {
    this.frameRate = rate
  }

  getMaxSnapshots(): number {
    return this.maxSnapshots
  }

  setMaxSnapshots(max: number): void {
    this.maxSnapshots = max
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }
  }

  getCompressedSize(): number {
    let totalSize = 0
    this.snapshots.forEach((snapshot) => {
      totalSize += JSON.stringify(snapshot).length
    })
    return totalSize
  }
}
