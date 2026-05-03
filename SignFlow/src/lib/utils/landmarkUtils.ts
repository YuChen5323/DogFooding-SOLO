import type { Landmark, FeedbackItem, RealTimeFeedback } from '../types'
import { HAND_JOINTS } from '../types'

export function calculateAngle(
  p1: Landmark,
  p2: Landmark,
  p3: Landmark
): number {
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z
  }
  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z
  }
  
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z)
  
  if (mag1 === 0 || mag2 === 0) return 0
  
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  const angle = Math.acos(cosAngle) * (180 / Math.PI)
  
  return angle
}

export function calculateDistance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  )
}

export function extractHandAngles(landmarks: Landmark[]): Record<string, number> {
  if (!landmarks || landmarks.length < 21) return {}
  
  const angles: Record<string, number> = {}
  
  angles['thumb_mcp'] = calculateAngle(
    landmarks[1], landmarks[2], landmarks[3]
  )
  angles['thumb_ip'] = calculateAngle(
    landmarks[2], landmarks[3], landmarks[4]
  )
  
  angles['index_mcp'] = calculateAngle(
    landmarks[0], landmarks[5], landmarks[6]
  )
  angles['index_pip'] = calculateAngle(
    landmarks[5], landmarks[6], landmarks[7]
  )
  angles['index_dip'] = calculateAngle(
    landmarks[6], landmarks[7], landmarks[8]
  )
  
  angles['middle_mcp'] = calculateAngle(
    landmarks[0], landmarks[9], landmarks[10]
  )
  angles['middle_pip'] = calculateAngle(
    landmarks[9], landmarks[10], landmarks[11]
  )
  angles['middle_dip'] = calculateAngle(
    landmarks[10], landmarks[11], landmarks[12]
  )
  
  angles['ring_mcp'] = calculateAngle(
    landmarks[0], landmarks[13], landmarks[14]
  )
  angles['ring_pip'] = calculateAngle(
    landmarks[13], landmarks[14], landmarks[15]
  )
  angles['ring_dip'] = calculateAngle(
    landmarks[14], landmarks[15], landmarks[16]
  )
  
  angles['pinky_mcp'] = calculateAngle(
    landmarks[0], landmarks[17], landmarks[18]
  )
  angles['pinky_pip'] = calculateAngle(
    landmarks[17], landmarks[18], landmarks[19]
  )
  angles['pinky_dip'] = calculateAngle(
    landmarks[18], landmarks[19], landmarks[20]
  )
  
  return angles
}

export function compareHandAngles(
  current: Landmark[],
  target: Landmark[],
  threshold: number = 15
): FeedbackItem[] {
  const currentAngles = extractHandAngles(current)
  const targetAngles = extractHandAngles(target)
  
  const feedbacks: FeedbackItem[] = []
  
  for (const [jointName, currentAngle] of Object.entries(currentAngles)) {
    const targetAngle = targetAngles[jointName] || currentAngle
    const deviation = Math.abs(currentAngle - targetAngle)
    const isCorrect = deviation <= threshold
    
    const jointDisplayNames: Record<string, string> = {
      thumb_mcp: '拇指掌指关节',
      thumb_ip: '拇指指间关节',
      index_mcp: '食指掌指关节',
      index_pip: '食指近端指间关节',
      index_dip: '食指远端指间关节',
      middle_mcp: '中指掌指关节',
      middle_pip: '中指近端指间关节',
      middle_dip: '中指远端指间关节',
      ring_mcp: '无名指掌指关节',
      ring_pip: '无名指近端指间关节',
      ring_dip: '无名指远端指间关节',
      pinky_mcp: '小指掌指关节',
      pinky_pip: '小指近端指间关节',
      pinky_dip: '小指远端指间关节'
    }
    
    const displayName = jointDisplayNames[jointName] || jointName
    
    let feedback = ''
    if (isCorrect) {
      feedback = `${displayName}位置正确`
    } else if (currentAngle < targetAngle) {
      feedback = `${displayName}需要更大角度，请伸展手指`
    } else {
      feedback = `${displayName}角度过大，请弯曲手指`
    }
    
    feedbacks.push({
      jointName: displayName,
      currentAngle: Math.round(currentAngle),
      targetAngle: Math.round(targetAngle),
      deviation: Math.round(deviation),
      isCorrect,
      feedback
    })
  }
  
  return feedbacks
}

export function evaluatePose(
  currentLeft: Landmark[] | null,
  currentRight: Landmark[] | null,
  targetLeft: Landmark[] | null,
  targetRight: Landmark[] | null,
  threshold: number = 15
): RealTimeFeedback {
  const allFeedbacks: FeedbackItem[] = []
  let totalScore = 0
  let jointCount = 0
  
  if (currentLeft && targetLeft) {
    const leftFeedbacks = compareHandAngles(currentLeft, targetLeft, threshold)
    allFeedbacks.push(...leftFeedbacks.map(f => ({ ...f, jointName: `左手${f.jointName}` })))
  }
  
  if (currentRight && targetRight) {
    const rightFeedbacks = compareHandAngles(currentRight, targetRight, threshold)
    allFeedbacks.push(...rightFeedbacks.map(f => ({ ...f, jointName: `右手${f.jointName}` })))
  }
  
  if (allFeedbacks.length === 0) {
    return {
      overallScore: 0,
      isCorrect: false,
      feedback: ['未检测到双手，请将手放入画面中'],
      jointFeedbacks: [],
      confidence: 0
    }
  }
  
  let correctCount = 0
  const errorFeedbacks: string[] = []
  
  for (const fb of allFeedbacks) {
    if (fb.isCorrect) {
      correctCount++
      totalScore += 100
    } else {
      totalScore += Math.max(0, 100 - (fb.deviation * 2))
      errorFeedbacks.push(fb.feedback)
    }
    jointCount++
  }
  
  const overallScore = Math.round(totalScore / jointCount)
  const isCorrect = overallScore >= 80
  
  const feedbacks = isCorrect
    ? ['手势标准，做得很好！']
    : errorFeedbacks.slice(0, 3)
  
  return {
    overallScore,
    isCorrect,
    feedback: feedbacks,
    jointFeedbacks: allFeedbacks,
    confidence: Math.max(0.5, overallScore / 100)
  }
}

export function flattenLandmarksToArray(landmarks: Landmark[] | null | undefined): number[] {
  if (!landmarks) return []
  const result: number[] = []
  for (const lm of landmarks) {
    result.push(lm.x, lm.y, lm.z)
  }
  return result
}

export function arrayToLandmarks(arr: number[]): Landmark[] {
  const landmarks: Landmark[] = []
  for (let i = 0; i < arr.length; i += 3) {
    landmarks.push({
      x: arr[i],
      y: arr[i + 1] || 0,
      z: arr[i + 2] || 0
    })
  }
  return landmarks
}

export function isHandVisible(landmarks: Landmark[] | null, confidenceThreshold: number = 0.5): boolean {
  if (!landmarks || landmarks.length === 0) return false
  
  let visibleCount = 0
  for (const lm of landmarks) {
    if (lm.visibility === undefined || lm.visibility > confidenceThreshold) {
      visibleCount++
    }
  }
  
  return visibleCount > landmarks.length * 0.5
}
