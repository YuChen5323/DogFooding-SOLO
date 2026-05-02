import Phaser from 'phaser'
import { SpinePlugin } from '@esotericsoftware/spine-phaser'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  plugins: {
    scene: [
      {
        key: 'SpinePlugin',
        plugin: SpinePlugin,
        mapping: 'spine',
      },
    ],
  },
  input: {
    keyboard: true,
    touch: true,
    mouse: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
}

export default gameConfig
