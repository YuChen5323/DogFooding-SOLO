import { vec3, vec4, quat, mat4 } from 'gl-matrix';
import { World, System } from '../ecs';
import {
  SnakeComponent,
  SnakeSegment,
  TransformComponent,
  createTransform,
  createStandardMaterial,
  MeshComponent,
} from '../components';
import { createSnakeBodyMesh } from '../renderer/CatmullRom';

export class SnakeMovementSystem extends System {
  private inputDirection: vec3 = vec3.fromValues(0, 0, 0);

  constructor() {
    super('SnakeMovementSystem', 50);
  }

  setInputDirection(direction: vec3): void {
    this.inputDirection = vec3.clone(direction);
  }

  onUpdate(world: World, _deltaTime: number): void {
    const snakeQuery = world.query(['Snake', 'Transform']);
    const snakeEntities = snakeQuery.entities();

    for (const entityId of snakeEntities) {
      const snake = world.getComponent<SnakeComponent>(entityId, 'Snake');
      const transform = world.getComponent<TransformComponent>(entityId, 'Transform');

      if (!snake || !transform || !snake.isAlive) {
        continue;
      }

      if (vec3.length(this.inputDirection) > 0.0001) {
        const dot = vec3.dot(snake.direction, this.inputDirection);
        if (dot > -0.9) {
          vec3.copy(snake.direction, this.inputDirection);
        }
      }

      snake.moveTimer += _deltaTime;

      while (snake.moveTimer >= snake.moveInterval) {
        snake.moveTimer -= snake.moveInterval;
        this.moveSnake(snake);
      }

      if (snake.segments.length > 0) {
        vec3.copy(transform.position, snake.segments[0].position);
        transform.dirty = true;
      }
    }
  }

  private moveSnake(snake: SnakeComponent): void {
    if (snake.segments.length === 0) return;

    const head = snake.segments[0];
    const newHeadPos = vec3.clone(head.position);
    vec3.scaleAndAdd(newHeadPos, newHeadPos, snake.direction, 1.0);

    for (let i = snake.segments.length - 1; i > 0; i--) {
      const current = snake.segments[i];
      const previous = snake.segments[i - 1];
      vec3.copy(current.position, previous.position);
    }

    vec3.copy(head.position, newHeadPos);
    vec3.copy(head.targetPosition, newHeadPos);

    const forward = vec3.clone(snake.direction);
    const up = vec3.fromValues(0, 1, 0);
    const right = vec3.create();
    vec3.cross(right, forward, up);

    if (vec3.length(right) < 0.0001) {
      vec3.set(right, 1, 0, 0);
    } else {
      vec3.normalize(right, right);
    }

    const actualUp = vec3.create();
    vec3.cross(actualUp, right, forward);
    vec3.normalize(actualUp, actualUp);

    const rotationMatrix = mat4.create();
    mat4.targetTo(rotationMatrix, vec3.create(), forward, actualUp);
    mat4.getRotation(head.rotation, rotationMatrix);
  }
}

export class SnakeMeshSystem extends System {
  private snakeMeshEntityId: number | null = null;
  private radius: number = 0.4;
  private radialSegments: number = 12;
  private tubularPerSegment: number = 8;

  constructor() {
    super('SnakeMeshSystem', 60);
  }

  onInit(world: World): void {
    if (this.snakeMeshEntityId === null) {
      const meshId = world.createEntity('SnakeMesh');
      world.addComponent(meshId, createTransform());

      const dummyMesh: MeshComponent = {
        type: 'Mesh',
        meshData: {
          vertices: [],
          indices: [],
          indexCount: 0,
        },
        visible: true,
        castShadow: true,
        receiveShadow: true,
      };
      world.addComponent(meshId, dummyMesh);

      const material = createStandardMaterial(
        vec4.fromValues(0.2, 0.8, 0.3, 1.0),
        0.0,
        0.6
      );
      world.addComponent(meshId, material);

      this.snakeMeshEntityId = meshId;
    }
  }

