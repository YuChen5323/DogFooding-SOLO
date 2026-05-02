import Phaser from 'phaser'
import { store } from '@/store'
import { tts } from '@/services/tts'
import { typeLetter, pauseGame, resumeGame, endGame } from '@/store/slices/gameSlice'
import { GameMode } from '@/store/slices/gameSlice'

export abstract class BaseScene extends Phaser.Scene {
  protected gameMode: GameMode
  protected wordList: string[]
  protected currentWordIndex: number
  protected isPaused: boolean
  protected keyboard: Phaser.Input.Keyboard.KeyboardPlugin
  protected backgroundMusic: Phaser.Sound.BaseSound | null
  protected uiLayer: Phaser.GameObjects.Container
  protected gameLayer: Phaser.GameObjects.Container
  protected effectsLayer: Phaser.GameObjects.Container

  constructor(sceneKey: string, gameMode: GameMode) {
    super({ key: sceneKey })
    this.gameMode = gameMode
    this.wordList = []
    this.currentWordIndex = 0
    this.isPaused = false
    this.backgroundMusic = null
    this.keyboard = {} as Phaser.Input.Keyboard.KeyboardPlugin
    this.uiLayer = {} as Phaser.GameObjects.Container
    this.gameLayer = {} as Phaser.GameObjects.Container
    this.effectsLayer = {} as Phaser.GameObjects.Container
  }

  init(data: { wordList: string[] }) {
    this.wordList = data.wordList || []
    this.currentWordIndex = 0
    this.isPaused = false
  }

  create() {
    this.setupLayers()
    this.setupKeyboard()
    this.setupTouch()
    this.createBackground()
    this.createUI()
    this.startGame()
  }

  protected setupLayers() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY
    
    this.gameLayer = this.add.container(centerX, centerY)
    this.uiLayer = this.add.container(centerX, centerY)
    this.effectsLayer = this.add.container(centerX, centerY)
    
    this.uiLayer.setDepth(100)
    this.effectsLayer.setDepth(200)
  }

  protected setupKeyboard() {
    this.keyboard = this.input.keyboard!
    
    this.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (this.isPaused) return
      
      const key = event.key.toLowerCase()
      if (/^[a-z]$/.test(key)) {
        this.handleLetterInput(key)
      } else if (event.key === 'Escape') {
        this.togglePause()
      } else if (event.key === 'Backspace') {
        this.handleBackspace()
      }
    })
  }

  protected setupTouch() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTouch(pointer)
    })
  }

  protected createBackground() {
    const graphics = this.add.graphics()
    
    graphics.fillStyle(0x0f172a)
    graphics.fillRect(0, 0, this.scale.width, this.scale.height)
    
    this.createStars()
    
    graphics.destroy()
  }

  protected createStars() {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, this.scale.width)
      const y = Phaser.Math.Between(0, this.scale.height)
      const size = Phaser.Math.FloatBetween(1, 3)
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8)
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha)
      
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        repeat: -1,
        yoyo: true,
      })
    }
  }

  protected createUI() {
  }

  protected abstract startGame(): void

  protected abstract handleLetterInput(letter: string): void

  protected abstract handleBackspace(): void

  protected abstract handleTouch(pointer: Phaser.Input.Pointer): void

  protected togglePause() {
    this.isPaused = !this.isPaused
    
    if (this.isPaused) {
      store.dispatch(pauseGame())
      this.scene.pause()
    } else {
      store.dispatch(resumeGame())
      this.scene.resume()
    }
  }

  protected playSoundEffect(key: string) {
    const settings = store.getState().settings
    if (settings.soundEffects === 'off') return
    
    const volumeMap: Record<string, number> = {
      low: 0.3,
      medium: 0.6,
      high: 1.0,
    }
    const volume = volumeMap[settings.soundEffects] || 0.6
    
    if (this.sound.get(key)) {
      this.sound.play(key, { volume })
    }
  }

  protected showSuccessEffect(x: number, y: number) {
    const text = this.add.text(x, y, '✓', {
      fontSize: '64px',
      color: '#4ade80',
      fontStyle: 'bold',
    })
    text.setOrigin(0.5)
    this.effectsLayer.add(text)
    
    this.tweens.add({
      targets: text,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 800,
      onComplete: () => {
        text.destroy()
      },
    })
    
    tts.speakSuccess()
  }

  protected showErrorEffect(x: number, y: number) {
    const text = this.add.text(x, y, '✗', {
      fontSize: '64px',
      color: '#f87171',
      fontStyle: 'bold',
    })
    text.setOrigin(0.5)
    this.effectsLayer.add(text)
    
    this.tweens.add({
      targets: text,
      x: { from: x - 20, to: x + 20 },
      duration: 100,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          duration: 300,
          onComplete: () => text.destroy(),
        })
      },
    })
    
    tts.speakError()
  }

  protected dispatchTypeLetter(letter: string) {
    const state = store.getState()
    const currentWord = state.game.currentWord
    const typedLetters = state.game.typedLetters
    
    const expectedLetter = currentWord[typedLetters.length]?.toLowerCase()
    
    if (letter === expectedLetter) {
      tts.speakLetter(letter)
    }
    
    store.dispatch(typeLetter(letter))
  }

  protected endGameScene(result: 'levelComplete' | 'gameOver') {
    store.dispatch(endGame(result))
    this.scene.stop()
  }

  update() {
    if (this.isPaused) return
    this.gameLoop()
  }

  protected abstract gameLoop(): void
}

export default BaseScene
