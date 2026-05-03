import { World, System } from '../ecs';
import { SnakeComponent } from '../components';

export interface UIElements {
  scoreDisplay: HTMLElement | null;
  levelDisplay: HTMLElement | null;
  livesDisplay: HTMLElement | null;
  pauseMenu: HTMLElement | null;
  gameOverScreen: HTMLElement | null;
  startScreen: HTMLElement | null;
  hudContainer: HTMLElement | null;
}

export class UISystem extends System {
  private uiElements: UIElements;
  private overlay: HTMLElement;
  private paused: boolean = false;
  private gameStarted: boolean = false;

  constructor(overlay: HTMLElement) {
    super('UISystem', 200);
    this.overlay = overlay;
    this.uiElements = {
      scoreDisplay: null,
      levelDisplay: null,
      livesDisplay: null,
      pauseMenu: null,
      gameOverScreen: null,
      startScreen: null,
      hudContainer: null,
    };

    this.createUI();
  }

  private createUI(): void {
    this.overlay.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        #game-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        #ui-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
        }
        
        #ui-overlay > * {
          pointer-events: auto;
        }
        
        .hud-container {
          position: absolute;
          top: 20px;
          left: 20px;
          color: white;
          font-size: 18px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .hud-item {
          margin-bottom: 10px;
          background: rgba(0, 0, 0, 0.5);
          padding: 10px 20px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .hud-label {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        
        .hud-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .score-value {
          color: #4ade80;
        }
        
        .level-value {
          color: #60a5fa;
        }
        
        .screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }
        
        .screen-title {
          font-size: 72px;
          font-weight: bold;
          color: white;
          text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
          margin-bottom: 20px;
          background: linear-gradient(135deg, #4ade80, #60a5fa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .screen-subtitle {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
        }
        
        .screen-button {
          padding: 15px 50px;
          font-size: 20px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
        }
        
        .screen-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(74, 222, 128, 0.6);
        }
        
        .screen-button:active {
          transform: translateY(0);
        }
        
        .game-over-score {
          font-size: 36px;
          color: #fbbf24;
          margin-bottom: 30px;
        }
        
        .controls-hint {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          text-align: center;
        }
        
        .controls-hint span {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          margin: 0 2px;
          font-family: monospace;
        }
        
        .hidden {
          display: none !important;
        }
      </style>
      
      <div class="hud-container" id="hud-container">
        <div class="hud-item">
          <div class="hud-label">得分</div>
          <div class="hud-value score-value" id="score-display">0</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">关卡</div>
          <div class="hud-value level-value" id="level-display">1</div>
        </div>
      </div>
      
      <div class="screen" id="start-screen">
        <div class="screen-title">Snake Dimension</div>
        <div class="screen-subtitle">3D贪吃蛇解谜冒险</div>
        <button class="screen-button" id="start-button">开始游戏</button>
        <div class="controls-hint">
          <span>W</span><span>A</span><span>S</span><span>D</span> 移动 | 
          <span>Q</span><span>E</span> 上下移动 |
          鼠标右键 旋转相机 | 滚轮 缩放
        </div>
      </div>
      
      <div class="screen hidden" id="game-over-screen">
        <div class="screen-title" style="color: #ef4444;">游戏结束</div>
        <div class="game-over-score">最终得分: <span id="final-score">0</span></div>
        <button class="screen-button" id="restart-button">重新开始</button>
      </div>
      
      <div class="screen hidden" id="pause-menu">
        <div class="screen-title" style="font-size: 48px;">暂停</div>
        <button class="screen-button" id="resume-button" style="margin-bottom: 15px;">继续游戏</button>
        <button class="screen-button" id="quit-button" style="background: linear-gradient(135deg, #f87171, #ef4444);">退出游戏</button>
      </div>
    `;

    this.uiElements.scoreDisplay = document.getElementById('score-display');
    this.uiElements.levelDisplay = document.getElementById('level-display');
    this.uiElements.pauseMenu = document.getElementById('pause-menu');
    this.uiElements.gameOverScreen = document.getElementById('game-over-screen');
    this.uiElements.startScreen = document.getElementById('start-screen');
    this.uiElements.hudContainer = document.getElementById('hud-container');

    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }

    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => this.restartGame());
    }

    const resumeButton = document.getElementById('resume-button');
    if (resumeButton) {
      resumeButton.addEventListener('click', () => this.togglePause());
    }

    const quitButton = document.getElementById('quit-button');
    if (quitButton) {
      quitButton.addEventListener('click', () => this.quitGame());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.gameStarted) {
        this.togglePause();
      }
    });

    if (this.uiElements.hudContainer) {
      this.uiElements.hudContainer.classList.add('hidden');
    }
  }

  private startGame(): void {
    this.gameStarted = true;
    if (this.uiElements.startScreen) {
      this.uiElements.startScreen.classList.add('hidden');
    }
    if (this.uiElements.hudContainer) {
      this.uiElements.hudContainer.classList.remove('hidden');
    }

    const world = this.getWorld();
    if (world) {
      world.setResource('GameStarted', true);
    }
  }

  private restartGame(): void {
    if (this.uiElements.gameOverScreen) {
      this.uiElements.gameOverScreen.classList.add('hidden');
    }
    if (this.uiElements.hudContainer) {
      this.uiElements.hudContainer.classList.remove('hidden');
    }

    const world = this.getWorld();
    if (world) {
      world.setResource('RestartGame', true);
    }
  }

  private togglePause(): void {
    this.paused = !this.paused;

    if (this.uiElements.pauseMenu) {
      if (this.paused) {
        this.uiElements.pauseMenu.classList.remove('hidden');
      } else {
        this.uiElements.pauseMenu.classList.add('hidden');
      }
    }

    const world = this.getWorld();
    if (world) {
      world.setResource('IsPaused', this.paused);
    }
  }

  private quitGame(): void {
    window.close();
  }

  onUpdate(world: World, _deltaTime: number): void {
    const snakeQuery = world.query(['Snake']);
    const snakeEntities = snakeQuery.entities();

    if (snakeEntities.length > 0) {
      const snake = world.getComponent<SnakeComponent>(snakeEntities[0], 'Snake');

      if (snake) {
        if (this.uiElements.scoreDisplay) {
          this.uiElements.scoreDisplay.textContent = snake.score.toString();
        }
        if (this.uiElements.levelDisplay) {
          this.uiElements.levelDisplay.textContent = snake.level.toString();
        }

        if (!snake.isAlive) {
          this.showGameOver(snake.score);
        }
      }
    }

    const gameOver = world.getResource<boolean>('GameOver');
    if (gameOver) {
      const snakeQuery = world.query(['Snake']);
      const snakeEntities = snakeQuery.entities();
      if (snakeEntities.length > 0) {
        const snake = world.getComponent<SnakeComponent>(snakeEntities[0], 'Snake');
        if (snake) {
          this.showGameOver(snake.score);
        }
      }
    }
  }

  private showGameOver(score: number): void {
    if (this.uiElements.gameOverScreen) {
      this.uiElements.gameOverScreen.classList.remove('hidden');
    }
    if (this.uiElements.hudContainer) {
      this.uiElements.hudContainer.classList.add('hidden');
    }

    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
      finalScoreElement.textContent = score.toString();
    }
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private getWorld(): World | null {
    return null;
  }
}