  onUpdate(world: World, _deltaTime: number): void {
    const snakeQuery = world.query(['Snake']);
    const snakeEntities = snakeQuery.entities();

    if (snakeEntities.length === 0 || this.snakeMeshEntityId === null) {
      return;
    }

    const snakeEntityId = snakeEntities[0];
    const snake = world.getComponent<SnakeComponent>(snakeEntityId, 'Snake');

    if (!snake) {
      return;
    }

    const segments = snake.segments.map((seg) => vec3.clone(seg.position));

    if (segments.length < 2) {
      return;
    }

    const meshData = createSnakeBodyMesh(
      segments,
      this.radius,
      this.radialSegments,
      this.tubularPerSegment
    );

    const meshComponent: MeshComponent = {
      type: 'Mesh',
      meshData,
      visible: true,
      castShadow: true,
      receiveShadow: true,
    };

    const existingMesh = world.getComponent<MeshComponent>(this.snakeMeshEntityId, 'Mesh');
    if (existingMesh) {
      existingMesh.meshData = meshData;
    } else {
      world.addComponent(this.snakeMeshEntityId, meshComponent);
    }

    const snakeTransform = world.getComponent<TransformComponent>(snakeEntityId, 'Transform');
    const meshTransform = world.getComponent<TransformComponent>(this.snakeMeshEntityId, 'Transform');

    if (snakeTransform && meshTransform) {
      vec3.copy(meshTransform.position, snakeTransform.position);
      quat.copy(meshTransform.rotation, snakeTransform.rotation);
      meshTransform.dirty = true;
    }
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  setRadialSegments(segments: number): void {
    this.radialSegments = segments;
  }

  setTubularPerSegment(count: number): void {
    this.tubularPerSegment = count;
  }
}

export class SnakeCollisionSystem extends System {
  constructor() {
    super('SnakeCollisionSystem', 40);
  }

  onUpdate(world: World, _deltaTime: number): void {
    const snakeQuery = world.query(['Snake', 'Transform']);
    const snakeEntities = snakeQuery.entities();

    if (snakeEntities.length === 0) {
      return;
    }

    const snakeEntityId = snakeEntities[0];
    const snake = world.getComponent<SnakeComponent>(snakeEntityId, 'Snake');

    if (!snake || !snake.isAlive || snake.segments.length < 2) {
      return;
    }

    const headPos = snake.segments[0].position;

    for (let i = 2; i < snake.segments.length; i++) {
      const segmentPos = snake.segments[i].position;
      const distance = vec3.distance(headPos, segmentPos);

      if (distance < 0.5) {
        snake.isAlive = false;
        world.setResource('GameOver', true);
        break;
      }
    }

    const foodQuery = world.query(['Food', 'Transform']);
    const foodEntities = foodQuery.entities();

    for (const foodEntityId of foodEntities) {
      const foodTransform = world.getComponent<TransformComponent>(foodEntityId, 'Transform');

      if (!foodTransform) {
        continue;
      }

      const distance = vec3.distance(headPos, foodTransform.position);

      if (distance < 1.0) {
        snake.score += 10;
        growSnake(snake, 1);

        if (snake.score % 50 === 0) {
          snake.level++;
          snake.moveInterval = Math.max(0.1, snake.moveInterval - 0.02);
        }

        world.setResource('FoodCollected', foodEntityId);
        world.destroyEntity(foodEntityId);
      }
    }
  }
}

function growSnake(snake: SnakeComponent, amount: number): void {
  for (let i = 0; i < amount; i++) {
    const lastSegment = snake.segments[snake.segments.length - 1];
    const newSegment: SnakeSegment = {
      position: vec3.clone(lastSegment.position),
      rotation: quat.clone(lastSegment.rotation),
      targetPosition: vec3.clone(lastSegment.targetPosition),
    };
    snake.segments.push(newSegment);
    snake.length++;
  }
}
