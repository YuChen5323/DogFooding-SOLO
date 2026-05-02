import Phaser from 'phaser';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300,
    },
    max: {
      width: 1600,
      height: 1200,
    },
  },
};

export const TILE_SIZE = 32;
export const FARM_GRID_WIDTH = 15;
export const FARM_GRID_HEIGHT = 10;
export const PLAYER_SPEED = 150;
export const GAME_MINUTES_PER_REAL_SECOND = 10;
