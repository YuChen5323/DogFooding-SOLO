import { vec3, vec4, quat } from 'gl-matrix';
import { World } from './ecs';
import {
  createTransform,
  createPerspectiveCamera,
  createDirectionalLight,
  createPointLight,
  createSnakeComponent,
  createFoodComponent,
  createBoxMesh,
  createSphereMesh,
  createStandardMaterial,
  createEmissiveMaterial,
  TransformComponent,
  SnakeComponent,
  MeshComponent,
} from './components';
import {
  OrbitCameraSystem,
  SnakeMovementSystem,
  SnakeMeshSystem,
  SnakeCollisionSystem,
  InputSystem,
  RenderSystem,
  UISystem,
} from './systems';
import { WebGPURenderer } from './renderer/WebGPURenderer';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface LevelData {
  width: number;
  height: number;
  depth: number;
  cells: CellData[];
  tiles: TileData[];
  snake_start: [number, number, number];
  food_position: [number, number, number];
}

interface CellData {
  x: number;
  y: number;
  z: number;
  possible_tiles: number[];
  collapsed: boolean;
  tile_id: number | null;
}

interface TileData {
  id: number;
  name: string;
  weight: number;
  connections: number[][];
}

class Game {
  private world: World;
  private renderer: WebGPURenderer;
  private canvas: HTMLCanvasElement;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private inputSystem: InputSystem;
  private snakeMovementSystem: SnakeMovementSystem;
  private cameraSystem: OrbitCameraSystem;
  private uiSystem: UISystem;
  private snakeEntityId: number | null = null;
  private cameraEntityId: number | null = null;
  private levelData: LevelData | null = null;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.canvas = canvas;
    this.world = new World();
    this.renderer = new WebGPURenderer(canvas);

    this.inputSystem = new InputSystem(canvas);
    this.snakeMovementSystem = new SnakeMovementSystem();
    this.cameraSystem = new OrbitCameraSystem();
    this.uiSystem = new UISystem(overlay);

