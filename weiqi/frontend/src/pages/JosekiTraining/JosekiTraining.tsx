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
import {
  fetchRandomJoseki,
  setIsAutoplaying,
  setAutoplaySpeed,
} from '@/store/slices/josekiSlice'
import { Position, MoveNode } from '@/types'
import Goban from '@/components/Goban/Goban'
import GameControls from '@/components/GameControls/GameControls'
import './JosekiTraining.css'

const JosekiTraining: React.FC = () => {
  const dispatch = useAppDispatch()
  const gameState = useAppSelector((state) => state.game)
  const josekiState = useAppSelector((state) => state.joseki)

  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [showHints, setShowHints] = useState(false)
  const [randomVariations, setRandomVariations] = useState(true)
  const [trainingStarted, setTrainingStarted] = useState(false)
  const [currentNode, setCurrentNode] = useState<MoveNode | null>(null)
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [score, setScore] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong' | 'info'
    message: string
  } | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)

  const startTraining = async () => {
    try {
      dispatch(resetGame({ boardSize: 19 }))
      dispatch(clearMarkedMoves())
      setFeedback(null)
      setWrongAttempts(0)
      setScore(0)
      setTotalMoves(0)
      setTrainingStarted(true)

      await dispatch(fetchRandomJoseki(difficulty)).then((action: any) => {
        if (action.payload) {
          const joseki = action.payload
          setCurrentNode(joseki.moveTree)
          setIsPlayerTurn(joseki.moveTree.move.color === 'black')
        }
      })
    } catch (error) {
      console.error('Failed to start training:', error)
      setFeedback({
        type: 'info',
        message: '使用示例定式进行训练，请先启动后端服务',
      })
      startTrainingWithSampleJoseki()
    }
  }

  const startTrainingWithSampleJoseki = () => {
    const sampleJoseki = createSampleJoseki()
    dispatch(resetGame({ boardSize: 19 }))
    dispatch(clearMarkedMoves())
    setCurrentNode(sampleJoseki.moveTree)
    setIsPlayerTurn(sampleJoseki.moveTree.move.color === 'black')
    setTrainingStarted(true)
  }

  const createSampleJoseki = () => {
    const move1: MoveNode = {
      id: '1',
      move: {
        id: 'm1',
        position: { row: 3, col: 3 },
        color: 'black',
        moveNumber: 0,
      },
      parentId: null,
      children: [],
      comment: '黑方占小目，是常见的开局定式。',
    }

    const move2: MoveNode = {
      id: '2',
      move: {
        id: 'm2',
        position: { row: 3, col: 15 },
        color: 'white',
        moveNumber: 1,
      },
      parentId: '1',
      children: [],
      comment: '白方挂角，开始定式。',
    }

    const move3a: MoveNode = {
      id: '3a',
      move: {
        id: 'm3a',
        position: { row: 5, col: 2 },
        color: 'black',
        moveNumber: 2,
      },
      parentId: '2',
      children: [],
      comment: '小飞守角，稳健的下法。',
    }

    const move3b: MoveNode = {
      id: '3b',
      move: {
        id: 'm3b',
        position: { row: 2, col: 5 },
        color: 'black',
        moveNumber: 2,
      },
      parentId: '2',
      children: [],
      comment: '一间高夹，积极的下法。',
    }

    move2.children = [move3a, move3b]
    move1.children = [move2]

    return {
      id: 'sample',
      name: '小目定式示例',
      category: 'corner',
      description: '黑方占小目，白方挂角的常见定式变化。',
      startingPosition: '',
      moveTree: move1,
      difficulty: 'beginner' as const,
      tags: ['小目', '小飞', '挂角'],
    }
  }

  useEffect(() => {
    if (!trainingStarted || !currentNode) return

    const playerColor = gameState.moveHistory.length % 2 === 0 ? 'black' : 'white'
    const isPlayer = currentNode.move.color === playerColor

    if (!isPlayer && currentNode.children.length > 0) {
      setIsPlayerTurn(false)

      const aiMoveTimeout = setTimeout(() => {
        let nextNode: MoveNode
        if (randomVariations && currentNode.children.length > 1) {
          const randomIndex = Math.floor(Math.random() * currentNode.children.length)
          nextNode = currentNode.children[randomIndex]
        } else {
          nextNode = currentNode.children[0]
        }

        dispatch(
          makeMove({
            position: nextNode.move.position,
            color: nextNode.move.color,
          })
        )
        setCurrentNode(nextNode)

        if (nextNode.children.length > 0) {
          const nextPlayerColor = nextNode.children[0].move.color
          setIsPlayerTurn(nextPlayerColor === (gameState.moveHistory.length + 1) % 2 === 0 ? 'black' : 'white')
        } else {
          setFeedback({
            type: 'correct',
            message: '定式完成！恭喜你完成了这个定式的训练。',
          })
          setTrainingStarted(false)
        }
      }, 800)

      return () => clearTimeout(aiMoveTimeout)
    } else {
      setIsPlayerTurn(true)
      setFeedback({
        type: 'info',
        message: '轮到你了！请按照定式下出正确的一手。',
      })
    }
  }, [trainingStarted, currentNode, randomVariations, gameState.moveHistory.length, dispatch])

  const handlePositionClick = useCallback(
    (position: Position) => {
      if (!trainingStarted || !currentNode || !isPlayerTurn) return

      const correctMoves = currentNode.children
      const isCorrect = correctMoves.some(
        (child) =>
          child.move.position.row === position.row &&
          child.move.position.col === position.col
      )

      if (isCorrect) {
        const correctNode = correctMoves.find(
          (child) =>
            child.move.position.row === position.row &&
            child.move.position.col === position.col
        )!

        dispatch(
          makeMove({
            position: correctNode.move.position,
            color: correctNode.move.color,
          })
        )
        setCurrentNode(correctNode)

        setScore((prev) => prev + Math.max(1, 3 - wrongAttempts))
        setTotalMoves((prev) => prev + 1)
        setWrongAttempts(0)

        if (correctNode.comment) {
          setFeedback({
            type: 'correct',
            message: `正确！${correctNode.comment}`,
          })
        } else {
          setFeedback({
            type: 'correct',
            message: '正确！继续下一手。',
          })
        }

        if (correctNode.children.length === 0) {
          setTimeout(() => {
            setFeedback({
              type: 'correct',
              message: `定式完成！得分: ${score + Math.max(1, 3 - wrongAttempts)}/${totalMoves + 1}`,
            })
            setTrainingStarted(false)
          }, 1000)
        }
      } else {
        setWrongAttempts((prev) => prev + 1)
        setFeedback({
          type: 'wrong',
          message: wrongAttempts >= 2
            ? `错误！正确的下法在 ${correctMoves.map(getPositionLabel).join(' 或 ')} 位置。`
            : '错误！请再试一次。',
        })

        if (showHints && correctMoves.length > 0) {
          correctMoves.forEach((move, index) => {
            dispatch(
              setMarkedMove({
                position: move.move.position,
                marker: 'triangle',
              })
            )
          })
        }
      }
    },
    [trainingStarted, currentNode, isPlayerTurn, wrongAttempts, showHints, score, totalMoves, dispatch]
  )

  const handlePositionHover = useCallback(
    (position: Position | null) => {
      dispatch(setHoverPosition(position))
    },
    [dispatch]
  )

  const getPositionLabel = (node: MoveNode): string => {
    const colLetters = 'ABCDEFGHJKLMNOPQRST'
    const col = colLetters[node.move.position.col]
    const row = 19 - node.move.position.row
    return `${col}${row}`
  }

  const handleNewTraining = () => {
    setTrainingStarted(false)
    setCurrentNode(null)
    setIsPlayerTurn(false)
    setFeedback(null)
    setWrongAttempts(0)
    dispatch(resetGame({ boardSize: 19 }))
    dispatch(clearMarkedMoves())
  }

  return (
    <div className="joseki-training">
      <div className="training-header">
        <h2>定式训练</h2>
        <div className="training-stats">
          {trainingStarted && (
            <>
              <div className="stat-item">
                <span className="stat-label">得分:</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">手数:</span>
                <span className="stat-value">{totalMoves}</span>
              </div>
              {totalMoves > 0 && (
                <div className="stat-item">
                  <span className="stat-label">正确率:</span>
                  <span className="stat-value">{Math.round((score / (totalMoves * 3)) * 100)}%</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!trainingStarted ? (
        <div className="training-setup">
          <div className="setup-card">
            <h3>训练设置</h3>
            <div className="setup-options">
              <div className="option-group">
                <label>难度级别:</label>
                <div className="option-buttons">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <button
                      key={level}
                      className={`option-btn ${difficulty === level ? 'active' : ''}`}
                      onClick={() => setDifficulty(level)}
                    >
                      {level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <div className="checkbox-option">
                  <input
                    type="checkbox"
                    id="showHints"
                    checked={showHints}
                    onChange={(e) => setShowHints(e.target.checked)}
                  />
                  <label htmlFor="showHints">显示提示（错误后标记正确位置）</label>
                </div>
                <div className="checkbox-option">
                  <input
                    type="checkbox"
                    id="randomVariations"
                    checked={randomVariations}
                    onChange={(e) => setRandomVariations(e.target.checked)}
                  />
                  <label htmlFor="randomVariations">随机变化（AI随机选择定式分支）</label>
                </div>
              </div>
            </div>

            <button className="start-btn" onClick={startTraining}>
              开始训练
            </button>

            {josekiState.error && (
              <div className="error-message">
                <p>{josekiState.error}</p>
                <p className="hint">将使用内置示例定式进行训练</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="training-content">
          <div className="board-section">
            {feedback && (
              <div className={`feedback ${feedback.type}`}>
                {feedback.type === 'correct' && <span className="feedback-icon">✓</span>}
                {feedback.type === 'wrong' && <span className="feedback-icon">✗</span>}
                {feedback.type === 'info' && <span className="feedback-icon">ℹ</span>}
                {feedback.message}
              </div>
            )}

            {isPlayerTurn && (
              <div className="turn-indicator-training">
                <span className="pulse-dot"></span>
                轮到你行棋
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
              interactive={isPlayerTurn}
            />

            <GameControls
              showAIButton={false}
              onNewGame={handleNewTraining}
            />
          </div>

          <div className="info-section">
            {josekiState.currentJoseki && (
              <div className="current-joseki">
                <h4>当前定式</h4>
                <div className="joseki-name">{josekiState.currentJoseki.name}</div>
                <div className="joseki-desc">{josekiState.currentJoseki.description}</div>
                <div className="joseki-tags">
                  {josekiState.currentJoseki.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="tips-section">
              <h4>训练提示</h4>
              <ul className="tips-list">
                <li>按照定式顺序落子</li>
                <li>第一次正确得3分，第二次2分，第三次1分</li>
                <li>连续错误会显示正确位置提示</li>
                <li>AI可能随机选择不同的定式变化</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JosekiTraining
