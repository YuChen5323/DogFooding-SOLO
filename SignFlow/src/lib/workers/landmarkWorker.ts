/// <reference lib="webworker" />

import type {
  Landmark,
  WorkerMessage,
  WorkerMessageType,
  ProcessedFrame,
  HolisticResults,
  MediaPipeConfig
} from '../types'
import { HAND_JOINTS, HAND_CONNECTIONS, POSE_CONNECTIONS } from '../types'

const ctx: DedicatedWorkerGlobalScope = self as any

interface WorkerState {
  frameIndex: number
  isInitialized: boolean
  config: MediaPipeConfig
  holisticModule: any
  isProcessing: boolean
}

const state: WorkerState = {
  frameIndex: 0,
  isInitialized: false,
  config: {
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    enableSegmentation: false,
    smoothSegmentation: false,
    refineFaceLandmarks: false
  },
  holisticModule: null,
  isProcessing: false
}

function flattenLandmarks(landmarks: Landmark[] | null | undefined): number[] | null {
  if (!landmarks || landmarks.length === 0) return null
  const flattened: number[] = []
  for (const lm of landmarks) {
    flattened.push(lm.x, lm.y, lm.z)
    if (lm.visibility !== undefined) flattened.push(lm.visibility)
    if (lm.presence !== undefined) flattened.push(lm.presence)
  }
  return flattened
}

function normalizeLandmarks(
  leftHand: number[] | null,
  rightHand: number[] | null,
  pose: number[] | null
): number[] {
  const normalized: number[] = []
  
  if (leftHand) {
    normalized.push(...normalizeHand(leftHand, 'left'))
  } else {
    normalized.push(...new Array(63).fill(0))
  }
  
  if (rightHand) {
    normalized.push(...normalizeHand(rightHand, 'right'))
  } else {
    normalized.push(...new Array(63).fill(0))
  }
  
  if (pose) {
    normalized.push(...normalizePose(pose))
  } else {
    normalized.push(...new Array(99).fill(0))
  }
  
  return normalized
}

function normalizeHand(hand: number[], side: 'left' | 'right'): number[] {
  const points: [number, number, number][] = []
  for (let i = 0; i < hand.length; i += 3) {
    points.push([hand[i], hand[i + 1], hand[i + 2] || 0])
  }
  
  if (points.length === 0) return new Array(63).fill(0)
  
  const wrist = points[0]
  const centered = points.map(([x, y, z]) => [
    x - wrist[0],
    y - wrist[1],
    z - wrist[2]
  ])
  
  const mcpIndex = points[5]
  const mcpMiddle = points[9]
  const scale = Math.sqrt(
    Math.pow(mcpIndex[0] - mcpMiddle[0], 2) +
    Math.pow(mcpIndex[1] - mcpMiddle[1], 2)
  ) || 1
  
  const normalized = centered.map(([x, y, z]) => [
    x / scale,
    y / scale,
    z / scale
  ])
  
  const flattened: number[] = []
  for (const [x, y, z] of normalized) {
    flattened.push(x, y, z)
  }
  
  return flattened
}

function normalizePose(pose: number[]): number[] {
  const points: [number, number, number][] = []
  for (let i = 0; i < Math.min(pose.length, 99); i += 3) {
    points.push([pose[i], pose[i + 1], pose[i + 2] || 0])
  }
  
  if (points.length < 33) {
    return new Array(99).fill(0)
  }
  
  const leftShoulder = points[11]
  const rightShoulder = points[12]
  const center = [
    (leftShoulder[0] + rightShoulder[0]) / 2,
    (leftShoulder[1] + rightShoulder[1]) / 2,
    (leftShoulder[2] + rightShoulder[2]) / 2
  ]
  
  const centered = points.map(([x, y, z]) => [
    x - center[0],
    y - center[1],
    z - center[2]
  ])
  
  const shoulderDist = Math.sqrt(
    Math.pow(leftShoulder[0] - rightShoulder[0], 2) +
    Math.pow(leftShoulder[1] - rightShoulder[1], 2)
  ) || 1
  
  const normalized = centered.map(([x, y, z]) => [
    x / shoulderDist,
    y / shoulderDist,
    z / shoulderDist
  ])
  
  const flattened: number[] = []
  for (const [x, y, z] of normalized) {
    flattened.push(x, y, z)
  }
  
  return flattened
}

