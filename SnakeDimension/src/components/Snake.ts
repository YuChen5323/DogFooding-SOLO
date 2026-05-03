import { IComponent } from '../ecs';
import { vec3, quat } from 'gl-matrix';

export interface SnakeSegment {
  position: vec3;
  rotation: quat;
  targetPosition: vec3;
}

export interface SnakeComponent extends IComponent {
  type: 'Snake';
  segments: SnakeSegment[];
  direction: vec3;
  speed: number;
  length: number;
  maxLength: number;
  moveTimer: number;
  moveInterval: number;
  isAlive: boolean;
  score: number;
  level: number;
}

export function createSnakeComponent(
  startPosition: vec3,
  initialLength: number = 3,
  speed: number = 5.0
): SnakeComponent {
  const segments: SnakeSegment[] = [];

  for (let i = 0; i < initialLength; i++) {
    const segmentPos = vec3.fromValues(
      startPosition[0] - i * 1.0,
      startPosition[1],
      startPosition[2]
    );
    segments.push({
      position: vec3.clone(segmentPos),
      rotation: quat.create(),
      targetPosition: vec3.clone(segmentPos),
    });
  }

  return {
    type: 'Snake',
    segments,
    direction: vec3.fromValues(1, 0, 0),
    speed,
    length: initialLength,
    maxLength: 100,
    moveTimer: 0,
    moveInterval: 0.3,
    isAlive: true,
    score: 0,
    level: 1,
  };
}

export function growSnake(snake: SnakeComponent, amount: number = 1): void {
  for (let i = 0; i < amount && snake.length < snake.maxLength; i++) {
    const lastSegment = snake.segments[snake.segments.length - 1];
    snake.segments.push({
      position: vec3.clone(lastSegment.position),
      rotation: quat.clone(lastSegment.rotation),
      targetPosition: vec3.clone(lastSegment.targetPosition),
    });
    snake.length++;
  }
}

export function changeDirection(snake: SnakeComponent, newDirection: vec3): void {
  const dotProduct = vec3.dot(snake.direction, newDirection);
  if (Math.abs(dotProduct) < 0.9) {
    vec3.normalize(snake.direction, newDirection);
  }
}
