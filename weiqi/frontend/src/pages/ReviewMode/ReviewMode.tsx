import React, { useEffect, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  resetGame,
  makeMove,
  setHoverPosition,
  goToMove,
  setMarkedMove,
  clearMarkedMoves,
} from '@/store/slices/gameSlice'
import { Position, GameAnalysis, MoveAnalysis } from '@/types'
import { katagoApi, gameRecordApi } from '@/services/api'
import Goban from '@/components/Goban/Goban'
import GameControls from '@/components/GameControls/GameControls'
import WinRateChart from '@/components/WinRateChart/WinRateChart'
import './ReviewMode.css'

const ReviewMode: React.FC = () => {
  const dispatch = useAppDispatch()
  const gameState = useAppSelector((state) => state.game)

  const [boardSize, setBoardSize] = useState(19)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
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
  const [inputMode, setInputMode] = useState<'manual' | 'sgf' | 'record'>('manual')
  const [sgfText, setSgfText] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(resetGame({ boardSize }))
    dispatch(clearMarkedMoves())
    setAnalysis(null)
    setWinRateHistory([])
  }, [boardSize, dispatch])

  useEffect(() => {
    if (!analysis) return

    dispatch(clearMarkedMoves())

    for (const moveNum of analysis.badMoves) {
      const move = gameState.moveHistory[moveNum]
      if (move) {
        dispatch(
          setMarkedMove({
            position: move.position,
            marker: 'triangle',
            label: '?',
          })
        )
      }
    }

    for (const moveNum of analysis.doubtfulMoves) {
      const move = gameState.moveHistory[moveNum]
      if (move) {
        dispatch(
          setMarkedMove({
            position: move.position,
            marker: 'square',
            label: '?!',
          })
        )
      }
    }

    for (const moveNum of analysis.goodMoves) {
      const move = gameState.moveHistory[moveNum]
      if (move) {
        dispatch(
          setMarkedMove({
            position: move.position,
            marker: 'circle',
            label: '!',
          })
        )
      }
    }
  }, [analysis, gameState.moveHistory, dispatch])

  const handlePositionClick = useCallback(
    (position: Position) => {
      if (isAnalyzing) return
      dispatch(makeMove({ position }))
      setAnalysis(null)
    },
    [isAnalyzing, dispatch]
  )

  const handlePositionHover = useCallback(
    (position: Position | null) => {
      dispatch(setHoverPosition(position))
    },
    [dispatch]
  )

  const handleAnalyze = async () => {
    if (gameState.moveHistory.length === 0) return

    setIsAnalyzing(true)
    try {
      const allAnalyses: { [key: number]: MoveAnalysis } = {}
      const winRates: {
        moveNumber: number
        winRate: number
        color: 'black' | 'white'
      }[] = []

      for (let i = 0; i <= gameState.moveHistory.length; i++) {
        const movesToAnalyze = gameState.moveHistory.slice(0, i)
        const currentAnalysis = await katagoApi.getAnalysis(
          boardSize,
          movesToAnalyze,
          6.5
        )

        if (i > 0) {
          const prevAnalysis = i > 1 ? await katagoApi.getAnalysis(
            boardSize,
            gameState.moveHistory.slice(0, i - 1),
            6.5
          ) : null

          const winRateChange = prevAnalysis
            ? currentAnalysis.winRate - prevAnalysis.winRate
            : 0

          const isBadMove = winRateChange < -0.1 && movesToAnalyze[i - 1]?.color === 'white'
            ? currentAnalysis.winRate > prevAnalysis!.winRate + 0.1
            : winRateChange < -0.1

          const isDoubtfulMove = !isBadMove && winRateChange < -0.05 && winRateChange >= -0.1
          const isGoodMove = winRateChange > 0.05 && movesToAnalyze[i - 1]?.color === 'white'
            ? currentAnalysis.winRate < prevAnalysis!.winRate - 0.05
            : winRateChange > 0.05

          allAnalyses[i - 1] = {
            winRate: currentAnalysis.winRate,
            scoreLead: currentAnalysis.scoreLead,
            scoreStdev: currentAnalysis.scoreStdev,
            visits: 0,
            isBadMove,
            isDoubtfulMove,
            isGoodMove,
          }
        }

        winRates.push({
          moveNumber: i,
          winRate: currentAnalysis.winRate,
          color: i % 2 === 0 ? 'black' : 'white',
        })
      }

      const badMoves = Object.entries(allAnalyses)
        .filter(([_, a]) => a.isBadMove)
        .map(([i]) => Number(i))

      const doubtfulMoves = Object.entries(allAnalyses)
        .filter(([_, a]) => a.isDoubtfulMove)
        .map(([i]) => Number(i))

      const goodMoves = Object.entries(allAnalyses)
        .filter(([_, a]) => a.isGoodMove)
        .map(([i]) => Number(i))

      const gameAnalysis: GameAnalysis = {
        moveAnalyses: allAnalyses,
        winRateHistory: winRates.map((w) => ({
          ...w,
          isBadMove: badMoves.includes(w.moveNumber),
          isDoubtfulMove: doubtfulMoves.includes(w.moveNumber),
          isGoodMove: goodMoves.includes(w.moveNumber),
        })),
        badMoves,
        doubtfulMoves,
        goodMoves,
      }

      setAnalysis(gameAnalysis)
      setWinRateHistory(
        winRates.map((w) => ({
          ...w,
          isBadMove: badMoves.includes(w.moveNumber),
          isDoubtfulMove: doubtfulMoves.includes(w.moveNumber),
          isGoodMove: goodMoves.includes(w.moveNumber),
        }))
      )
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMoveClick = (moveNumber: number) => {
    dispatch(goToMove(moveNumber))
  }

  const handleNewReview = () => {
    dispatch(resetGame({ boardSize }))
    dispatch(clearMarkedMoves())
    setAnalysis(null)
    setWinRateHistory([])
    setSgfText('')
    setSelectedRecordId(null)
  }

  const handlePass = () => {
    dispatch(makeMove({ position: { row: -1, col: -1 }, isPass: true }))
    setAnalysis(null)
  }

  const handleParseSgf = () => {
    if (!sgfText.trim()) return
    const moves = parseSimpleSgf(sgfText)
    if (moves.length > 0) {
      dispatch(resetGame({ boardSize }))
      dispatch(clearMarkedMoves())
      for (const move of moves) {
        dispatch(makeMove(move))
      }
      setAnalysis(null)
    }
  }

  const parseSimpleSgf = (sgf: string) => {
    const moves: { position: Position; color: 'black' | 'white' }[] = []
    const blackMoves = sgf.match(/;B\[(..?)\]/g) || []
    const whiteMoves = sgf.match(/;W\[(..?)\]/g) || []

    const colLetters = 'abcdefghijklmnopqrst'

    const parseMove = (match: string) => {
      const posMatch = match.match(/\[(..?)\]/)
      if (!posMatch) return null
      const pos = posMatch[1]
      if (pos === '' || pos === 'tt') return null

      const col = colLetters.indexOf(pos[0])
      const row = colLetters.indexOf(pos[1])
      if (col === -1 || row === -1) return null

      return {
        position: { row, col },
        color: match.includes('B') ? ('black' as const) : ('white' as const),
      }
    }

    const allMoves: { move: ReturnType<typeof parseMove>; order: number }[] = []

    blackMoves.forEach((m, i) => {
      const move = parseMove(m)
      if (move) {
        allMoves.push({ move, order: i * 2 })
      }
    })

    whiteMoves.forEach((m, i) => {
      const move = parseMove(m)
      if (move) {
        allMoves.push({ move, order: i * 2 + 1 })
      }
    })

    allMoves.sort((a, b) => a.order - b.order)
    return allMoves.filter((m) => m.move).map((m) => m.move!)
  }

  return (
    <div className="review-mode">
      <div className="review-header">
        <h2>AI复盘分析</h2>
        <div className="review-settings">
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
        </div>
      </div>

      <div className="input-mode-tabs">
        <button
          className={`mode-tab ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => setInputMode('manual')}
        >
          手动输入
        </button>
        <button
          className={`mode-tab ${inputMode === 'sgf' ? 'active' : ''}`}
          onClick={() => setInputMode('sgf')}
        >
          SGF导入
        </button>
        <button
          className={`mode-tab ${inputMode === 'record' ? 'active' : ''}`}
          onClick={() => setInputMode('record')}
        >
          历史对局
        </button>
      </div>

      {inputMode === 'sgf' && (
        <div className="sgf-input">
          <textarea
            value={sgfText}
            onChange={(e) => setSgfText(e.target.value)}
            placeholder="在此粘贴SGF格式的棋谱..."
            className="sgf-textarea"
          />
          <button className="parse-btn" onClick={handleParseSgf}>
            解析SGF
          </button>
        </div>
      )}

      <div className="review-content">
        <div className="board-section">
          {isAnalyzing && (
            <div className="analyzing-overlay">
              <div className="analyzing-content">
                <div className="spinner-large"></div>
                <h3>AI分析中</h3>
                <p>正在分析每一手棋的优劣...</p>
                <div className="progress-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <Goban
            boardSize={gameState.boardSize}
            board={gameState.board}
            lastMove={gameState.lastMove}
            hoverPosition={gameState.hoverPosition}
            nextToPlay={gameState.nextToPlay}
            showAIRecommendations={false}
            aiRecommendations={[]}
            markedMoves={gameState.markedMoves}
            onPositionClick={handlePositionClick}
            onPositionHover={handlePositionHover}
            interactive={!isAnalyzing}
          />

          <GameControls
            showAIButton={false}
            onPass={inputMode === 'manual' ? handlePass : undefined}
            onNewGame={handleNewReview}
            onAnalyze={handleAnalyze}
          />

          {analysis && (
            <div className="analysis-summary">
              <h4>分析结果</h4>
              <div className="summary-stats">
                <div className="stat-card bad">
                  <span className="stat-label">恶手</span>
                  <span className="stat-value">{analysis.badMoves.length}</span>
                </div>
                <div className="stat-card doubtful">
                  <span className="stat-label">疑问手</span>
                  <span className="stat-value">{analysis.doubtfulMoves.length}</span>
                </div>
                <div className="stat-card good">
                  <span className="stat-label">好手</span>
                  <span className="stat-value">{analysis.goodMoves.length}</span>
                </div>
              </div>
              <div className="legend">
                <span className="legend-item">
                  <span className="marker triangle"></span> 恶手 (胜率下降{'>'}10%)
                </span>
                <span className="legend-item">
                  <span className="marker square"></span> 疑问手 (胜率下降5-10%)
                </span>
                <span className="legend-item">
                  <span className="marker circle"></span> 好手 (胜率上升{'>'}5%)
                </span>
              </div>
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
                height={220}
              />
            </div>
          )}

          <div className="current-move-analysis">
            <h4>当前手分析</h4>
            {analysis && analysis.moveAnalyses[gameState.currentMoveIndex] ? (
              <div className="move-analysis-detail">
                <div className="analysis-item">
                  <span className="label">胜率:</span>
                  <span className="value">
                    {(analysis.moveAnalyses[gameState.currentMoveIndex].winRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="analysis-item">
                  <span className="label">目数领先:</span>
                  <span className="value">
                    {analysis.moveAnalyses[gameState.currentMoveIndex].scoreLead > 0 ? '+' : ''}
                    {analysis.moveAnalyses[gameState.currentMoveIndex].scoreLead.toFixed(1)}目
                  </span>
                </div>
                {analysis.moveAnalyses[gameState.currentMoveIndex].isBadMove && (
                  <div className="analysis-badge bad">这是一手恶手</div>
                )}
                {analysis.moveAnalyses[gameState.currentMoveIndex].isDoubtfulMove && (
                  <div className="analysis-badge doubtful">这是一手疑问手</div>
                )}
                {analysis.moveAnalyses[gameState.currentMoveIndex].isGoodMove && (
                  <div className="analysis-badge good">这是一手好手</div>
                )}
              </div>
            ) : (
              <p className="no-analysis">点击"分析"按钮开始AI分析</p>
            )}
          </div>

          <div className="tips-section">
            <h4>使用提示</h4>
            <ul className="tips-list">
              <li>在棋盘上落子重现对局</li>
              <li>或使用SGF导入功能粘贴棋谱</li>
              <li>点击"分析"按钮进行完整AI分析</li>
              <li>分析后点击胜率曲线上的点可以跳转到对应手</li>
              <li>棋盘上的标记: 三角=恶手, 方块=疑问手, 圆圈=好手</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewMode
