import React, { useEffect, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  fetchCategories,
  fetchJosekiByCategory,
  searchJoseki,
  selectJoseki,
  setCurrentMoveNode,
  setIsAutoplaying,
  setAutoplaySpeed,
  goToChildNode,
  goToParentNode,
  setSelectedCategory,
  setSearchQuery,
} from '@/store/slices/josekiSlice'
import {
  resetGame,
  makeMove,
  goToMove as goToGameMove,
  setHoverPosition,
} from '@/store/slices/gameSlice'
import { Position, MoveNode } from '@/types'
import Goban from '@/components/Goban/Goban'
import GameControls from '@/components/GameControls/GameControls'
import MoveTree from '@/components/MoveTree/MoveTree'
import './JosekiLibrary.css'

const JosekiLibrary: React.FC = () => {
  const dispatch = useAppDispatch()
  const {
    categories,
    josekiList,
    currentJoseki,
    currentMoveNode,
    autoplaySpeed,
    isAutoplaying,
    searchQuery,
    selectedCategory,
    loading,
  } = useAppSelector((state) => state.joseki)

  const gameState = useAppSelector((state) => state.game)
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (selectedCategory) {
      dispatch(fetchJosekiByCategory(selectedCategory))
    }
  }, [dispatch, selectedCategory])

  const handleCategorySelect = (categoryId: string) => {
    dispatch(setSelectedCategory(categoryId))
  }

  const handleSearch = () => {
    if (localSearchQuery.trim()) {
      dispatch(setSearchQuery(localSearchQuery))
      dispatch(searchJoseki(localSearchQuery))
    }
  }

  const handleJosekiSelect = (joseki: typeof josekiList[0]) => {
    dispatch(selectJoseki(joseki))
    dispatch(resetGame({ boardSize: 19 }))
  }

  const handlePositionClick = (position: Position) => {
    if (!currentMoveNode) return
    const matchingChild = currentMoveNode.children.find(
      (child) =>
        child.move.position.row === position.row &&
        child.move.position.col === position.col
    )
    if (matchingChild) {
      dispatch(setCurrentMoveNode(matchingChild))
      dispatch(
        makeMove({
          position: matchingChild.move.position,
          color: matchingChild.move.color,
        })
      )
    }
  }

  const handlePositionHover = (position: Position | null) => {
    dispatch(setHoverPosition(position))
  }

  const handleNodeSelect = (node: MoveNode) => {
    dispatch(setCurrentMoveNode(node))
    const moves: { position: Position; color: string }[] = []
    let current: MoveNode | null = node
    while (current) {
      moves.unshift({
        position: current.move.position,
        color: current.move.color,
      })
      if (current.parentId) {
        current = findParentNode(currentJoseki?.moveTree || null, current.id)
      } else {
        current = null
      }
    }
    dispatch(resetGame({ boardSize: 19 }))
    moves.forEach((move) => {
      dispatch(makeMove(move))
    })
  }

  const findParentNode = (
    tree: MoveNode | null,
    targetId: string
  ): MoveNode | null => {
    if (!tree) return null
    for (const child of tree.children) {
      if (child.id === targetId) return tree
      const found = findParentNode(child, targetId)
      if (found) return found
    }
    return null
  }

  useEffect(() => {
    if (!isAutoplaying || !currentMoveNode) return

    const interval = setInterval(() => {
      if (currentMoveNode.children.length > 0) {
        dispatch(goToChildNode(0))
        const nextMove = currentMoveNode.children[0].move
        dispatch(
          makeMove({
            position: nextMove.position,
            color: nextMove.color,
          })
        )
      } else {
        dispatch(setIsAutoplaying(false))
      }
    }, autoplaySpeed)

    return () => clearInterval(interval)
  }, [isAutoplaying, currentMoveNode, autoplaySpeed, dispatch])

  const handleAutoplayToggle = () => {
    dispatch(setIsAutoplaying(!isAutoplaying))
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setAutoplaySpeed(Number(e.target.value)))
  }

  return (
    <div className="joseki-library">
      <div className="library-sidebar">
        <div className="search-section">
          <input
            type="text"
            placeholder="搜索定式..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>搜索</button>
        </div>

        <div className="categories-section">
          <h3>定式分类</h3>
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="joseki-list-section">
          <h3>定式列表</h3>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div className="joseki-list">
              {josekiList.map((joseki) => (
                <div
                  key={joseki.id}
                  className={`joseki-item ${currentJoseki?.id === joseki.id ? 'selected' : ''}`}
                  onClick={() => handleJosekiSelect(joseki)}
                >
                  <div className="joseki-name">{joseki.name}</div>
                  <div className="joseki-meta">
                    <span className={`difficulty ${joseki.difficulty}`}>
                      {joseki.difficulty === 'beginner'
                        ? '初级'
                        : joseki.difficulty === 'intermediate'
                        ? '中级'
                        : '高级'}
                    </span>
                    {joseki.subcategory && (
                      <span className="subcategory">{joseki.subcategory}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="library-main">
        {currentJoseki ? (
          <>
            <div className="joseki-header">
              <h2>{currentJoseki.name}</h2>
              <p className="joseki-description">{currentJoseki.description}</p>
            </div>

            <div className="joseki-content">
              <div className="board-section">
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
                  interactive={true}
                />
                <GameControls showAIButton={false} />

                <div className="autoplay-controls">
                  <button
                    className={`control-btn ${isAutoplaying ? 'active' : ''}`}
                    onClick={handleAutoplayToggle}
                  >
                    {isAutoplaying ? '⏸ 暂停' : '▶ 自动播放'}
                  </button>
                  <select
                    value={autoplaySpeed}
                    onChange={handleSpeedChange}
                    className="speed-select"
                  >
                    <option value={2000}>慢速 (2秒)</option>
                    <option value={1000}>正常 (1秒)</option>
                    <option value={500}>快速 (0.5秒)</option>
                    <option value={250}>极快 (0.25秒)</option>
                  </select>
                </div>
              </div>

              <div className="tree-section">
                <MoveTree
                  rootNode={currentJoseki.moveTree}
                  currentNodeId={currentMoveNode?.id || null}
                  onNodeSelect={handleNodeSelect}
                />

                {currentMoveNode?.comment && (
                  <div className="move-comment">
                    <h4>注释</h4>
                    <p>{currentMoveNode.comment}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>定式库浏览</h2>
            <p>请从左侧选择一个定式开始学习</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default JosekiLibrary
