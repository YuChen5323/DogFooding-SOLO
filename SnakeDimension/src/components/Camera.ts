import { IComponent } from '../ecs';
import { vec3, mat4 } from 'gl-matrix';

export type ProjectionType = 'Perspective' | 'Orthographic';

export interface CameraComponent extends IComponent {
  type: 'Camera';
  projectionType: ProjectionType;
  fov: number;
  near: number;
  far: number;
  aspectRatio: number;
  orthographicSize: number;
  viewMatrix: mat4;
  projectionMatrix: mat4;
  viewProjectionMatrix: mat4;
  isMain: boolean;
  dirty: boolean;
}

export function createPerspectiveCamera(
  fov: number = Math.PI / 4,
  near: number = 0.1,
  far: number = 1000,
  aspectRatio: number = 16 / 9,
  isMain: boolean = true
): CameraComponent {
  return {
    type: 'Camera',
    projectionType: 'Perspective',
    fov,
    near,
    far,
    aspectRatio,
    orthographicSize: 10,
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(),
    viewProjectionMatrix: mat4.create(),
    isMain,
    dirty: true,
  };
}

export function createOrthographicCamera(
  size: number = 10,
  near: number = 0.1,
  far: number = 1000,
  isMain: boolean = false
): CameraComponent {
  return {
    type: 'Camera',
    projectionType: 'Orthographic',
    fov: Math.PI / 4,
    near,
    far,
    aspectRatio: 16 / 9,
    orthographicSize: size,
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(),
    viewProjectionMatrix: mat4.create(),
    isMain,
    dirty: true,
  };
}

export function updateCameraMatrices(
  camera: CameraComponent,
  position: vec3,
  target: vec3,
  up: vec3 = vec3.fromValues(0, 1, 0)
): void {
  if (!camera.dirty) return;

  mat4.lookAt(camera.viewMatrix, position, target, up);

  if (camera.projectionType === 'Perspective') {
    mat4.perspective(
      camera.projectionMatrix,
      camera.fov,
      camera.aspectRatio,
      camera.near,
      camera.far
    );
  } else {
    const halfWidth = (camera.orthographicSize * camera.aspectRatio) / 2;
    const halfHeight = camera.orthographicSize / 2;
    mat4.ortho(
      camera.projectionMatrix,
      -halfWidth,
      halfWidth,
      -halfHeight,
      halfHeight,
      camera.near,
      camera.far
    );
  }

  mat4.multiply(camera.viewProjectionMatrix, camera.projectionMatrix, camera.viewMatrix);
  camera.dirty = false;
}
