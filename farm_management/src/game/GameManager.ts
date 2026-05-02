import Phaser from 'phaser';
import { GAME_CONFIG, GAME_MINUTES_PER_REAL_SECOND } from './config';
import { MainScene } from './scenes/MainScene';
import { store } from '@/store';
import { updateTime, setPause, advanceDay } from '@/store/slices/timeSlice';
import { resetDay, incrementDaysPlayed } from '@/store/slices/statsSlice';
import { updateCropGrowth, resetWatering } from '@/store/slices/farmSlice';
import { updateAnimals } from '@/store/slices/barnSlice';

export class GameManager {
  private game!: Phaser.Game;
  private mainScene!: MainScene;
  private lastUpdateTime: number = 0;
  private dayProgress: number = 0;

  constructor() {
    this.initializeGame();
  }

  private initializeGame() {
    this.game = new Phaser.Game({
      ...GAME_CONFIG,
      scene: [MainScene],
    });

    this.game.events.once('ready', () => {
      this.mainScene = this.game.scene.getScene('MainScene') as MainScene;
      this.setupCallbacks();
      this.startGameLoop();
    });
  }

  private setupCallbacks() {
    if (this.mainScene) {
      this.mainScene.setCallbacks(
        this.handleToolSelect.bind(this),
        this.handlePlotInteract.bind(this),
        this.handleOpenMenu.bind(this)
      );
    }
  }

  private handleToolSelect(tool: string) {
    store.dispatch({ type: 'ui/selectTool', payload: tool });
  }

  private handlePlotInteract(x: number, y: number, tool: string) {
    const state = store.getState();
    const { ui, farm, time, inventory, stats } = state;
    
    switch (tool) {
      case 'hoe':
        if (stats.stamina >= 2) {
          store.dispatch({ type: 'farm/tillPlot', payload: { x, y } });
          store.dispatch({ type: 'stats/subtractStamina', payload: 2 });
        }
        break;
        
      case 'watering_can':
        if (stats.stamina >= 1) {
          store.dispatch({ type: 'farm/waterPlot', payload: { x, y } });
          store.dispatch({ type: 'stats/subtractStamina', payload: 1 });
        }
        break;
        
      case 'seed':
        const seedItems = inventory.items.filter(item => item.category === 'seed');
        if (seedItems.length > 0 && stats.stamina >= 1) {
          const seedItem = seedItems[0];
          const cropId = seedItem.itemId.replace('_seed', '');
          
          store.dispatch({ 
            type: 'farm/plantSeed', 
            payload: { x, y, cropId, currentTime: time } 
          });
          store.dispatch({ 
            type: 'inventory/removeItem', 
            payload: { itemId: seedItem.itemId, quantity: 1 } 
          });
          store.dispatch({ type: 'stats/subtractStamina', payload: 1 });
          store.dispatch({ 
            type: 'achievements/updateProgress', 
            payload: { type: 'crops', amount: 1, currentTime: time } 
          });
        }
        break;
        
      case 'hammer':
        const plot = farm.plots[y]?.[x];
        if (plot) {
          if (plot.hasRock && stats.stamina >= 5) {
            store.dispatch({ type: 'farm/removeRock', payload: { x, y } });
            store.dispatch({ type: 'stats/subtractStamina', payload: 5 });
          } else if (plot.hasWeed && stats.stamina >= 1) {
            store.dispatch({ type: 'farm/removeWeed', payload: { x, y } });
            store.dispatch({ type: 'stats/subtractStamina', payload: 1 });
          } else if (plot.crop?.ready && stats.stamina >= 1) {
            const cropId = plot.crop.cropId;
            store.dispatch({ type: 'farm/harvestCrop', payload: { x, y } });
            store.dispatch({ 
              type: 'inventory/addItem', 
              payload: { 
                itemId: cropId, 
                quantity: 1, 
                category: 'crop' 
              } 
            });
            store.dispatch({ type: 'stats/subtractStamina', payload: 1 });
            store.dispatch({ 
              type: 'achievements/updateProgress', 
              payload: { type: 'harvest', amount: 1, currentTime: time } 
            });
          }
        }
        break;
    }
  }

  private handleOpenMenu(menuType: string) {
    store.dispatch({ type: 'ui/openMenu', payload: menuType });
    store.dispatch({ type: 'time/setPause', payload: true });
  }

  private startGameLoop() {
    this.lastUpdateTime = performance.now();
    this.gameLoop();
  }

  private gameLoop() {
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const state = store.getState();
    
    if (!state.time.isPaused) {
      this.updateGameTime(deltaTime);
      this.updateScene();
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  private updateGameTime(deltaTime: number) {
    const state = store.getState();
    
    const minutesToAdd = deltaTime * GAME_MINUTES_PER_REAL_SECOND * state.time.timeSpeed;
    store.dispatch(updateTime({ minutes: minutesToAdd }));
    
    const newState = store.getState();
    if (newState.time.hour >= 2 && newState.time.hour < 6) {
      this.advanceNewDay();
    }
  }

  private advanceNewDay() {
    const state = store.getState();
    
    store.dispatch(resetWatering());
    store.dispatch(updateCropGrowth({ 
      currentSeason: state.time.season, 
      daysPassed: 1 
    }));
    store.dispatch(updateAnimals({ daysPassed: 1 }));
    store.dispatch(resetDay());
    store.dispatch(advanceDay());
    store.dispatch({ 
      type: 'achievements/updateProgress', 
      payload: { 
        type: 'days', 
        amount: 1, 
        currentTime: store.getState().time 
      } 
    });
  }

  private updateScene() {
    if (!this.mainScene) return;
    
    const state = store.getState();
    
    this.mainScene.setGameTime(state.time);
    this.mainScene.setSeason(state.time.season);
    this.mainScene.setPaused(state.time.isPaused);
    this.mainScene.setSelectedTool(state.ui.selectedTool);
    this.mainScene.updatePlots(state.farm.plots);
  }

  public getGame(): Phaser.Game {
    return this.game;
  }

  public getMainScene(): MainScene {
    return this.mainScene;
  }

  public destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}

let gameManager: GameManager | null = null;

export const getGameManager = (): GameManager => {
  if (!gameManager) {
    gameManager = new GameManager();
  }
  return gameManager;
};

export const destroyGameManager = () => {
  if (gameManager) {
    gameManager.destroy();
    gameManager = null;
  }
};
