import Phaser from 'phaser'
import { gameConfig } from './config'
import FallingLettersScene from './scenes/FallingLettersScene'
import PuzzleScene from './scenes/PuzzleScene'
import SpeedSpellScene from './scenes/SpeedSpellScene'
import { GameMode } from '@/store/slices/gameSlice'

class GameManager {
  private game: Phaser.Game | null = null
  private isInitialized = false

  public initialize(): void {
    if (this.isInitialized) return

    const scenes = [FallingLettersScene, PuzzleScene, SpeedSpellScene]

    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      scene: scenes,
    }

    this.game = new Phaser.Game(config)
    this.isInitialized = true
  }

  public startGame(mode: GameMode, wordList: string[]): void {
    if (!this.game) {
      this.initialize()
    }

    const sceneKey = this.getSceneKey(mode)
    if (this.game) {
      const scene = this.game.scene.getScene(sceneKey)
      if (scene) {
        this.game.scene.start(sceneKey, { wordList })
      }
    }
  }

  public pauseGame(): void {
    if (this.game) {
      this.game.scene.pause(this.game.scene.getScenes(true)[0]?.scene.key || '')
    }
  }

  public resumeGame(): void {
    if (this.game) {
      this.game.scene.resume(this.game.scene.getScenes(true)[0]?.scene.key || '')
    }
  }

  public stopGame(): void {
    if (this.game) {
      const activeScenes = this.game.scene.getScenes(true)
      activeScenes.forEach((scene) => {
        this.game?.scene.stop(scene.scene.key)
      })
    }
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
      this.isInitialized = false
    }
  }

  public getGame(): Phaser.Game | null {
    return this.game
  }

  private getSceneKey(mode: GameMode): string {
    const sceneMap: Record<GameMode, string> = {
      falling: 'FallingLettersScene',
      puzzle: 'PuzzleScene',
      speed: 'SpeedSpellScene',
    }
    return sceneMap[mode]
  }
}

export const gameManager = new GameManager()
export default gameManager
