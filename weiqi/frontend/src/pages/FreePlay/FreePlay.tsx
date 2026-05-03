import React, { useEffect, useCallback, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  resetGame,
  makeMove,
  setHoverPosition,
  setAIRecommendations,
  setShowAIRecommendations,
  setCurrentWinRate,
  goToMove,
  setMarkedMove,
  clearMarkedMoves,
} from '@/store/slices/gameSlice'
import { Position } from '@/types'
import { katagoApi } from '@/services/api'
import Goban from '@/components/Goban/Goban'
import GameControls from '@/components/GameControls/GameControls'
import WinRateChart from '@/components/WinRateChart/WinRateChart'
import './FreePlay.css'

const FreePlay: React.FC = () => {
  const dispatch = useAppDispatch()
  const gameState = useAppSelector((state) => state.game)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [winRateHistory, setWinRateHistory] = useState<
    {
      moveNumber: number
      winRate: number
      color: 'black' | 'white'
      isBadMove?: boolean
      isDoubtfulMove?: boolean
      isGoodMove?: boolean
    }[]
  >([])
  const [boardSize, setBoardSize] = useState(19)
  const [playerColor, setPlayerColor] = useState<'black' | 'white' | 'both'>('both')
  const [isAITurn, setIsAITurn] = useState(false)

  useEffect(() => {
    dispatch(resetGame({ boardSize }))
    dispatch(clearMarkedMoves())
    setWinRateHistory([])
  }, [boardSize, dispatch])

  useEffect(() => {
    if (playerColor !== 'both' && !gameState.isGameOver) {
      const aiColor = playerColor === 'black' ? 'white' : 'black'
      if (gameState.nextToPlay === aiColor) {
        setIsAITurn(true)
      }
    }
  }, [gameState.nextToPlay, gameState.isGameOver, playerColor])

  useEffect(() => {
    if (!isAITurn) return

    const requestAIMove = async () => {
      try {
        const aiColor = playerColor === 'black' ? 'white' : 'black'
        const move = await katagoApi.getNextMove(
          boardSize,
          gameState.moveHistory.slice(0, gameState.currentMoveIndex + 1),
          6.5
        )

        if (move.isPass) {
          dispatch(makeMove({ position: { row: -1, col: -1 }, color: aiColor, isPass: true }))
        } else {
          dispatch(makeMove({ position: move.position, color: aiColor }))
        }

        if (gameState.showAIRecommendations) {
          const analysis = await katagoApi.getAnalysis(
            boardSize,
            gameState.moveHistory.slice(0, gameState.currentMoveIndex + 2),
            6.5
          )
          dispatch(setAIRecommendations(analysis.moves.slice(0, 5)))
          dispatch(setCurrentWinRate(analysis.winRate))

          setWinRateHistory((prev) => [
            ...prev,
            {
              moveNumber: gameState.moveHistory.length,
              winRate: analysis.winRate,
              color: aiColor,
            },
          ])
        }
      } catch (error) {
        console.error('AI move error:', error)
      } finally {
        setIsAITurn(false)
      }
    }

    const timer = setTimeout(requestAIMove, 500)
    return () => clearTimeout(timer)
  }, [isAITurn, playerColor, boardSize, gameState.moveHistory, gameState.currentMoveIndex, gameState.showAIRecommendations, dispatch])

  const handlePositionClick = useCallback(
    (position: Position) => {
      if (isAITurn) return
      if (playerColor !== 'both' && gameState.nextToPlay !== playerColor) {
        return
      }

      dispatch(makeMove({ position }))
    },
    [isAITurn, playerColor, gameState.nextToPlay, dispatch]
  )

  const handlePositionHover = useCallback(
    (position: Position | null) => {
      dispatch(setHoverPosition(position))
    },
    [dispatch]
  )

  const handlePass = () => {
    if (isAITurn) return
    dispatch(makeMove({ position: { row: -1, col: -1 }, isPass: true }))
  }

  const handleResign = () => {
    if (isAITurn) return
    dispatch(makeMove({ position: { row: -1, col: -1 }, isResign: true }))
  }

  const handleNewGame = () => {
    dispatch(resetGame({ boardSize }))
    dispatch(clearMarkedMoves())
    setWinRateHistory([])
    setIsAITurn(false)
  }

  const handleAnalyze = async () => {
    if (gameState.moveHistory.length === 0) return

    setIsAnalyzing(true)
    try {
      const analysis = await katagoApi.getAnalysis(
        boardSize,
        gameState.moveHistory,
        6.5
      )

      dispatch(setAIRecommendations(analysis.moves.slice(0, 5)))
      dispatch(setCurrentWinRate(analysis.winRate))
      dispatch(setShowAIRecommendations(true))

      setWinRateHistory((prev) => [
        ...prev,
        {
          moveNumber: gameState.currentMoveIndex,
          winRate: analysis.winRate,
          color: gameState.nextToPlay === 'black' ? 'white' : 'black',
        },
      ])
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMoveClick = (moveNumber: number) => {
    dispatch(goToMove(moveNumber))
  }

  return (
    <div className="free-play">
      <div className="play-header">
        <h2>自由对弈</h2>
        <div className="play-settings">
          <div className="setting-group">
            <label>棋盘大小:</label>
            <select
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="setting-select"
            >
              <option value={9}>9路</option>
              <option value={13}>13路</option>
              <option value={19}>19路</option>
            </select>
          </div>
          <div className="setting-group">
            <label>执子:</label>
            <select
              value={playerColor}
              onChange={(e) => setPlayerColor(e.target.value as 'black' | 'white' | 'both')}
              className="setting-select"
            >
              <option value="both">双人对弈</option>
              <option value="black">执黑(AI执白)</option>
              <option value="white">执白(AI执黑)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="play-content">
        <div className="board-section">
          {isAITurn && (
            <div className="ai-thinking">
              <span className="thinking-dot"></span>
              AI思考中...
            </div>
          )}

          <Goban
            boardSize={gameState.boardSize}
            board={gameState.board}
            lastMove={gameState.lastMove}
            hoverPosition={gameState.hoverPosition}
            nextToPlay={gameState.nextToPlay}
            showAIRecommendations={gameState.showAIRecommendations}
            aiRecommendations={gameState.aiRecommendations}
            markedMoves={gameState.markedMoves}
            onPositionClick={handlePositionClick}
            onPositionHover={handlePositionHover}
            interactive={!isAITurn}
          />

          <GameControls
            showAIButton={true}
            onPass={handlePass}
            onResign={handleResign}
            onNewGame={handleNewGame}
            onAnalyze={handleAnalyze}
          />

          {gameState.isGameOver && (
            <div className="game-over">
              <h3>游戏结束</h3>
              <p>
                {gameState.winner === 'black' ? '黑方' : '白方'}获胜！
              </p>
            </div>
          )}
        </div>

        <div className="info-section">
          {winRateHistory.length > 0 && (
            <div className="win-rate-section">
              <WinRateChart
                data={winRateHistory}
                currentMoveIndex={gameState.currentMoveIndex}
                onMoveClick={handleMoveClick}
                height={200}
              />
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-status">
              <div className="spinner"></div>
              <span>AI分析中...</span>
            </div>
          )}

          {gameState.currentWinRate !== null && (
            <div className="current-rate">
              <h4>当前胜率</h4>
              <div className="rate-display">
                <div className="rate-bar">
                  <div
                    className="rate-fill black"
                    style={{ width: `${gameState.currentWinRate * 100}%` }}
                  />
                  <div
                    className="rate-fill white"
                    style={{ width: `${(1 - gameState.currentWinRate) * 100}%` }}
                  />
                </div>
                <div className="rate-labels">
                  <span className="black-rate">
                    黑: {(gameState.currentWinRate * 100).toFixed(1)}%
                  </span>
                  <span className="white-rate">
                    白: {((1 - gameState.currentWinRate) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="move-history-section">
            <h4>对局记录</h4>
            <div className="move-history-scroll">
              {gameState.moveHistory.length === 0 ? (
                <p className="no-moves">暂无落子</p>
              ) : (
                <div className="move-list">
                  {gameState.moveHistory.map((move, index) => (
                    <div
                      key={move.id}
                      className={`move-item ${gameState.currentMoveIndex === index ? 'current' : ''}`}
                      onClick={() => dispatch(goToMove(index))}
                    >
                      <span className={`move-color ${move.color}`}>
                        {move.color === 'black' ? '●' : '○'}
                      </span>
                      <span className="move-num">{index + 1}.</span>
                      <span className="move-pos">
                        {move.isPass
                          ? '停一手'
                          : move.isResign
                          ? '认输'
                          : getPositionLabel(move.position, gameState.boardSize)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPositionLabel(pos: Position, boardSize: number): string {
  const colLetters = 'ABCDEFGHJKLMNOPQRST'
  const col = colLetters[pos.col]
  const row = boardSize - pos.row
  return `${col}${row}`
}

export default FreePlay
