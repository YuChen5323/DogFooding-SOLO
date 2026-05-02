import Phaser from 'phaser'
import BaseScene from './BaseScene'
import { store } from '@/store'
import { tts } from '@/services/tts'
import {
  setCurrentWord,
  nextWord as nextWordAction,
  selectPuzzlePiece,
  swapPuzzlePieces,
  checkPuzzleComplete,
} from '@/store/slices/gameSlice'

interface PuzzlePiece {
  id: string
  letter: string
  position: number
  currentPosition: number
  sprite: Phaser.GameObjects.Container
  isSelected: boolean
}

export class PuzzleScene extends BaseScene {
  private puzzlePieces: PuzzlePiece[]
  private selectedPiece: PuzzlePiece | null
  private wordDisplay: Phaser.GameObjects.Text
  private hintText: Phaser.GameObjects.Text
  private pieceSpacing: number

  constructor() {
    super('PuzzleScene', 'puzzle')
    this.puzzlePieces = []
    this.selectedPiece = null
    this.pieceSpacing = 80
    this.wordDisplay = {} as Phaser.GameObjects.Text
    this.hintText = {} as Phaser.GameObjects.Text
  }

  protected startGame() {
    this.createUI()
    this.selectedPiece = null
    
    if (this.wordList.length > 0) {
      store.dispatch(setCurrentWord(this.wordList[0]))
      tts.speakWord(this.wordList[0])
      this.createPuzzlePieces(this.wordList[0])
    }
  }

  protected createUI() {
    const centerX = this.cameras.main.centerX
    
    this.hintText = this.add.text(centerX, 100, '', {
      fontSize: '24px',
      color: '#94a3b8',
      fontStyle: 'italic',
    })
    this.hintText.setOrigin(0.5)
    this.uiLayer.add(this.hintText)
    
    this.wordDisplay = this.add.text(centerX, 150, '', {
      fontSize: '32px',
      color: '#818cf8',
      fontStyle: 'bold',
    })
    this.wordDisplay.setOrigin(0.5)
    this.uiLayer.add(this.wordDisplay)
  }

