import { vec3, mat4, quat } from 'gl-matrix';
import { World, System } from '../ecs';
import { CameraComponent, TransformComponent } from '../components';

export interface OrbitCameraConfig {
  distance: number;
  minDistance: number;
  maxDistance: number;
  azimuth: number;
  polar: number;
  minPolar: number;
  maxPolar: number;
  targetOffset: vec3;
  smoothness: number;
}

export const DEFAULT_ORBIT_CONFIG: OrbitCameraConfig = {
  distance: 10,
  minDistance: 3,
  maxDistance: 30,
  azimuth: 0,
  polar: Math.PI / 4,
  minPolar: 0.1,
  maxPolar: Math.PI / 2 - 0.1,
  targetOffset: vec3.fromValues(0, 2, 0),
  smoothness: 0.1,
};

export class OrbitCameraSystem extends System {
  private targetEntityId: number | null = null;
  private config: OrbitCameraConfig;
  private currentPosition: vec3;
  private currentTarget: vec3;
  private currentAzimuth: number;
  private currentPolar: number;
  private currentDistance: number;
  private inputDeltaAzimuth: number = 0;
  private inputDeltaPolar: number = 0;
  private inputDeltaDistance: number = 0;

  constructor(config?: Partial<OrbitCameraConfig>) {
    super('OrbitCameraSystem', 100);
    this.config = { ...DEFAULT_ORBIT_CONFIG, ...config };
    this.currentPosition = vec3.create();
    this.currentTarget = vec3.create();
    this.currentAzimuth = this.config.azimuth;
    this.currentPolar = this.config.polar;
    this.currentDistance = this.config.distance;
  }

  setTarget(entityId: number): void {
    this.targetEntityId = entityId;
  }

  clearTarget(): void {
    this.targetEntityId = null;
  }

  rotate(deltaAzimuth: number, deltaPolar: number): void {
    this.inputDeltaAzimuth += deltaAzimuth;
    this.inputDeltaPolar += deltaPolar;
  }

  zoom(deltaDistance: number): void {
    this.inputDeltaDistance += deltaDistance;
  }

  onUpdate(world: World, deltaTime: number): void {
    const cameraQuery = world.query(['Camera', 'Transform']);
    const cameraEntities = cameraQuery.entities();

    if (cameraEntities.length === 0) {
      return;
    }

    const cameraEntityId = cameraEntities[0];
    const camera = world.getComponent<CameraComponent>(cameraEntityId, 'Camera');
    const cameraTransform = world.getComponent<TransformComponent>(cameraEntityId, 'Transform');

    if (!camera || !cameraTransform) {
      return;
    }

    this.currentAzimuth += this.inputDeltaAzimuth;
    this.currentPolar = Math.max(
      this.config.minPolar,
      Math.min(this.config.maxPolar, this.currentPolar + this.inputDeltaPolar)
    );
    this.currentDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, this.currentDistance + this.inputDeltaDistance)
    );

    this.inputDeltaAzimuth = 0;
    this.inputDeltaPolar = 0;
    this.inputDeltaDistance = 0;

    let targetPosition = this.currentTarget;

    if (this.targetEntityId !== null) {
      const targetTransform = world.getComponent<TransformComponent>(this.targetEntityId, 'Transform');

      if (targetTransform) {
        const desiredTarget = vec3.clone(targetTransform.position);
        vec3.add(desiredTarget, desiredTarget, this.config.targetOffset);

        vec3.lerp(
          this.currentTarget,
          this.currentTarget,
          desiredTarget,
          1.0 - Math.pow(this.config.smoothness, deltaTime * 60)
        );

        targetPosition = this.currentTarget;
      }
    }

    const sinPolar = Math.sin(this.currentPolar);
    const cosPolar = Math.cos(this.currentPolar);
    const sinAzimuth = Math.sin(this.currentAzimuth);
    const cosAzimuth = Math.cos(this.currentAzimuth);

    const desiredPosition = vec3.fromValues(
      targetPosition[0] + this.currentDistance * sinPolar * sinAzimuth,
      targetPosition[1] + this.currentDistance * cosPolar,
      targetPosition[2] + this.currentDistance * sinPolar * cosAzimuth
    );

    vec3.lerp(
      this.currentPosition,
      this.currentPosition,
      desiredPosition,
      1.0 - Math.pow(this.config.smoothness, deltaTime * 60)
    );

    vec3.copy(cameraTransform.position, this.currentPosition);
    cameraTransform.dirty = true;

    const forward = vec3.create();
    vec3.subtract(forward, targetPosition, this.currentPosition);
    vec3.normalize(forward, forward);

    const up = vec3.fromValues(0, 1, 0);
    const right = vec3.create();
    vec3.cross(right, forward, up);
    vec3.normalize(right, right);

    const actualUp = vec3.create();
    vec3.cross(actualUp, right, forward);
    vec3.normalize(actualUp, actualUp);

    const rotationMatrix = mat4.create();
    mat4.lookAt(rotationMatrix, vec3.create(), forward, actualUp);
    mat4.getRotation(cameraTransform.rotation, rotationMatrix);
    cameraTransform.dirty = true;
  }

  getCameraPosition(): vec3 {
    return vec3.clone(this.currentPosition);
  }

  getTargetPosition(): vec3 {
    return vec3.clone(this.currentTarget);
  }

  getAzimuth(): number {
    return this.currentAzimuth;
  }

  getPolar(): number {
    return this.currentPolar;
  }

  getDistance(): number {
    return this.currentDistance;
  }

  setAzimuth(azimuth: number): void {
    this.currentAzimuth = azimuth;
  }

  setPolar(polar: number): void {
    this.currentPolar = Math.max(
      this.config.minPolar,
      Math.min(this.config.maxPolar, polar)
    );
  }

  setDistance(distance: number): void {
    this.currentDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, distance)
    );
  }
}

