import { vec3 } from 'gl-matrix';
import { World, System } from '../ecs';
import { OrbitCameraSystem } from './CameraSystem';

export interface InputState {
  keys: { [key: string]: boolean };
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    buttons: { left: boolean; middle: boolean; right: boolean };
  };
  scroll: { deltaX: number; deltaY: number };
}

export class InputSystem extends System {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private direction: vec3 = vec3.create();
  private cameraSystem: OrbitCameraSystem | null = null;

  constructor(canvas: HTMLCanvasElement) {
    super('InputSystem', 10);
    this.canvas = canvas;
    this.inputState = {
      keys: {},
      mouse: {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        buttons: { left: false, middle: false, right: false },
      },
      scroll: { deltaX: 0, deltaY: 0 },
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.inputState.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.inputState.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      this.inputState.mouse.deltaX = newX - this.inputState.mouse.x;
      this.inputState.mouse.deltaY = newY - this.inputState.mouse.y;
      this.inputState.mouse.x = newX;
      this.inputState.mouse.y = newY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.inputState.mouse.buttons.left = true;
      if (e.button === 1) this.inputState.mouse.buttons.middle = true;
      if (e.button === 2) this.inputState.mouse.buttons.right = true;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.inputState.mouse.buttons.left = false;
      if (e.button === 1) this.inputState.mouse.buttons.middle = false;
      if (e.button === 2) this.inputState.mouse.buttons.right = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.inputState.scroll.deltaX += e.deltaX;
      this.inputState.scroll.deltaY += e.deltaY;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  setCameraSystem(system: OrbitCameraSystem): void {
    this.cameraSystem = system;
  }

  onUpdate(world: World, _deltaTime: number): void {
    vec3.set(this.direction, 0, 0, 0);

    if (this.inputState.keys['w'] || this.inputState.keys['arrowup']) {
      this.direction[2] = -1;
    }
    if (this.inputState.keys['s'] || this.inputState.keys['arrowdown']) {
      this.direction[2] = 1;
    }
    if (this.inputState.keys['a'] || this.inputState.keys['arrowleft']) {
      this.direction[0] = -1;
    }
    if (this.inputState.keys['d'] || this.inputState.keys['arrowright']) {
      this.direction[0] = 1;
    }
    if (this.inputState.keys['q']) {
      this.direction[1] = -1;
    }
    if (this.inputState.keys['e']) {
      this.direction[1] = 1;
    }

    if (vec3.length(this.direction) > 0.0001) {
      vec3.normalize(this.direction, this.direction);
      world.setResource('SnakeDirection', vec3.clone(this.direction));
    }

    if (this.cameraSystem) {
      if (this.inputState.mouse.buttons.right) {
        const sensitivity = 0.005;
        this.cameraSystem.rotate(
          this.inputState.mouse.deltaX * sensitivity,
          this.inputState.mouse.deltaY * sensitivity
        );
      }

      if (this.inputState.scroll.deltaY !== 0) {
        const zoomSpeed = 0.01;
        this.cameraSystem.zoom(this.inputState.scroll.deltaY * zoomSpeed);
      }
    }

    this.inputState.mouse.deltaX = 0;
    this.inputState.mouse.deltaY = 0;
    this.inputState.scroll.deltaX = 0;
    this.inputState.scroll.deltaY = 0;
  }

  isKeyPressed(key: string): boolean {
    return this.inputState.keys[key.toLowerCase()] || false;
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.inputState.mouse.x, y: this.inputState.mouse.y };
  }

  getDirection(): vec3 {
    return vec3.clone(this.direction);
  }
}
