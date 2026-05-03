import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GameState, Move, StoneColor, Position, MoveNode, AIRecommendation, Joseki } from '@/types'
import { createEmptyBoard, playMove, cloneBoard } from '@/utils/goRules'
import { v4 as uuidv4 } from 'uuid'

interface GameSliceState extends GameState {
  nextToPlay: StoneColor
  showAIRecommendations: boolean
  aiRecommendations: AIRecommendation[]
  currentWinRate: number | null
  hoverPosition: Position | null
  lastMove: Move | null
  markedMoves: { [key: string]: { marker: string; label?: string } }
}

const initialState: GameSliceState = {
  boardSize: 19,
  board: createEmptyBoard(19),
  moveHistory: [],
  currentMoveIndex: -1,
  koPosition: null,
  blackCaptures: 0,
  whiteCaptures: 0,
  isGameOver: false,
  winner: null,
  nextToPlay: 'black',
  showAIRecommendations: false,
  aiRecommendations: [],
  currentWinRate: null,
  hoverPosition: null,
  lastMove: null,
  markedMoves: {},
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame: (state, action: PayloadAction<{ boardSize?: number }>) => {
      const boardSize = action.payload.boardSize || 19
      state.boardSize = boardSize
      state.board = createEmptyBoard(boardSize)
      state.moveHistory = []
      state.currentMoveIndex = -1
      state.koPosition = null
      state.blackCaptures = 0
      state.whiteCaptures = 0
      state.isGameOver = false
      state.winner = null
      state.nextToPlay = 'black'
      state.showAIRecommendations = false
      state.aiRecommendations = []
      state.currentWinRate = null
      state.hoverPosition = null
      state.lastMove = null
      state.markedMoves = {}
    },

    setBoardSize: (state, action: PayloadAction<number>) => {
      const boardSize = action.payload
      state.boardSize = boardSize
      state.board = createEmptyBoard(boardSize)
      state.moveHistory = []
      state.currentMoveIndex = -1
      state.koPosition = null
      state.blackCaptures = 0
      state.whiteCaptures = 0
      state.nextToPlay = 'black'
      state.lastMove = null
    },

    makeMove: (state, action: PayloadAction<{ position: Position; color?: StoneColor; isPass?: boolean; isResign?: boolean }>) => {
      const { position, color, isPass, isResign } = action.payload
      const moveColor = color || state.nextToPlay
      const moveNumber = state.currentMoveIndex + 1

      if (isResign) {
        state.isGameOver = true
        state.winner = moveColor === 'black' ? 'white' : 'black'
        const move: Move = {
          id: uuidv4(),
          position: { row: -1, col: -1 },
          color: moveColor,
          moveNumber,
          isResign: true,
        }
        state.moveHistory = state.moveHistory.slice(0, state.currentMoveIndex + 1)
        state.moveHistory.push(move)
        state.currentMoveIndex = state.moveHistory.length - 1
        state.lastMove = move
        return
      }

      if (isPass) {
        const move: Move = {
          id: uuidv4(),
          position: { row: -1, col: -1 },
          color: moveColor,
          moveNumber,
          isPass: true,
        }
        state.moveHistory = state.moveHistory.slice(0, state.currentMoveIndex + 1)
        state.moveHistory.push(move)
        state.currentMoveIndex = state.moveHistory.length - 1
        state.lastMove = move
        state.nextToPlay = moveColor === 'black' ? 'white' : 'black'
        return
      }

      const result = playMove(
        state.board,
        position.row,
        position.col,
        moveColor,
        state.koPosition
      )

      if (!result.isValid) {
        return
      }

      const move: Move = {
        id: uuidv4(),
        position,
        color: moveColor,
        moveNumber,
      }

      state.moveHistory = state.moveHistory.slice(0, state.currentMoveIndex + 1)
      state.moveHistory.push(move)
      state.currentMoveIndex = state.moveHistory.length - 1

      state.board = result.newBoard
      state.koPosition = result.newKoPosition
      state.lastMove = move

      if (moveColor === 'black') {
        state.blackCaptures += result.captures
      } else {
        state.whiteCaptures += result.captures
      }

      state.nextToPlay = moveColor === 'black' ? 'white' : 'black'
    },

    goToMove: (state, action: PayloadAction<number>) => {
      const targetIndex = action.payload
      if (targetIndex < -1 || targetIndex >= state.moveHistory.length) {
        return
      }

      let currentBoard = createEmptyBoard(state.boardSize)
      let currentKoPosition: Position | null = null
      let blackCaptures = 0
      let whiteCaptures = 0
      let lastMove: Move | null = null

      for (let i = 0; i <= targetIndex; i++) {
        const move = state.moveHistory[i]
        if (move.isPass || move.isResign) {
          lastMove = move
          continue
        }

        const result = playMove(
          currentBoard,
          move.position.row,
          move.position.col,
          move.color,
          currentKoPosition
        )

        if (result.isValid) {
          currentBoard = result.newBoard
          currentKoPosition = result.newKoPosition
          if (move.color === 'black') {
            blackCaptures += result.captures
          } else {
            whiteCaptures += result.captures
          }
          lastMove = move
        }
      }

      state.board = currentBoard
      state.currentMoveIndex = targetIndex
      state.koPosition = currentKoPosition
      state.blackCaptures = blackCaptures
      state.whiteCaptures = whiteCaptures
      state.lastMove = lastMove
      state.nextToPlay = targetIndex % 2 === 0 ? 'white' : 'black'
    },

    goToPreviousMove: (state) => {
      if (state.currentMoveIndex > -1) {
        gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: state.currentMoveIndex - 1 })
      }
    },

    goToNextMove: (state) => {
      if (state.currentMoveIndex < state.moveHistory.length - 1) {
        gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: state.currentMoveIndex + 1 })
      }
    },

    goToStart: (state) => {
      gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: -1 })
    },

    goToEnd: (state) => {
      gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: state.moveHistory.length - 1 })
    },

    undoMove: (state) => {
      if (state.currentMoveIndex >= 0) {
        gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: state.currentMoveIndex - 1 })
      }
    },

    setShowAIRecommendations: (state, action: PayloadAction<boolean>) => {
      state.showAIRecommendations = action.payload
    },

    setAIRecommendations: (state, action: PayloadAction<AIRecommendation[]>) => {
      state.aiRecommendations = action.payload
    },

    setCurrentWinRate: (state, action: PayloadAction<number | null>) => {
      state.currentWinRate = action.payload
    },

    setHoverPosition: (state, action: PayloadAction<Position | null>) => {
      state.hoverPosition = action.payload
    },

    setMarkedMove: (state, action: PayloadAction<{ position: Position; marker: string; label?: string }>) => {
      const { position, marker, label } = action.payload
      state.markedMoves[`${position.row},${position.col}`] = { marker, label }
    },

    clearMarkedMoves: (state) => {
      state.markedMoves = {}
    },

    loadFromMoveTree: (state, action: PayloadAction<{ moveTree: MoveNode; boardSize: number }>) => {
      const { moveTree, boardSize } = action.payload
      state.boardSize = boardSize
      state.board = createEmptyBoard(boardSize)
      state.moveHistory = []
      state.currentMoveIndex = -1
      state.koPosition = null
      state.blackCaptures = 0
      state.whiteCaptures = 0
      state.nextToPlay = 'black'
      state.lastMove = null

      let currentNode: MoveNode | null = moveTree
      while (currentNode) {
        const move: Move = {
          id: currentNode.move.id,
          position: currentNode.move.position,
          color: currentNode.move.color,
          moveNumber: currentNode.move.moveNumber,
          isPass: currentNode.move.isPass,
          isResign: currentNode.move.isResign,
        }
        state.moveHistory.push(move)
        currentNode = currentNode.children[0] || null
      }

      if (state.moveHistory.length > 0) {
        state.currentMoveIndex = state.moveHistory.length - 1
        gameSlice.caseReducers.goToMove(state, { type: 'goToMove', payload: state.currentMoveIndex })
      }
    },
  },
})

export const {
  resetGame,
  setBoardSize,
  makeMove,
  goToMove,
  goToPreviousMove,
  goToNextMove,
  goToStart,
  goToEnd,
  undoMove,
  setShowAIRecommendations,
  setAIRecommendations,
  setCurrentWinRate,
  setHoverPosition,
  setMarkedMove,
  clearMarkedMoves,
  loadFromMoveTree,
} = gameSlice.actions

export default gameSlice.reducer
