import React from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  goToStart,
  goToPreviousMove,
  goToNextMove,
  goToEnd,
  setShowAIRecommendations,
} from '@/store/slices/gameSlice'
import './GameControls.css'

interface GameControlsProps {
  showAIButton?: boolean
  onPass?: () => void
  onResign?: () => void
  onNewGame?: () => void
  onAnalyze?: () => void
  onSave?: () => void
}

const GameControls: React.FC<GameControlsProps> = ({
  showAIButton = true,
  onPass,
  onResign,
  onNewGame,
  onAnalyze,
  onSave,
}) => {
  const dispatch = useAppDispatch()
  const { currentMoveIndex, moveHistory, showAIRecommendations, nextToPlay, blackCaptures, whiteCaptures } =
    useAppSelector((state) => state.game)

  const canGoBack = currentMoveIndex > -1
  const canGoForward = currentMoveIndex < moveHistory.length - 1

  return (
    <div className="game-controls">
      <div className="controls-row">
        <div className="navigation-buttons">
          <button
            className="control-btn"
            onClick={() => dispatch(goToStart())}
            disabled={!canGoBack}
            title="到开始"
          >
            <span className="icon">⏮</span>
          </button>
          <button
            className="control-btn"
            onClick={() => dispatch(goToPreviousMove())}
            disabled={!canGoBack}
            title="上一步"
          >
            <span className="icon">◀</span>
          </button>
          <span className="move-counter">
            {currentMoveIndex + 1} / {moveHistory.length}
          </span>
          <button
            className="control-btn"
            onClick={() => dispatch(goToNextMove())}
            disabled={!canGoForward}
            title="下一步"
          >
            <span className="icon">▶</span>
          </button>
          <button
            className="control-btn"
            onClick={() => dispatch(goToEnd())}
            disabled={!canGoForward}
            title="到结束"
          >
            <span className="icon">⏭</span>
          </button>
        </div>
      </div>

      <div className="controls-row">
        <div className="game-info">
          <div className="turn-indicator">
            <span className={`stone-dot ${nextToPlay}`} />
            <span>{nextToPlay === 'black' ? '黑方' : '白方'}行棋</span>
          </div>
          <div className="captures">
            <span className="capture-info">
              <span className="stone-dot black" />
              提子: {blackCaptures}
            </span>
            <span className="capture-info">
              <span className="stone-dot white" />
              提子: {whiteCaptures}
            </span>
          </div>
        </div>
      </div>

      <div className="controls-row">
        <div className="action-buttons">
          {showAIButton && (
            <button
              className={`control-btn ${showAIRecommendations ? 'active' : ''}`}
              onClick={() => dispatch(setShowAIRecommendations(!showAIRecommendations))}
              title={showAIRecommendations ? '隐藏AI推荐' : '显示AI推荐'}
            >
              🤖 AI提示
            </button>
          )}
          {onAnalyze && (
            <button className="control-btn" onClick={onAnalyze} title="AI分析">
              📊 分析
            </button>
          )}
          {onPass && (
            <button className="control-btn" onClick={onPass} title="虚着(停一手)">
              ⏸ 停一手
            </button>
          )}
          {onResign && (
            <button className="control-btn danger" onClick={onResign} title="认输">
              🏳 认输
            </button>
          )}
          {onNewGame && (
            <button className="control-btn primary" onClick={onNewGame} title="新对局">
              🔄 新局
            </button>
          )}
          {onSave && (
            <button className="control-btn" onClick={onSave} title="保存对局">
              💾 保存
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameControls
