import Phaser from 'phaser';
import { TILE_SIZE, FARM_GRID_WIDTH, FARM_GRID_HEIGHT, PLAYER_SPEED } from '../config';
import { Season, Plot, GameTime } from '@/types';
import { SEASON_COLORS } from '@/data/achievements';

interface PlotTile {
  sprite: Phaser.GameObjects.Rectangle;
  cropSprite: Phaser.GameObjects.Text | null;
  waterIndicator: Phaser.GameObjects.Rectangle | null;
}

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerDirection!: Phaser.Math.Vector2;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private farmGrid!: Phaser.GameObjects.Container;
  private plotTiles!: PlotTile[][];
  private uiOverlay!: Phaser.GameObjects.Container;
  private currentSeason: Season = Season.SPRING;
  private isPaused: boolean = false;
  private selectedTool: string = 'hoe';
  private currentGameTime!: GameTime;

  private onToolSelectCallback!: ((tool: string) => void);
  private onPlotInteractCallback!: ((x: number, y: number, tool: string) => void);
  private onOpenMenuCallback!: ((menuType: string) => void);

  constructor() {
    super({ key: 'MainScene' });
  }

  setCallbacks(
    onToolSelect: (tool: string) => void,
    onPlotInteract: (x: number, y: number, tool: string) => void,
    onOpenMenu: (menuType: string) => void
  ) {
    this.onToolSelectCallback = onToolSelect;
    this.onPlotInteractCallback = onPlotInteract;
    this.onOpenMenuCallback = onOpenMenu;
  }

  setGameTime(gameTime: GameTime) {
    this.currentGameTime = gameTime;
  }

  setSeason(season: Season) {
    this.currentSeason = season;
    this.updateFarmColor();
  }

  setSelectedTool(tool: string) {
    this.selectedTool = tool;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  updatePlots(plots: Plot[][]) {
    for (let y = 0; y < FARM_GRID_HEIGHT; y++) {
      for (let x = 0; x < FARM_GRID_WIDTH; x++) {
        const plot = plots[y][x];
        const tile = this.plotTiles[y][x];
        this.updatePlotTile(tile, plot);
      }
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(0x90ee90);
    
    this.playerDirection = new Phaser.Math.Vector2(0, 0);
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    this.createFarmGrid();
    this.createPlayer();
    this.createUIOverlay();
    this.setupInputHandlers();
    this.setupCamera();

    this.currentGameTime = {
      day: 1,
      month: 1,
      year: 1,
      hour: 6,
      minute: 0,
      season: Season.SPRING,
      timeOfDay: 'morning'
    };
  }

  private createFarmGrid() {
    this.farmGrid = this.add.container(100, 100);
    this.plotTiles = [];

    for (let y = 0; y < FARM_GRID_HEIGHT; y++) {
      this.plotTiles[y] = [];
      for (let x = 0; x < FARM_GRID_WIDTH; x++) {
        const plotSprite = this.add.rectangle(
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
          0x7cfc00
        );
        plotSprite.setOrigin(0);
        plotSprite.setStrokeStyle(1, 0x228b22);
        plotSprite.setInteractive();

        this.farmGrid.add(plotSprite);
        this.plotTiles[y][x] = {
          sprite: plotSprite,
          cropSprite: null,
          waterIndicator: null,
        };
      }
    }
  }

  private createPlayer() {
    this.player = this.add.rectangle(
      400,
      300,
      TILE_SIZE * 0.8,
      TILE_SIZE * 0.8,
      0xff6b6b
    );
    this.player.setOrigin(0.5);
    this.player.setStrokeStyle(2, 0xffffff);

    const playerLabel = this.add.text(
      this.player.x,
      this.player.y,
      '👨‍🌾',
      { fontSize: '20px' }
    );
    playerLabel.setOrigin(0.5);
  }

  private createUIOverlay() {
    this.uiOverlay = this.add.container(10, 10);
    
    const tools = [
      { key: '1', tool: 'hoe', label: '⛏️' },
      { key: '2', tool: 'watering_can', label: '💧' },
      { key: '3', tool: 'seed', label: '🌱' },
      { key: '4', tool: 'hammer', label: '🔨' },
    ];

    tools.forEach((t, i) => {
      const btn = this.add.rectangle(
        i * 50,
        0,
        45,
        45,
        0xdeb887
      );
      btn.setOrigin(0);
      btn.setStrokeStyle(3, 0x8b4513);
      btn.setInteractive();

      const label = this.add.text(i * 50 + 22, 22, t.label, {
        fontSize: '20px',
      });
      label.setOrigin(0.5);

      this.uiOverlay.add([btn, label]);
    });

    const menuBtn = this.add.rectangle(
      this.scale.width - 60,
      10,
      50,
      45,
      0xdeb887
    );
    menuBtn.setOrigin(0);
    menuBtn.setStrokeStyle(3, 0x8b4513);
    menuBtn.setInteractive();

    const menuLabel = this.add.text(
      this.scale.width - 35,
      32,
      '📋',
      { fontSize: '20px' }
    );
    menuLabel.setOrigin(0.5);
  }

  private setupInputHandlers() {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ONE', () => {
        this.selectedTool = 'hoe';
        this.onToolSelectCallback?.('hoe');
      });

      this.input.keyboard.on('keydown-TWO', () => {
        this.selectedTool = 'watering_can';
        this.onToolSelectCallback?.('watering_can');
      });

      this.input.keyboard.on('keydown-THREE', () => {
        this.selectedTool = 'seed';
        this.onToolSelectCallback?.('seed');
      });

      this.input.keyboard.on('keydown-FOUR', () => {
        this.selectedTool = 'hammer';
        this.onToolSelectCallback?.('hammer');
      });

      this.input.keyboard.on('keydown-ESC', () => {
        this.onOpenMenuCallback?.('inventory');
      });

      this.input.keyboard.on('keydown-I', () => {
        this.onOpenMenuCallback?.('inventory');
      });

      this.input.keyboard.on('keydown-S', () => {
        this.onOpenMenuCallback?.('shop');
      });

      this.input.keyboard.on('keydown-B', () => {
        this.onOpenMenuCallback?.('barn');
      });

      this.input.keyboard.on('keydown-K', () => {
        this.onOpenMenuCallback?.('kitchen');
      });
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      const gridX = Math.floor((worldPoint.x - 100) / TILE_SIZE);
      const gridY = Math.floor((worldPoint.y - 100) / TILE_SIZE);

      if (gridX >= 0 && gridX < FARM_GRID_WIDTH && gridY >= 0 && gridY < FARM_GRID_HEIGHT) {
        this.onPlotInteractCallback?.(gridX, gridY, this.selectedTool);
      }
    });
  }

  private setupCamera() {
    this.cameras.main.setBounds(
      0,
      0,
      FARM_GRID_WIDTH * TILE_SIZE + 200,
      FARM_GRID_HEIGHT * TILE_SIZE + 200
    );
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
  }

  private updatePlotTile(tile: PlotTile, plot: Plot) {
    if (plot.hasRock) {
      tile.sprite.fillColor = 0x808080;
      tile.sprite.strokeColor = 0x606060;
      if (!tile.cropSprite) {
        tile.cropSprite = this.add.text(
          tile.sprite.x + TILE_SIZE / 2,
          tile.sprite.y + TILE_SIZE / 2,
          '🪨',
          { fontSize: '16px' }
        );
        tile.cropSprite.setOrigin(0.5);
        this.farmGrid.add(tile.cropSprite);
      }
      return;
    }

    if (plot.hasWeed) {
      tile.sprite.fillColor = 0x228b22;
      if (!tile.cropSprite) {
        tile.cropSprite = this.add.text(
          tile.sprite.x + TILE_SIZE / 2,
          tile.sprite.y + TILE_SIZE / 2,
          '🌿',
          { fontSize: '16px' }
        );
        tile.cropSprite.setOrigin(0.5);
        this.farmGrid.add(tile.cropSprite);
      }
      return;
    }

    if (!plot.tilled) {
      tile.sprite.fillColor = 0x7cfc00;
      tile.sprite.strokeColor = 0x228b22;
      if (tile.cropSprite) {
        tile.cropSprite.destroy();
        tile.cropSprite = null;
      }
      return;
    }

    tile.sprite.fillColor = 0x8b4513;
    tile.sprite.strokeColor = 0x654321;

    if (plot.watered) {
      if (!tile.waterIndicator) {
        tile.waterIndicator = this.add.rectangle(
          tile.sprite.x + 4,
          tile.sprite.y + 4,
          8,
          8,
          0x87ceeb
        );
        tile.waterIndicator.setOrigin(0);
        this.farmGrid.add(tile.waterIndicator);
      }
    } else {
      if (tile.waterIndicator) {
        tile.waterIndicator.destroy();
        tile.waterIndicator = null;
      }
    }

    if (plot.crop) {
      if (!tile.cropSprite) {
        tile.cropSprite = this.add.text(
          tile.sprite.x + TILE_SIZE / 2,
          tile.sprite.y + TILE_SIZE / 2,
          '',
          { fontSize: '18px' }
        );
        tile.cropSprite.setOrigin(0.5);
        this.farmGrid.add(tile.cropSprite);
      }

      const growthEmoji = this.getCropGrowthEmoji(plot.crop.currentStage, plot.crop.ready);
      tile.cropSprite.setText(growthEmoji);
    } else {
      if (tile.cropSprite) {
        tile.cropSprite.destroy();
        tile.cropSprite = null;
      }
    }
  }

  private getCropGrowthEmoji(stage: number, ready: boolean): string {
    if (ready) return '🌾';
    if (stage >= 4) return '🌿';
    if (stage >= 2) return '🌱';
    return '·';
  }

  private updateFarmColor() {
    const color = SEASON_COLORS[this.currentSeason];
    this.cameras.main.setBackgroundColor(color);
  }

  update() {
    if (this.isPaused) return;

    this.playerDirection.set(0, 0);

    if (this.cursors.up?.isDown) {
      this.playerDirection.y = -1;
    } else if (this.cursors.down?.isDown) {
      this.playerDirection.y = 1;
    }

    if (this.cursors.left?.isDown) {
      this.playerDirection.x = -1;
    } else if (this.cursors.right?.isDown) {
      this.playerDirection.x = 1;
    }

    if (this.playerDirection.length() > 0) {
      this.playerDirection.normalize();
      this.player.x += this.playerDirection.x * PLAYER_SPEED * (this.game.loop.delta / 1000);
      this.player.y += this.playerDirection.y * PLAYER_SPEED * (this.game.loop.delta / 1000);
    }
  }
}
