import React, { useEffect, useRef, useCallback, useState } from 'react'
import { StoneColor, Position, Move, AIRecommendation } from '@/types'
import { isOnBoard } from '@/utils/goRules'
import './Goban.css'

interface GobanProps {
  boardSize: number
  board: (StoneColor | null)[][]
  lastMove: Move | null
  hoverPosition: Position | null
  nextToPlay: StoneColor
  showAIRecommendations: boolean
  aiRecommendations: AIRecommendation[]
  markedMoves: { [key: string]: { marker: string; label?: string } }
  onPositionClick?: (position: Position) => void
  onPositionHover?: (position: Position | null) => void
  interactive?: boolean
}

const WOOD_COLOR = '#DEB887'
const WOOD_DARK_COLOR = '#CD853F'
const BOARD_COLOR = '#F5DEB3'
const LINE_COLOR = '#8B4513'
const BLACK_STONE_COLOR = '#1a1a1a'
const BLACK_STONE_LIGHT = '#3a3a3a'
const WHITE_STONE_COLOR = '#F5F5F5'
const WHITE_STONE_DARK = '#D3D3D3'

const Goban: React.FC<GobanProps> = ({
  boardSize,
  board,
  lastMove,
  hoverPosition,
  nextToPlay,
  showAIRecommendations,
  aiRecommendations,
  markedMoves,
  onPositionClick,
  onPositionHover,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(30)
  const [canvasSize, setCanvasSize] = useState(600)

  const padding = cellSize * 1.5
  const starPoints = getStarPoints(boardSize)

  function getStarPoints(size: number): Position[] {
    const points: Position[] = []
    const hoshi = size === 19 ? [3, 9, 15] : size === 13 ? [3, 6, 9] : [2, 5, 8]
    for (const row of hoshi) {
      for (const col of hoshi) {
        points.push({ row, col })
      }
    }
    return points
  }

  const getCanvasPosition = useCallback((boardPos: Position): { x: number; y: number } => {
    return {
      x: padding + boardPos.col * cellSize,
      y: padding + boardPos.row * cellSize,
    }
  }, [padding, cellSize])

  const getBoardPosition = useCallback((canvasX: number, canvasY: number): Position | null => {
    const col = Math.round((canvasX - padding) / cellSize)
    const row = Math.round((canvasY - padding) / cellSize)
    if (isOnBoard(row, col, boardSize)) {
      return { row, col }
    }
    return null
  }, [padding, cellSize, boardSize])

  const drawWoodTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, BOARD_COLOR)
    gradient.addColorStop(0.3, WOOD_COLOR)
    gradient.addColorStop(0.5, BOARD_COLOR)
    gradient.addColorStop(0.7, WOOD_COLOR)
    gradient.addColorStop(1, BOARD_COLOR)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 100; i++) {
      ctx.strokeStyle = i % 2 === 0 ? WOOD_DARK_COLOR : WOOD_COLOR
      ctx.lineWidth = Math.random() * 2 + 0.5
      ctx.beginPath()
      const y = Math.random() * height
      ctx.moveTo(0, y)
      for (let x = 0; x < width; x += 10) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 2)
      }
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    const boardPixelSize = (boardSize - 1) * cellSize

    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = 1

    for (let i = 0; i < boardSize; i++) {
      const pos = padding + i * cellSize
      ctx.beginPath()
      ctx.moveTo(pos, padding)
      ctx.lineTo(pos, padding + boardPixelSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding, pos)
      ctx.lineTo(padding + boardPixelSize, pos)
      ctx.stroke()
    }

    const starRadius = cellSize * 0.12
    ctx.fillStyle = LINE_COLOR
    for (const star of starPoints) {
      const { x, y } = getCanvasPosition(star)
      ctx.beginPath()
      ctx.arc(x, y, starRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [boardSize, cellSize, padding, starPoints, getCanvasPosition])

  const drawStone = useCallback((ctx: CanvasRenderingContext2D, pos: Position, color: StoneColor, isLastMove: boolean) => {
    const { x, y } = getCanvasPosition(pos)
    const radius = cellSize * 0.45

    const shadowOffset = radius * 0.15
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + shadowOffset, y + shadowOffset, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (color === 'black') {
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        radius * 0.1,
        x,
        y,
        radius
      )
      gradient.addColorStop(0, BLACK_STONE_LIGHT)
      gradient.addColorStop(1, BLACK_STONE_COLOR)
      ctx.fillStyle = gradient
    } else {
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        radius * 0.1,
        x,
        y,
        radius
      )
      gradient.addColorStop(0, '#FFFFFF')
      gradient.addColorStop(0.5, WHITE_STONE_COLOR)
      gradient.addColorStop(1, WHITE_STONE_DARK)
      ctx.fillStyle = gradient
    }

    ctx.fill()

    ctx.strokeStyle = color === 'black' ? '#000000' : '#AAAAAA'
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.restore()

    if (isLastMove) {
      ctx.save()
      const markerRadius = radius * 0.25
      ctx.beginPath()
      ctx.arc(x, y, markerRadius, 0, Math.PI * 2)
      ctx.fillStyle = color === 'black' ? '#FF4444' : '#FF0000'
      ctx.fill()
      ctx.restore()
    }
  }, [getCanvasPosition, cellSize])

  const drawHoverStone = useCallback((ctx: CanvasRenderingContext2D, pos: Position, color: StoneColor) => {
    const { x, y } = getCanvasPosition(pos)
    const radius = cellSize * 0.45

    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (color === 'black') {
      ctx.fillStyle = BLACK_STONE_COLOR
    } else {
      ctx.fillStyle = WHITE_STONE_COLOR
    }

    ctx.fill()
    ctx.restore()
  }, [getCanvasPosition, cellSize])

  const drawAIRecommendation = useCallback((ctx: CanvasRenderingContext2D, recommendation: AIRecommendation) => {
    if (recommendation.isPass) return

    const { x, y } = getCanvasPosition(recommendation.position)
    const radius = cellSize * 0.3

    const alpha = 0.3 + (recommendation.order === 0 ? 0.4 : 0)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    let color = '#4CAF50'
    if (recommendation.order === 0) color = '#2196F3'
    else if (recommendation.order === 1) color = '#FF9800'
    else if (recommendation.order === 2) color = '#F44336'

    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${cellSize * 0.35}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(recommendation.order + 1), x, y)
    ctx.restore()
  }, [getCanvasPosition, cellSize])

  const drawMarker = useCallback((ctx: CanvasRenderingContext2D, pos: Position, markerType: string, label?: string) => {
    const { x, y } = getCanvasPosition(pos)
    const size = cellSize * 0.35

    ctx.save()
    ctx.lineWidth = 2

    switch (markerType) {
      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(x, y - size)
        ctx.lineTo(x - size * 0.866, y + size * 0.5)
        ctx.lineTo(x + size * 0.866, y + size * 0.5)
        ctx.closePath()
        ctx.strokeStyle = '#FF4444'
        ctx.stroke()
        break
      case 'square':
        ctx.strokeRect(x - size / 2, y - size / 2, size, size)
        ctx.strokeStyle = '#4444FF'
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.strokeStyle = '#44FF44'
        ctx.stroke()
        break
      case 'cross':
        ctx.beginPath()
        ctx.moveTo(x - size / 2, y)
        ctx.lineTo(x + size / 2, y)
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x, y + size / 2)
        ctx.strokeStyle = '#FF44FF'
        ctx.stroke()
        break
      case 'label':
        if (label) {
          ctx.font = `bold ${cellSize * 0.4}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#FF0000'
          ctx.fillText(label, x, y)
        }
        break
    }
    ctx.restore()
  }, [getCanvasPosition, cellSize])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasSize, canvasSize)
    drawWoodTexture(ctx, canvasSize, canvasSize)
    drawBoard(ctx)

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const stone = board[row][col]
        if (stone) {
          const isLastMove = lastMove !== null &&
            lastMove.position.row === row &&
            lastMove.position.col === col
          drawStone(ctx, { row, col }, stone, isLastMove)
        }
      }
    }

    if (showAIRecommendations) {
      for (const rec of aiRecommendations) {
        drawAIRecommendation(ctx, rec)
      }
    }

    for (const [key, { marker, label }] of Object.entries(markedMoves)) {
      const [row, col] = key.split(',').map(Number)
      drawMarker(ctx, { row, col }, marker, label)
    }

    if (interactive && hoverPosition && board[hoverPosition.row][hoverPosition.col] === null) {
      drawHoverStone(ctx, hoverPosition, nextToPlay)
    }
  }, [
    canvasSize,
    boardSize,
    board,
    lastMove,
    showAIRecommendations,
    aiRecommendations,
    markedMoves,
    interactive,
    hoverPosition,
    nextToPlay,
    drawWoodTexture,
    drawBoard,
    drawStone,
    drawAIRecommendation,
    drawMarker,
    drawHoverStone,
  ])

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current
      if (!container) return

      const maxSize = Math.min(
        container.clientWidth - 20,
        container.clientHeight - 20,
        800
      )

      const newCellSize = Math.floor(maxSize / (boardSize + 2))
      const newCanvasSize = newCellSize * (boardSize + 2)

      setCellSize(newCellSize)
      setCanvasSize(newCanvasSize)
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      resizeObserver.disconnect()
    }
  }, [boardSize])

  useEffect(() => {
    render()
  }, [render])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onPositionClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasSize / rect.width
    const scaleY = canvasSize / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const position = getBoardPosition(x, y)
    if (position) {
      onPositionClick(position)
    }
  }, [interactive, onPositionClick, canvasSize, getBoardPosition])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onPositionHover) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasSize / rect.width
    const scaleY = canvasSize / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const position = getBoardPosition(x, y)
    onPositionHover(position)
  }, [interactive, onPositionHover, canvasSize, getBoardPosition])

  const handleCanvasMouseLeave = useCallback(() => {
    if (onPositionHover) {
      onPositionHover(null)
    }
  }, [onPositionHover])

  return (
    <div ref={containerRef} className="goban-container">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className="goban-canvas"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      />
    </div>
  )
}

export default Goban