    this.inputSystem.setCameraSystem(this.cameraSystem);
  }

  async initialize(): Promise<boolean> {
    const rendererInitialized = await this.renderer.initialize();
    if (!rendererInitialized) {
      console.error('Failed to initialize WebGPU renderer');
      return false;
    }

    await this.loadLevel();

    this.setupWorld();

    this.setupEventListeners();

    return true;
  }

  private async loadLevel(): Promise<void> {
    try {
      this.levelData = await invoke<LevelData>('generate_level', {
        width: 15,
        height: 5,
        depth: 15,
      });
      console.log('Level generated successfully');
    } catch (error) {
      console.warn('Failed to generate level from backend, using fallback:', error);
      this.levelData = this.createFallbackLevel();
    }
  }

  private createFallbackLevel(): LevelData {
    const cells: CellData[] = [];
    const width = 15;
    const height = 5;
    const depth = 15;

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const isWall =
            x === 0 ||
            x === width - 1 ||
            z === 0 ||
            z === depth - 1 ||
            y === height - 1 ||
            (y === 0 &&
              x > 2 &&
              x < width - 3 &&
              z > 2 &&
              z < depth - 3 &&
              Math.random() > 0.85);

          cells.push({
            x,
            y,
            z,
            possible_tiles: isWall ? [1] : [0],
            collapsed: true,
            tile_id: isWall ? 1 : 0,
          });
        }
      }
    }

    return {
      width,
      height,
      depth,
      cells,
      tiles: [
        {
          id: 0,
          name: 'floor',
          weight: 1.0,
          connections: [[], [], [], [], [], []],
        },
        {
          id: 1,
          name: 'wall',
          weight: 0.3,
          connections: [[], [], [], [], [], []],
        },
      ],
      snake_start: [7, 1, 7],
      food_position: [10, 1, 10],
    };
  }

  private setupWorld(): void {
    this.createCamera();
    this.createLights();
    this.createLevelGeometry();
    this.createSnake();
    this.createFood();

    const renderSystem = new RenderSystem(this.renderer, this.canvas);

    this.world.addSystem(this.inputSystem);
    this.world.addSystem(this.cameraSystem);
    this.world.addSystem(this.snakeMovementSystem);
    this.world.addSystem(new SnakeMeshSystem());
    this.world.addSystem(new SnakeCollisionSystem());
    this.world.addSystem(renderSystem);
    this.world.addSystem(this.uiSystem);

    this.world.init();
  }

  private createCamera(): void {
    this.cameraEntityId = this.world.createEntity('MainCamera');

    const camera = createPerspectiveCamera(
      Math.PI / 3,
      0.1,
      1000,
      this.canvas.width / this.canvas.height
    );

    const transform = createTransform(
      vec3.fromValues(10, 15, 10),
      quat.create(),
      vec3.fromValues(1, 1, 1)
    );

    this.world.addComponent(this.cameraEntityId, camera);
    this.world.addComponent(this.cameraEntityId, transform);

    this.cameraSystem.setTarget(this.snakeEntityId!);
  }

  private createLights(): void {
    const directionalLightId = this.world.createEntity('DirectionalLight');
    const directionalLight = createDirectionalLight(
      vec3.fromValues(1.0, 0.95, 0.85),
      1.5,
      true
    );
    const dirTransform = createTransform(
      vec3.fromValues(0, 20, 0),
      quat.fromEuler(quat.create(), -Math.PI / 4, Math.PI / 6, 0),
      vec3.fromValues(1, 1, 1)
    );
    this.world.addComponent(directionalLightId, directionalLight);
    this.world.addComponent(directionalLightId, dirTransform);

    const ambientLightId = this.world.createEntity('AmbientLight');
    const ambientLight = createPointLight(
      vec3.fromValues(0.3, 0.35, 0.5),
      0.3,
      50
    );
    const ambientTransform = createTransform(
      vec3.fromValues(7, 5, 7),
      quat.create(),
      vec3.fromValues(1, 1, 1)
    );
    this.world.addComponent(ambientLightId, ambientLight);
    this.world.addComponent(ambientLightId, ambientTransform);
  }

  private createLevelGeometry(): void {
    if (!this.levelData) return;

    const floorMaterial = createStandardMaterial(
      vec4.fromValues(0.2, 0.3, 0.4, 1.0),
      0.0,
      0.8
    );

    const wallMaterial = createStandardMaterial(
      vec4.fromValues(0.4, 0.4, 0.45, 1.0),
      0.1,
      0.6
    );

    for (const cell of this.levelData.cells) {
      if (cell.tile_id === null) continue;

      const tile = this.levelData.tiles[cell.tile_id];
      const isWall = tile.name === 'wall';

      const entityId = this.world.createEntity(`${tile.name}_${cell.x}_${cell.y}_${cell.z}`);

      const transform = createTransform(
        vec3.fromValues(cell.x, cell.y, cell.z),
        quat.create(),
        vec3.fromValues(1, 1, 1)
      );

      const meshData = createBoxMesh(1, 1, 1);
      const mesh: MeshComponent = {
        type: 'Mesh',
        meshData,
        visible: true,
        castShadow: isWall,
        receiveShadow: true,
      };

      this.world.addComponent(entityId, transform);
      this.world.addComponent(entityId, mesh);
      this.world.addComponent(entityId, isWall ? wallMaterial : floorMaterial);
    }
  }

  private createSnake(): void {
    this.snakeEntityId = this.world.createEntity('Snake');

    let startPos: vec3;
    if (this.levelData) {
      startPos = vec3.fromValues(
        this.levelData.snake_start[0],
        this.levelData.snake_start[1],
        this.levelData.snake_start[2]
      );
    } else {
      startPos = vec3.fromValues(7, 1, 7);
    }

    const snake = createSnakeComponent(startPos, 3, 5.0);
    const transform = createTransform(
      vec3.clone(startPos),
      quat.create(),
      vec3.fromValues(1, 1, 1)
    );

    this.world.addComponent(this.snakeEntityId, snake);
    this.world.addComponent(this.snakeEntityId, transform);

    if (this.cameraEntityId) {
      this.cameraSystem.setTarget(this.snakeEntityId);
    }
  }

  private createFood(): void {
    let foodPos: vec3;
    if (this.levelData) {
      foodPos = vec3.fromValues(
        this.levelData.food_position[0],
        this.levelData.food_position[1],
        this.levelData.food_position[2]
      );
    } else {
      foodPos = vec3.fromValues(10, 1, 10);
    }

    const foodEntityId = this.world.createEntity('Food');

    const food = createFoodComponent(foodPos, 10, 'Normal');
    const transform = createTransform(
      vec3.clone(foodPos),
      quat.create(),
      vec3.fromValues(0.6, 0.6, 0.6)
    );

    const meshData = createSphereMesh(0.5, 16, 8);
    const mesh: MeshComponent = {
      type: 'Mesh',
      meshData,
      visible: true,
      castShadow: true,
      receiveShadow: false,
    };

    const material = createEmissiveMaterial(
      vec3.fromValues(1.0, 0.5, 0.2),
      2.0
    );

    this.world.addComponent(foodEntityId, food);
    this.world.addComponent(foodEntityId, transform);
    this.world.addComponent(foodEntityId, mesh);
    this.world.addComponent(foodEntityId, material);
  }

  private setupEventListeners(): void {
    listen('menu-event', (event) => {
      const action = event.payload as string;
      switch (action) {
        case 'new-game':
          this.newGame();
          break;
        case 'save-game':
          this.saveGame();
          break;
        case 'open-game':
          this.loadGame();
          break;
      }
    });
  }

  private newGame(): void {
    this.world.destroy();
    this.world = new World();
    this.loadLevel().then(() => {
      this.setupWorld();
    });
  }

  private async saveGame(): Promise<void> {
    try {
      const snakeQuery = this.world.query(['Snake', 'Transform']);
      const snakeEntities = snakeQuery.entities();

      if (snakeEntities.length === 0) return;

      const snake = this.world.getComponent<SnakeComponent>(snakeEntities[0], 'Snake');
      const transform = this.world.getComponent<TransformComponent>(snakeEntities[0], 'Transform');

      if (!snake || !transform) return;

      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        level_data: {
          width: this.levelData?.width || 15,
          height: this.levelData?.height || 5,
          depth: this.levelData?.depth || 15,
          cells: [],
          tiles: [],
        },
        snake_data: {
          segments: snake.segments.map((seg) => ({
            position: [seg.position[0], seg.position[1], seg.position[2]],
            rotation: [seg.rotation[0], seg.rotation[1], seg.rotation[2], seg.rotation[3]],
          })),
          direction: [snake.direction[0], snake.direction[1], snake.direction[2]],
          speed: snake.speed,
        },
        game_state: {
          score: snake.score,
          level: snake.level,
          lives: 3,
          food_position: [0, 0, 0],
          is_paused: this.uiSystem.isPaused(),
          is_game_over: !snake.isAlive,
        },
      };

      await invoke('save_game', {
        saveData,
        filename: `save_${Date.now()}`,
      });

      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  private async loadGame(): Promise<void> {
    try {
      const saves = await invoke<string[]>('list_saves');
      if (saves.length === 0) {
        console.log('No saves found');
        return;
      }

      const latestSave = saves[saves.length - 1];
      const saveData = await invoke('load_game', { filename: latestSave });

      console.log('Game loaded successfully:', saveData);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    const isPaused = this.world.getResource<boolean>('IsPaused') || false;
    const gameStarted = this.world.getResource<boolean>('GameStarted') || false;

    if (gameStarted && !isPaused) {
      const direction = this.world.getResource<vec3>('SnakeDirection');
      if (direction) {
        this.snakeMovementSystem.setInputDirection(direction);
      }

      this.world.update(deltaTime);
    }

    this.world.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    this.world.destroy();
  }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const overlay = document.getElementById('ui-overlay') as HTMLElement;

  if (!canvas || !overlay) {
    console.error('Required DOM elements not found');
    return;
  }

  const game = new Game(canvas, overlay);
  const initialized = await game.initialize();

  if (initialized) {
    game.start();
  } else {
    overlay.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
        font-family: sans-serif;
      ">
        <h1 style="font-size: 36px; margin-bottom: 20px;">WebGPU Not Supported</h1>
        <p style="font-size: 18px;">
          请使用支持 WebGPU 的浏览器运行此游戏。<br/>
          推荐使用 Chrome 113+ 或 Edge 113+。
        </p>
      </div>
    `;
  }
}

main();
