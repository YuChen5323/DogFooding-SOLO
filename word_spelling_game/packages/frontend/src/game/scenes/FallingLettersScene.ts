import Phaser from 'phaser'
import BaseScene from './BaseScene'
import { store } from '@/store'
import { tts } from '@/services/tts'
import {
  setCurrentWord,
  nextWord as nextWordAction,
  addFallingLetter,
  removeFallingLetter,
  type FallingLetter as StoreFallingLetter,
} from '@/store/slices/gameSlice'

interface GameFallingLetter extends StoreFallingLetter {
  sprite: Phaser.GameObjects.Text
}

export class FallingLettersScene extends BaseScene {
  private fallingLetters: GameFallingLetter[]
  private wordDisplay: Phaser.GameObjects.Text
  private spawnTimer: number
  private spawnInterval: number
  private difficulty: number

  constructor() {
    super('FallingLettersScene', 'falling')
    this.fallingLetters = []
    this.spawnTimer = 0
    this.spawnInterval = 2000
    this.difficulty = 1
    this.wordDisplay = {} as Phaser.GameObjects.Text
  }

  protected startGame() {
    this.createWordDisplay()
    this.spawnTimer = 0
    this.difficulty = 1
    
    if (this.wordList.length > 0) {
      store.dispatch(setCurrentWord(this.wordList[0]))
      tts.speakWord(this.wordList[0])
    }
  }

  private createWordDisplay() {
    const centerX = this.cameras.main.centerX
    const y = this.scale.height - 100
    
    this.wordDisplay = this.add.text(centerX, y, '', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    this.wordDisplay.setOrigin(0.5)
    this.uiLayer.add(this.wordDisplay)
    
    this.updateWordDisplay()
  }

  private updateWordDisplay() {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    
    let displayText = ''
    for (let i = 0; i < currentWord.length; i++) {
      if (i < typedLetters.length) {
        displayText += `[color=#4ade80]${typedLetters[i].toUpperCase()}[/color]`
      } else {
        displayText += `[color=#6b7280]_[/color]`
      }
      if (i < currentWord.length - 1) {
        displayText += ' '
      }
    }
    
    this.wordDisplay.setText(displayText)
  }

  protected handleLetterInput(letter: string) {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    const expectedLetter = currentWord[typedLetters.length]?.toLowerCase()
    
    if (letter === expectedLetter) {
      const matchingLetter = this.fallingLetters.find(
        (l) => l.letter.toLowerCase() === letter && l.isCorrect
      )
      
      if (matchingLetter) {
        this.showSuccessEffect(matchingLetter.x, matchingLetter.y)
        this.removeLetter(matchingLetter.id)
      }
      
      this.dispatchTypeLetter(letter)
      
      const newTypedCount = typedLetters.length + 1
      if (newTypedCount >= currentWord.length) {
        this.advanceToNextWord()
      } else {
        this.updateWordDisplay()
      }
    } else {
      this.showErrorEffect(this.cameras.main.centerX, this.cameras.main.centerY)
      this.dispatchTypeLetter(letter)
    }
  }

  protected handleBackspace() {
  }

  protected handleTouch(pointer: Phaser.Input.Pointer) {
    const clickedLetter = this.fallingLetters.find((letter) => {
      const bounds = letter.sprite.getBounds()
      return bounds.contains(pointer.x, pointer.y)
    })
    
    if (clickedLetter) {
      this.handleLetterInput(clickedLetter.letter.toLowerCase())
    }
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
    this.updateWordDisplay()
    
    this.difficulty = Math.min(this.difficulty + 0.1, 3)
    this.spawnInterval = Math.max(800, 2000 - this.difficulty * 400)
  }

  private spawnLetter() {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    const nextCorrectLetter = currentWord[typedLetters.length]
    
    const x = Phaser.Math.Between(50, this.scale.width - 50)
    const y = -50
    
    let letter: string
    let isCorrect: boolean
    
    if (nextCorrectLetter && Math.random() < 0.4 + this.difficulty * 0.1) {
      letter = nextCorrectLetter
      isCorrect = true
    } else {
      const wrongLetters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((l) => l !== nextCorrectLetter?.toLowerCase())
      letter = Phaser.Math.RND.pick(wrongLetters).toUpperCase()
      isCorrect = false
    }
    
    const sprite = this.add.text(x, y, letter, {
      fontSize: '48px',
      color: isCorrect ? '#818cf8' : '#f472b6',
      fontStyle: 'bold',
      backgroundColor: isCorrect ? 'rgba(129, 140, 248, 0.2)' : 'rgba(244, 114, 182, 0.2)',
      padding: { x: 16, y: 8 },
    })
    sprite.setOrigin(0.5)
    
    const letterId = `letter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const fallingLetter: GameFallingLetter = {
      id: letterId,
      letter: letter,
      sprite: sprite,
      x: x,
      y: y,
      speed: 50 + this.difficulty * 30,
      isCorrect: isCorrect,
    }
    
    this.fallingLetters.push(fallingLetter)
    this.gameLayer.add(sprite)
    
    store.dispatch(addFallingLetter({
      id: letterId,
      letter: letter,
      x: x,
      y: y,
      speed: fallingLetter.speed,
      isCorrect: isCorrect,
    }))
  }

  private removeLetter(id: string) {
    const index = this.fallingLetters.findIndex((l) => l.id === id)
    if (index !== -1) {
      this.fallingLetters[index].sprite.destroy()
      this.fallingLetters.splice(index, 1)
      store.dispatch(removeFallingLetter(id))
    }
  }

  protected gameLoop() {
    const delta = this.game.loop.delta
    
    this.spawnTimer += delta
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnLetter()
    }
    
    const lettersToRemove: string[] = []
    
    for (const letter of this.fallingLetters) {
      letter.y += letter.speed * (delta / 1000)
      letter.sprite.y = letter.y
      
      if (letter.y > this.scale.height + 50) {
        if (letter.isCorrect) {
          this.showErrorEffect(letter.x, this.scale.height - 50)
          this.dispatchTypeLetter('wrong')
        }
        lettersToRemove.push(letter.id)
      }
    }
    
    for (const id of lettersToRemove) {
      this.removeLetter(id)
    }
  }
}

export default FallingLettersScene