  private createPuzzlePieces(word: string) {
    for (const piece of this.puzzlePieces) {
      piece.sprite.destroy()
    }
    this.puzzlePieces = []
    this.selectedPiece = null
    
    const letters = word.split('')
    const centerX = this.cameras.main.centerX
    const startX = centerX - ((letters.length - 1) * this.pieceSpacing) / 2
    const y = this.cameras.main.centerY
    
    const shuffledPositions = this.shuffleArray(
      letters.map((_, i) => i)
    )
    
    letters.forEach((letter, index) => {
      const currentPos = shuffledPositions[index]
      const x = startX + currentPos * this.pieceSpacing
      
      const pieceId = `piece-${index}-${Date.now()}`
      
      const container = this.createPieceSprite(letter, x, y, currentPos)
      container.setInteractive()
      
      const piece: PuzzlePiece = {
        id: pieceId,
        letter: letter,
        position: index,
        currentPosition: currentPos,
        sprite: container,
        isSelected: false,
      }
      
      this.puzzlePieces.push(piece)
      this.gameLayer.add(container)
      
      this.setupPieceInput(piece, container)
    })
    
    this.updateWordDisplay()
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private createPieceSprite(letter: string, x: number, y: number, pos: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    const bg = this.add.rectangle(0, 0, 70, 70, 0x6366f1, 0.8)
    bg.setStrokeStyle(3, 0x818cf8)
    bg.setData('position', pos)
    
    const text = this.add.text(0, 0, letter.toUpperCase(), {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    text.setOrigin(0.5)
    
    container.add([bg, text])
    container.setData('letter', letter)
    container.setData('position', pos)
    
    return container
  }

  private setupPieceInput(piece: PuzzlePiece, container: Phaser.GameObjects.Container) {
    container.on('pointerdown', () => {
      if (this.isPaused) return
      this.selectPiece(piece)
    })
  }

  private selectPiece(piece: PuzzlePiece) {
    if (this.selectedPiece === null) {
      this.selectedPiece = piece
      piece.isSelected = true
      this.highlightPiece(piece, true)
      store.dispatch(selectPuzzlePiece(piece.id))
    } else if (this.selectedPiece === piece) {
      piece.isSelected = false
      this.highlightPiece(piece, false)
      this.selectedPiece = null
      store.dispatch(selectPuzzlePiece(null))
    } else {
      this.swapPieces(this.selectedPiece, piece)
    }
  }

  private swapPieces(piece1: PuzzlePiece, piece2: PuzzlePiece) {
    const pos1 = piece1.currentPosition
    const pos2 = piece2.currentPosition
    
    piece1.currentPosition = pos2
    piece2.currentPosition = pos1
    
    const centerX = this.cameras.main.centerX
    const letters = store.getState().game.currentWord.split('')
    const startX = centerX - ((letters.length - 1) * this.pieceSpacing) / 2
    
    const newX1 = startX + pos2 * this.pieceSpacing
    const newX2 = startX + pos1 * this.pieceSpacing
    
    this.tweens.add({
      targets: piece1.sprite,
      x: newX1,
      duration: 300,
      ease: 'Power2',
    })
    
    this.tweens.add({
      targets: piece2.sprite,
      x: newX2,
      duration: 300,
      ease: 'Power2',
    })
    
    this.highlightPiece(piece1, false)
    this.highlightPiece(piece2, false)
    piece1.isSelected = false
    piece2.isSelected = false
    this.selectedPiece = null
    
    store.dispatch(swapPuzzlePieces({ from: pos1, to: pos2 }))
    tts.speakLetter(piece1.letter)
    
    this.time.delayedCall(400, () => {
      this.checkSolution()
    })
  }

  private highlightPiece(piece: PuzzlePiece, selected: boolean) {
    const bg = piece.sprite.getAt(0) as Phaser.GameObjects.Rectangle
    if (selected) {
      bg.setFillStyle(0xf472b6, 1)
      bg.setStrokeStyle(4, 0xfbbf24)
      this.tweens.add({
        targets: piece.sprite,
        scale: 1.1,
        duration: 200,
        ease: 'Power2',
      })
    } else {
      bg.setFillStyle(0x6366f1, 0.8)
      bg.setStrokeStyle(3, 0x818cf8)
      this.tweens.add({
        targets: piece.sprite,
        scale: 1,
        duration: 200,
        ease: 'Power2',
      })
    }
  }

  private checkSolution() {
    const allCorrect = this.puzzlePieces.every(
      (piece) => piece.position === piece.currentPosition
    )
    
    if (allCorrect) {
      this.showSuccessEffect(this.cameras.main.centerX, this.cameras.main.centerY)
      store.dispatch(checkPuzzleComplete())
      
      this.puzzlePieces.forEach((piece) => {
        const bg = piece.sprite.getAt(0) as Phaser.GameObjects.Rectangle
        bg.setFillStyle(0x4ade80, 0.8)
        bg.setStrokeStyle(3, 0x22c55e)
      })
      
      this.time.delayedCall(1000, () => {
        this.advanceToNextWord()
      })
    }
  }

  private updateWordDisplay() {
    const state = store.getState()
    const currentWord = state.game.currentWord
    
    this.hintText.setText(`Rearrange the letters to spell:`)
    this.wordDisplay.setText('_'.repeat(currentWord.length).split('').join(' '))
  }

  private advanceToNextWord() {
    this.currentWordIndex++
    
    if (this.currentWordIndex >= this.wordList.length) {
      this.endGameScene('levelComplete')
      return
    }
    
    const nextWordText = this.wordList[this.currentWordIndex]
    store.dispatch(nextWordAction(nextWordText))
    tts.speakWord(nextWordText)
    this.createPuzzlePieces(nextWordText)
  }

  protected handleLetterInput(letter: string) {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    const expectedLetter = currentWord[typedLetters.length]?.toLowerCase()
    
    if (letter === expectedLetter) {
      this.dispatchTypeLetter(letter)
      
      const newTypedCount = typedLetters.length + 1
      if (newTypedCount >= currentWord.length) {
        this.showSuccessEffect(this.cameras.main.centerX, this.cameras.main.centerY)
        this.time.delayedCall(500, () => this.advanceToNextWord())
      }
    } else {
      this.showErrorEffect(this.cameras.main.centerX, this.cameras.main.centerY)
      this.dispatchTypeLetter(letter)
    }
  }

  protected handleBackspace() {
  }

  protected handleTouch(_pointer: Phaser.Input.Pointer) {
  }

  protected gameLoop() {
  }
}

export default PuzzleScene
