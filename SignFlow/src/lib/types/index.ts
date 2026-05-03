export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
  presence?: number
}

export interface HandLandmarks {
  left: Landmark[] | null
  right: Landmark[] | null
}

export interface PoseLandmarks {
  landmarks: Landmark[]
  worldLandmarks: Landmark[]
}

export interface FaceLandmarks {
  landmarks: Landmark[]
}

export interface HolisticResults {
  poseLandmarks?: PoseLandmarks
  poseWorldLandmarks?: Landmark[]
  leftHandLandmarks?: Landmark[]
  rightHandLandmarks?: Landmark[]
  faceLandmarks?: Landmark[]
  handedness?: Array<{ index: number; score: number; label: string }>
  timestamp?: number
}

export interface ProcessedFrame {
  timestamp: number
  frameIndex: number
  leftHand: number[] | null
  rightHand: number[] | null
  pose: number[] | null
  face: number[] | null
  normalizedLandmarks: number[]
}

export interface PredictionResult {
  label: string
  confidence: number
  topK: Array<{ label: string; confidence: number }>
  isFinal: boolean
  timestamp: number
}

export interface SignWord {
  id: string
  word: string
  pinyin: string
  description: string
  category: string
  videoUrl?: string
  videoBlob?: string
  thumbnail?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  landmarks?: {
    leftHand: number[]
    rightHand: number[]
    pose: number[]
  }[]
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface PracticeProgress {
  wordId: string
  word: string
  streak: number
  correctCount: number
  incorrectCount: number
  lastPractice: number
  nextReview: number
  interval: number
  easeFactor: number
  performanceHistory: Array<{
    timestamp: number
    correct: boolean
    confidence: number
    feedback: string
  }>
}

export interface FeedbackItem {
  jointName: string
  currentAngle: number
  targetAngle: number
  deviation: number
  isCorrect: boolean
  feedback: string
}

export interface RealTimeFeedback {
  overallScore: number
  isCorrect: boolean
  feedback: string[]
  jointFeedbacks: FeedbackItem[]
  confidence: number
}

export interface AccessibilitySettings {
  highContrast: boolean
  vibration: boolean
  sound: boolean
  largeText: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  colorScheme: 'warm' | 'cool' | 'custom'
}

export interface AppSettings {
  accessibility: AccessibilitySettings
  recognition: {
    confidenceThreshold: number
    frameBufferSize: number
    modelName: string
    inferenceInterval: number
  }
  practice: {
    dailyGoal: number
    reviewInterval: number
    maxWordsPerSession: number
  }
}

export type WorkerMessageType = 
  | 'INIT' 
  | 'INIT_COMPLETE' 
  | 'PROCESS_FRAME' 
  | 'FRAME_PROCESSED' 
  | 'RECOGNIZE' 
  | 'PREDICTION' 
  | 'ERROR'
  | 'STOP'
  | 'STOPPED'

export interface WorkerMessage {
  type: WorkerMessageType
  payload?: any
  error?: string
}

export interface MediaPipeConfig {
  modelComplexity: 0 | 1 | 2
  smoothLandmarks: boolean
  minDetectionConfidence: number
  minTrackingConfidence: number
  enableSegmentation: boolean
  smoothSegmentation: boolean
  refineFaceLandmarks: boolean
}

export interface HandJoint {
  name: string
  index: number
  parentIndex: number | null
}

export const HAND_JOINTS: HandJoint[] = [
  { name: 'wrist', index: 0, parentIndex: null },
  { name: 'thumb_cmc', index: 1, parentIndex: 0 },
  { name: 'thumb_mcp', index: 2, parentIndex: 1 },
  { name: 'thumb_ip', index: 3, parentIndex: 2 },
  { name: 'thumb_tip', index: 4, parentIndex: 3 },
  { name: 'index_mcp', index: 5, parentIndex: 0 },
  { name: 'index_pip', index: 6, parentIndex: 5 },
  { name: 'index_dip', index: 7, parentIndex: 6 },
  { name: 'index_tip', index: 8, parentIndex: 7 },
  { name: 'middle_mcp', index: 9, parentIndex: 0 },
  { name: 'middle_pip', index: 10, parentIndex: 9 },
  { name: 'middle_dip', index: 11, parentIndex: 10 },
  { name: 'middle_tip', index: 12, parentIndex: 11 },
  { name: 'ring_mcp', index: 13, parentIndex: 0 },
  { name: 'ring_pip', index: 14, parentIndex: 13 },
  { name: 'ring_dip', index: 15, parentIndex: 14 },
  { name: 'ring_tip', index: 16, parentIndex: 15 },
  { name: 'pinky_mcp', index: 17, parentIndex: 0 },
  { name: 'pinky_pip', index: 18, parentIndex: 17 },
  { name: 'pinky_dip', index: 19, parentIndex: 18 },
  { name: 'pinky_tip', index: 20, parentIndex: 19 },
]

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
]

export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [18, 20], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
  [27, 31], [28, 32]
]
