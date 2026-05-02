import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type GameMode = 'falling' | 'puzzle' | 'speed'
export type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver'

export interface FallingLetter {
  id: string
  letter: string
  x: number
  y: number
  speed: number
  isCorrect: boolean
}

export interface PuzzlePiece {
  id: string
  letter: string
  position: number
  currentPosition: number
  isPlaced: boolean
}

export interface GameStateType {
  mode: GameMode
  state: GameState
  currentWord: string
  currentWordIndex: number
  typedLetters: string[]
  score: number
  combo: number
  lives: number
  timeLeft: number
  totalTime: number
  fallingLetters: FallingLetter[]
  puzzlePieces: PuzzlePiece[]
  selectedPuzzlePiece: string | null
  correctWords: number
  wrongWords: number
  levelId: string | null
}

const initialState: GameStateType = {
  mode: 'falling',
  state: 'menu',
  currentWord: '',
  currentWordIndex: 0,
  typedLetters: [],
  score: 0,
  combo: 0,
  lives: 3,
  timeLeft: 0,
  totalTime: 0,
  fallingLetters: [],
  puzzlePieces: [],
  selectedPuzzlePiece: null,
  correctWords: 0,
  wrongWords: 0,
  levelId: null,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<{ mode: GameMode; levelId: string; wordList: string[] }>) => {
      state.mode = action.payload.mode
      state.levelId = action.payload.levelId
      state.state = 'playing'
      state.currentWord = action.payload.wordList[0] || ''
      state.currentWordIndex = 0
      state.typedLetters = []
      state.score = 0
      state.combo = 0
      state.lives = 3
      state.correctWords = 0
      state.wrongWords = 0
      
      if (action.payload.mode === 'speed') {
        state.totalTime = 60
        state.timeLeft = 60
      } else {
        state.totalTime = 0
        state.timeLeft = 0
      }
      
      if (action.payload.mode === 'puzzle') {
        state.puzzlePieces = state.currentWord.split('').map((letter, index) => ({
          id: `piece-${index}-${Date.now()}`,
          letter,
          position: index,
          currentPosition: Math.floor(Math.random() * state.currentWord.length),
          isPlaced: false,
        }))
      }
      
      if (action.payload.mode === 'falling') {
        state.fallingLetters = []
      }
    },
    
    pauseGame: (state) => {
      state.state = 'paused'
    },
    
    resumeGame: (state) => {
      state.state = 'playing'
    },
    
    endGame: (state, action: PayloadAction<'levelComplete' | 'gameOver'>) => {
      state.state = action.payload
    },
    
    resetGame: () => initialState,
    
    typeLetter: (state, action: PayloadAction<string>) => {
      const letter = action.payload.toLowerCase()
      const currentLetter = state.currentWord[state.typedLetters.length]?.toLowerCase()
      
      if (letter === currentLetter) {
        state.typedLetters.push(letter)
        state.combo += 1
        state.score += 10 * state.combo
        
        if (state.typedLetters.length === state.currentWord.length) {
          state.correctWords += 1
        }
      } else {
        state.combo = 0
        state.lives -= 1
        state.wrongWords += 1
        
        if (state.lives <= 0) {
          state.state = 'gameOver'
        }
      }
    },
    
    setCurrentWord: (state, action: PayloadAction<string>) => {
      state.currentWord = action.payload
      state.typedLetters = []
      
      if (state.mode === 'puzzle') {
        state.puzzlePieces = action.payload.split('').map((letter, index) => ({
          id: `piece-${index}-${Date.now()}`,
          letter,
          position: index,
          currentPosition: index,
          isPlaced: false,
        }))
        
        const shuffled = [...state.puzzlePieces]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        state.puzzlePieces = shuffled.map((piece, idx) => ({
          ...piece,
          currentPosition: idx
        }))
      }
    },
    
    nextWord: (state, action: PayloadAction<string>) => {
      state.currentWordIndex += 1
      state.currentWord = action.payload
      state.typedLetters = []
      
      if (state.mode === 'puzzle') {
        state.puzzlePieces = action.payload.split('').map((letter, index) => ({
          id: `piece-${index}-${Date.now()}`,
          letter,
          position: index,
          currentPosition: index,
          isPlaced: false,
        }))
        
        const shuffled = [...state.puzzlePieces]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        state.puzzlePieces = shuffled.map((piece, idx) => ({
          ...piece,
          currentPosition: idx
        }))
      }
    },
    
    updateTime: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload
      if (state.timeLeft <= 0 && state.mode === 'speed') {
        state.state = 'levelComplete'
      }
    },
    
    addFallingLetter: (state, action: PayloadAction<FallingLetter>) => {
      state.fallingLetters.push(action.payload)
    },
    
    removeFallingLetter: (state, action: PayloadAction<string>) => {
      state.fallingLetters = state.fallingLetters.filter(
        (letter) => letter.id !== action.payload
      )
    },
    
    updateFallingLetters: (state, action: PayloadAction<FallingLetter[]>) => {
      state.fallingLetters = action.payload
    },
    
    selectPuzzlePiece: (state, action: PayloadAction<string | null>) => {
      state.selectedPuzzlePiece = action.payload
    },
    
    swapPuzzlePieces: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload
      const pieces = [...state.puzzlePieces]
      const fromPiece = pieces.find((p) => p.currentPosition === from)
      const toPiece = pieces.find((p) => p.currentPosition === to)
      
      if (fromPiece && toPiece) {
        fromPiece.currentPosition = to
        toPiece.currentPosition = from
        state.puzzlePieces = pieces
      }
    },
    
    checkPuzzleComplete: (state) => {
      const allCorrect = state.puzzlePieces.every(
        (piece) => piece.position === piece.currentPosition
      )
      if (allCorrect) {
        state.correctWords += 1
        state.combo += 1
        state.score += 50 * state.combo
      }
    },
  },
})

export const {
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  typeLetter,
  setCurrentWord,
  nextWord,
  updateTime,
  addFallingLetter,
  removeFallingLetter,
  updateFallingLetters,
  selectPuzzlePiece,
  swapPuzzlePieces,
  checkPuzzleComplete,
} = gameSlice.actions

export default gameSlice.reducer
