import { Position, StoneColor } from '@/types'

export function createEmptyBoard(size: number): (StoneColor | null)[][] {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null))
}

export function cloneBoard(board: (StoneColor | null)[][]): (StoneColor | null)[][] {
  return board.map(row => [...row])
}

export function isOnBoard(row: number, col: number, boardSize: number): boolean {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize
}

export function getNeighbors(row: number, col: number, boardSize: number): Position[] {
  const neighbors: Position[] = []
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of directions) {
    const nr = row + dr
    const nc = col + dc
    if (isOnBoard(nr, nc, boardSize)) {
      neighbors.push({ row: nr, col: nc })
    }
  }
  return neighbors
}

export function getGroup(
  board: (StoneColor | null)[][],
  row: number,
  col: number
): { stones: Position[]; liberties: Position[] } | null {
  const color = board[row][col]
  if (!color) return null

  const boardSize = board.length
  const stones: Position[] = []
  const liberties: Position[] = []
  const visited = new Set<string>()
  const queue: Position[] = [{ row, col }]
  visited.add(`${row},${col}`)

  while (queue.length > 0) {
    const pos = queue.shift()!
    stones.push(pos)

    for (const neighbor of getNeighbors(pos.row, pos.col, boardSize)) {
      const key = `${neighbor.row},${neighbor.col}`
      if (visited.has(key)) continue

      const neighborColor = board[neighbor.row][neighbor.col]
      if (neighborColor === color) {
        visited.add(key)
        queue.push(neighbor)
      } else if (neighborColor === null) {
        visited.add(key)
        liberties.push(neighbor)
      }
    }
  }

  return { stones, liberties }
}

export function removeGroup(
  board: (StoneColor | null)[][],
  groupStones: Position[]
): (StoneColor | null)[][] {
  const newBoard = cloneBoard(board)
  for (const stone of groupStones) {
    newBoard[stone.row][stone.col] = null
  }
  return newBoard
}

export function playMove(
  board: (StoneColor | null)[][],
  row: number,
  col: number,
  color: StoneColor,
  koPosition: Position | null
): {
  newBoard: (StoneColor | null)[][]
  newKoPosition: Position | null
  captures: number
  isValid: boolean
  isSuicide: boolean
  isKo: boolean
} {
  const boardSize = board.length

  if (!isOnBoard(row, col, boardSize)) {
    return {
      newBoard: board,
      newKoPosition: null,
      captures: 0,
      isValid: false,
      isSuicide: false,
      isKo: false,
    }
  }

  if (board[row][col] !== null) {
    return {
      newBoard: board,
      newKoPosition: null,
      captures: 0,
      isValid: false,
      isSuicide: false,
      isKo: false,
    }
  }

  if (koPosition && koPosition.row === row && koPosition.col === col) {
    return {
      newBoard: board,
      newKoPosition: null,
      captures: 0,
      isValid: false,
      isSuicide: false,
      isKo: true,
    }
  }

  let newBoard = cloneBoard(board)
  newBoard[row][col] = color

  const opponent = color === 'black' ? 'white' : 'black'
  let totalCaptures = 0
  let capturedGroup: Position[] | null = null

  for (const neighbor of getNeighbors(row, col, boardSize)) {
    if (newBoard[neighbor.row][neighbor.col] === opponent) {
      const group = getGroup(newBoard, neighbor.row, neighbor.col)
      if (group && group.liberties.length === 0) {
        totalCaptures += group.stones.length
        if (group.stones.length === 1) {
          capturedGroup = group.stones
        }
        newBoard = removeGroup(newBoard, group.stones)
      }
    }
  }

  const selfGroup = getGroup(newBoard, row, col)
  if (!selfGroup || selfGroup.liberties.length === 0) {
    return {
      newBoard: board,
      newKoPosition: null,
      captures: 0,
      isValid: false,
      isSuicide: true,
      isKo: false,
    }
  }

  let newKoPosition: Position | null = null
  if (totalCaptures === 1 && capturedGroup) {
    const capturedStone = capturedGroup[0]
    const newSelfGroup = getGroup(newBoard, row, col)
    if (newSelfGroup && newSelfGroup.stones.length === 1 && newSelfGroup.liberties.length === 1) {
      newKoPosition = capturedStone
    }
  }

  return {
    newBoard,
    newKoPosition,
    captures: totalCaptures,
    isValid: true,
    isSuicide: false,
    isKo: false,
  }
}

export function getBoardHash(board: (StoneColor | null)[][]): string {
  const boardSize = board.length
  let hash = ''
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const stone = board[row][col]
      if (stone === 'black') hash += 'B'
      else if (stone === 'white') hash += 'W'
      else hash += '.'
    }
  }
  return hash
}