export class ThirdPersonCameraSystem extends System {
  private targetEntityId: number | null = null;
  private offset: vec3;
  private smoothness: number;
  private currentPosition: vec3;
  private currentRotation: quat;

  constructor(
    offset: vec3 = vec3.fromValues(0, 5, 10),
    smoothness: number = 0.05
  ) {
    super('ThirdPersonCameraSystem', 100);
    this.offset = vec3.clone(offset);
    this.smoothness = smoothness;
    this.currentPosition = vec3.create();
    this.currentRotation = quat.create();
  }

  setTarget(entityId: number): void {
    this.targetEntityId = entityId;
  }

  clearTarget(): void {
    this.targetEntityId = null;
  }

  onUpdate(world: World, deltaTime: number): void {
    const cameraQuery = world.query(['Camera', 'Transform']);
    const cameraEntities = cameraQuery.entities();

    if (cameraEntities.length === 0 || this.targetEntityId === null) {
      return;
    }

    const cameraEntityId = cameraEntities[0];
    const cameraTransform = world.getComponent<TransformComponent>(cameraEntityId, 'Transform');
    const targetTransform = world.getComponent<TransformComponent>(this.targetEntityId, 'Transform');

    if (!cameraTransform || !targetTransform) {
      return;
    }

    const targetForward = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(targetForward, targetForward, targetTransform.rotation);

    const targetUp = vec3.fromValues(0, 1, 0);
    vec3.transformQuat(targetUp, targetUp, targetTransform.rotation);

    const targetRight = vec3.create();
    vec3.cross(targetRight, targetForward, targetUp);

    const offsetWorld = vec3.create();
    vec3.scaleAndAdd(offsetWorld, offsetWorld, targetRight, this.offset[0]);
    vec3.scaleAndAdd(offsetWorld, offsetWorld, targetUp, this.offset[1]);
    vec3.scaleAndAdd(offsetWorld, offsetWorld, targetForward, this.offset[2]);

    const desiredPosition = vec3.create();
    vec3.add(desiredPosition, targetTransform.position, offsetWorld);

    const interpolation = 1.0 - Math.pow(this.smoothness, deltaTime * 60);
    vec3.lerp(this.currentPosition, this.currentPosition, desiredPosition, interpolation);

    vec3.copy(cameraTransform.position, this.currentPosition);
    cameraTransform.dirty = true;

    const lookAtPosition = vec3.clone(targetTransform.position);
    vec3.scaleAndAdd(lookAtPosition, lookAtPosition, targetUp, 2.0);

    const forward = vec3.create();
    vec3.subtract(forward, lookAtPosition, this.currentPosition);
    vec3.normalize(forward, forward);

    const up = vec3.fromValues(0, 1, 0);
    const right = vec3.create();
    vec3.cross(right, forward, up);
    vec3.normalize(right, right);

    const actualUp = vec3.create();
    vec3.cross(actualUp, right, forward);
    vec3.normalize(actualUp, actualUp);

    const rotationMatrix = mat4.create();
    mat4.lookAt(rotationMatrix, vec3.create(), forward, actualUp);
    const desiredRotation = quat.create();
    mat4.getRotation(desiredRotation, rotationMatrix);

    quat.slerp(this.currentRotation, this.currentRotation, desiredRotation, interpolation);
    quat.copy(cameraTransform.rotation, this.currentRotation);
    cameraTransform.dirty = true;
  }
}
