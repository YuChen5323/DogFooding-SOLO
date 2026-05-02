import { PhysicsWorld } from './PhysicsWorld'
import { ReplaySystem } from './ReplaySystem'
import { SimulationState } from '../types'
import * as planck from 'planck-js'
import type { Joint } from 'planck-js'

export class SimulationController {
  private physicsWorld: PhysicsWorld
  private replaySystem: ReplaySystem
  private simulationState: SimulationState
  private timeScale: number = 1.0

  constructor(physicsWorld: PhysicsWorld, replaySystem: ReplaySystem) {
    this.physicsWorld = physicsWorld
    this.replaySystem = replaySystem
    this.simulationState = {
      isRunning: false,
      isPaused: false,
      isReplaying: false,
      currentFrame: 0,
      totalFrames: 0,
      timeScale: 1.0,
    }
  }

  getSimulationState(): SimulationState {
    return { ...this.simulationState }
  }

  start(): void {
    this.simulationState.isRunning = true
    this.simulationState.isPaused = false
    this.simulationState.isReplaying = false
    this.physicsWorld.setPaused(false)
    this.replaySystem.startRecording()
  }

  stop(): void {
    this.simulationState.isRunning = false
    this.simulationState.isPaused = false
    this.simulationState.isReplaying = false
    this.physicsWorld.setPaused(false)
    this.replaySystem.stopRecording()
    this.replaySystem.stopReplay()
  }

  pause(): void {
    this.simulationState.isPaused = true
    this.physicsWorld.setPaused(true)
    this.replaySystem.stopRecording()
  }

  resume(): void {
    this.simulationState.isPaused = false
    this.physicsWorld.setPaused(false)
    if (this.simulationState.isRunning && !this.simulationState.isReplaying) {
      this.replaySystem.startRecording()
    }
  }

  step(): void {
    if (!this.simulationState.isRunning) return

    this.physicsWorld.stepSingle()
    this.simulationState.currentFrame++
  }

  startReplay(): void {
    if (this.replaySystem.getTotalFrames() === 0) return

    this.simulationState.isReplaying = true
    this.simulationState.isPaused = false
    this.physicsWorld.setPaused(true)
    this.replaySystem.stopRecording()
    this.replaySystem.startReplay()
  }

  stopReplay(): void {
    this.simulationState.isReplaying = false
    this.replaySystem.stopReplay()
  }

  goToFrame(frameIndex: number): void {
    this.replaySystem.goToFrame(frameIndex)
    this.simulationState.currentFrame = frameIndex
  }

  update(
    deltaTime: number,
    entities: Map<string, { body: planck.Body; stress: number }>,
    joints: Map<string, Joint>
  ): void {
    const scaledDeltaTime = deltaTime * this.timeScale

    if (this.simulationState.isReplaying) {
      const snapshot = this.replaySystem.updateReplay(entities)
      if (snapshot) {
        this.simulationState.currentFrame = this.replaySystem.getCurrentFrameIndex()
        this.simulationState.totalFrames = this.replaySystem.getTotalFrames()
      }
      return
    }

    if (this.simulationState.isRunning && !this.simulationState.isPaused) {
      this.physicsWorld.update(scaledDeltaTime)
      this.replaySystem.recordFrame(entities, joints)
      this.simulationState.currentFrame = this.replaySystem.getCurrentFrameIndex()
      this.simulationState.totalFrames = this.replaySystem.getTotalFrames()
    }
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(10, scale))
    this.simulationState.timeScale = this.timeScale
  }

  getTimeScale(): number {
    return this.timeScale
  }

  isRunning(): boolean {
    return this.simulationState.isRunning
  }

  isPaused(): boolean {
    return this.simulationState.isPaused
  }

  isReplaying(): boolean {
    return this.simulationState.isReplaying
  }

  getCurrentFrame(): number {
    return this.simulationState.currentFrame
  }

  getTotalFrames(): number {
    return this.simulationState.totalFrames
  }

  reset(): void {
    this.physicsWorld.reset()
    this.replaySystem.clearSnapshots()
    this.simulationState = {
      isRunning: false,
      isPaused: false,
      isReplaying: false,
      currentFrame: 0,
      totalFrames: 0,
      timeScale: this.timeScale,
    }
  }
}
