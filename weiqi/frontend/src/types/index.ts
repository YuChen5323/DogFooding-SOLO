export type StoneColor = 'black' | 'white'

export interface Position {
  row: number
  col: number
}

export interface Move {
  id: string
  position: Position
  color: StoneColor
  moveNumber: number
  isPass?: boolean
  isResign?: boolean
}

export interface MoveNode {
  id: string
  move: Move
  parentId: string | null
  children: MoveNode[]
  comment?: string
  analysis?: MoveAnalysis
}

export interface MoveAnalysis {
  winRate: number
  scoreLead: number
  scoreStdev: number
  visits: number
  isGood?: boolean
  isBad?: boolean
  isDoubtful?: boolean
  comment?: string
}

export interface AIRecommendation {
  position: Position
  winRate: number
  scoreLead: number
  visits: number
  order: number
  isPass?: boolean
}

export interface GameState {
  boardSize: number
  board: (StoneColor | null)[][]
  moveHistory: Move[]
  currentMoveIndex: number
  koPosition: Position | null
  blackCaptures: number
  whiteCaptures: number
  isGameOver: boolean
  winner: StoneColor | null
}

export interface Joseki {
  id: string
  name: string
  category: string
  subcategory?: string
  description: string
  startingPosition: string
  moveTree: MoveNode
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

export interface JosekiCategory {
  id: string
  name: string
  description: string
  subcategories?: { id: string; name: string }[]
}

export interface GameRecord {
  id: string
  players: {
    black: string
    white: string
  }
  moves: Move[]
  result: string
  date: string
  boardSize: number
  analysis?: GameAnalysis
}

export interface GameAnalysis {
  moveAnalyses: { [moveNumber: number]: MoveAnalysis }
  winRateHistory: { moveNumber: number; winRate: number; color: StoneColor }[]
  badMoves: number[]
  doubtfulMoves: number[]
  goodMoves: number[]
}

export type GameMode = 'free' | 'joseki-training' | 'review'

export interface JosekiTrainingState {
  currentJoseki: Joseki | null
  currentNode: MoveNode | null
  isPlaying: boolean
  autoplaySpeed: number
  showHints: boolean
  randomVariations: boolean
  completed: boolean
  score: number
}