function processHolisticResults(results: HolisticResults): ProcessedFrame {
  const leftHand = flattenLandmarks(results.leftHandLandmarks)
  const rightHand = flattenLandmarks(results.rightHandLandmarks)
  
  let pose: number[] | null = null
  if (results.poseLandmarks) {
    pose = flattenLandmarks(results.poseLandmarks.landmarks)
  }
  
  let face: number[] | null = null
  if (results.faceLandmarks) {
    face = flattenLandmarks(results.faceLandmarks.landmarks)
  }
  
  const normalizedLandmarks = normalizeLandmarks(leftHand, rightHand, pose)
  
  return {
    timestamp: performance.now(),
    frameIndex: state.frameIndex++,
    leftHand,
    rightHand,
    pose,
    face,
    normalizedLandmarks
  }
}

async function loadMediaPipeModule(): Promise<any> {
  try {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic'
    document.head.appendChild(script)
    
    await new Promise((resolve) => {
      script.onload = resolve
      script.onerror = () => resolve(false)
    })
    
    const Holistic = (window as any).Holistic
    if (!Holistic) {
      throw new Error('MediaPipe Holistic module not found')
    }
    
    return Holistic
  } catch (error) {
    console.error('Failed to load MediaPipe:', error)
    return null
  }
}

async function initMediaPipe(config: MediaPipeConfig): Promise<boolean> {
  try {
    const HolisticModule = await loadMediaPipeModule()
    
    if (!HolisticModule) {
      return false
    }
    
    const holistic = new HolisticModule({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      }
    })
    
    holistic.setOptions({
      modelComplexity: config.modelComplexity,
      smoothLandmarks: config.smoothLandmarks,
      minDetectionConfidence: config.minDetectionConfidence,
      minTrackingConfidence: config.minTrackingConfidence,
      enableSegmentation: config.enableSegmentation,
      smoothSegmentation: config.smoothSegmentation,
      refineFaceLandmarks: config.refineFaceLandmarks
    })
    
    state.holisticModule = holistic
    state.isInitialized = true
    state.config = config
    
    return true
  } catch (error) {
    console.error('Failed to initialize MediaPipe:', error)
    return false
  }
}

function sendMessage(type: WorkerMessageType, payload?: any, error?: string): void {
  const message: WorkerMessage = { type, payload, error }
  ctx.postMessage(message)
}

ctx.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'INIT': {
      const config = (payload?.config || state.config) as MediaPipeConfig
      
      try {
        const success = await initMediaPipe(config)
        if (success) {
          sendMessage('INIT_COMPLETE', { 
            isInitialized: true,
            config: state.config
          })
        } else {
          sendMessage('ERROR', null, 'Failed to initialize MediaPipe')
        }
      } catch (error: any) {
        sendMessage('ERROR', null, error?.message || 'Initialization failed')
      }
      break
    }
    
    case 'PROCESS_FRAME': {
      if (!state.isInitialized || !state.holisticModule) {
        sendMessage('ERROR', null, 'MediaPipe not initialized')
        break
      }
      
      if (state.isProcessing) {
        break
      }
      
      state.isProcessing = true
      
      try {
        const imageData = payload?.imageData as ImageData
        
        if (!imageData) {
          sendMessage('ERROR', null, 'No image data provided')
          state.isProcessing = false
          break
        }
        
        const results = await state.holisticModule.send({ image: imageData })
        const processedFrame = processHolisticResults(results)
        
        sendMessage('FRAME_PROCESSED', { frame: processedFrame })
      } catch (error: any) {
        sendMessage('ERROR', null, error?.message || 'Frame processing failed')
      } finally {
        state.isProcessing = false
      }
      break
    }
    
    case 'STOP': {
      if (state.holisticModule) {
        try {
          await state.holisticModule.close()
        } catch (e) {
          console.error('Error closing MediaPipe:', e)
        }
        state.holisticModule = null
      }
      state.isInitialized = false
      state.isProcessing = false
      state.frameIndex = 0
      sendMessage('STOPPED')
      break
    }
    
    default:
      console.warn('Unknown message type:', type)
  }
}

ctx.onerror = (error) => {
  console.error('Landmark worker error:', error)
  sendMessage('ERROR', null, error.message)
}
