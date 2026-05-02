import Phaser from 'phaser'
import BaseScene from './BaseScene'
import { store } from '@/store'
import { tts } from '@/services/tts'
import { setCurrentWord, nextWord as nextWordAction, updateTime } from '@/store/slices/gameSlice'

export class SpeedSpellScene extends BaseScene {
  private timerText: Phaser.GameObjects.Text
  private scoreText: Phaser.GameObjects.Text
  private wordDisplay: Phaser.GameObjects.Text
  private inputDisplay: Phaser.GameObjects.Text
  private timeRemaining: number
  private isTimerRunning: boolean

  constructor() {
    super('SpeedSpellScene', 'speed')
    this.timeRemaining = 60
    this.isTimerRunning = false
    this.timerText = {} as Phaser.GameObjects.Text
    this.scoreText = {} as Phaser.GameObjects.Text
    this.wordDisplay = {} as Phaser.GameObjects.Text
    this.inputDisplay = {} as Phaser.GameObjects.Text
  }

  init(data: { wordList: string[] }) {
    super.init(data)
    this.timeRemaining = 60
    this.isTimerRunning = false
  }

  protected startGame() {
    this.createHUD()
    this.isTimerRunning = true
    
    if (this.wordList.length > 0) {
      store.dispatch(setCurrentWord(this.wordList[0]))
      tts.speakWord(this.wordList[0])
      this.updateDisplays()
    }
  }

  private createHUD() {
    const centerX = this.cameras.main.centerX
    const width = this.scale.width
    const height = this.scale.height
    
    this.timerText = this.add.text(width - 50, 50, '60', {
      fontSize: '48px',
      color: '#fbbf24',
      fontStyle: 'bold',
    })
    this.timerText.setOrigin(1, 0.5)
    this.uiLayer.add(this.timerText)
    
    this.scoreText = this.add.text(50, 50, '0', {
      fontSize: '32px',
      color: '#818cf8',
      fontStyle: 'bold',
    })
    this.scoreText.setOrigin(0, 0.5)
    this.uiLayer.add(this.scoreText)
    
    this.wordDisplay = this.add.text(centerX, height * 0.35, '', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    this.wordDisplay.setOrigin(0.5)
    this.uiLayer.add(this.wordDisplay)
    
    this.inputDisplay = this.add.text(centerX, height * 0.5, '', {
      fontSize: '48px',
      color: '#94a3b8',
      fontStyle: 'bold',
    })
    this.inputDisplay.setOrigin(0.5)
    this.uiLayer.add(this.inputDisplay)
    
    const hintText = this.add.text(centerX, height * 0.65, 'Type the word as fast as you can!', {
      fontSize: '20px',
      color: '#6b7280',
      fontStyle: 'italic',
    })
    hintText.setOrigin(0.5)
    this.uiLayer.add(hintText)
  }

  private updateDisplays() {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    const score = state.game.score
    
    this.wordDisplay.setText(currentWord.toUpperCase())
    this.scoreText.setText(`Score: ${score}`)
    
    let inputText = ''
    for (let i = 0; i < currentWord.length; i++) {
      if (i < typedLetters.length) {
        if (typedLetters[i].toLowerCase() === currentWord[i].toLowerCase()) {
          inputText += `[color=#4ade80]${typedLetters[i].toUpperCase()}[/color]`
        } else {
          inputText += `[color=#f87171]${typedLetters[i].toUpperCase()}[/color]`
        }
      } else {
        inputText += `[color=#4b5563]_[/color]`
      }
    }
    this.inputDisplay.setText(inputText)
  }

  private updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60)
    const seconds = Math.floor(this.timeRemaining % 60)
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    this.timerText.setText(display)
    
    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#f87171')
      this.timerText.setFontSize(56)
    } else if (this.timeRemaining <= 20) {
      this.timerText.setColor('#fbbf24')
    } else {
      this.timerText.setColor('#4ade80')
    }
    
    store.dispatch(updateTime(this.timeRemaining))
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
        this.advanceToNextWord()
      } else {
        this.updateDisplays()
      }
    } else {
      this.showErrorEffect(this.cameras.main.centerX, this.cameras.main.centerY)
      this.dispatchTypeLetter(letter)
      this.updateDisplays()
    }
  }

  protected handleBackspace() {
  }

  protected handleTouch(_pointer: Phaser.Input.Pointer) {
  }

  private advanceToNextWord() {
    this.currentWordIndex++
    
    if (this.currentWordIndex >= this.wordList.length) {
      this.currentWordIndex = 0
      this.shuffleWordList()
    }
    
    const nextWordText = this.wordList[this.currentWordIndex]
    store.dispatch(nextWordAction(nextWordText))
    tts.speakWord(nextWordText)
    this.updateDisplays()
  }

  private shuffleWordList() {
    for (let i = this.wordList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.wordList[i], this.wordList[j]] = [this.wordList[j], this.wordList[i]]
    }
  }

  protected gameLoop() {
    if (!this.isTimerRunning) return
    
    const delta = this.game.loop.delta
    this.timeRemaining -= delta / 1000
    
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0
      this.isTimerRunning = false
      this.endGameScene('levelComplete')
    }
    
    this.updateTimerDisplay()
  }
}

export default SpeedSpellScene
