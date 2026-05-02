import Phaser from 'phaser';
import { LabScene } from './scenes/LabScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 700,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [LabScene],
  backgroundColor: '#1f140a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
