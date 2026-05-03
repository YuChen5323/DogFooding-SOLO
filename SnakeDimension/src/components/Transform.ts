import { vec3, quat, mat4 } from 'gl-matrix';
import { IComponent } from '../ecs';

export interface TransformComponent extends IComponent {
  type: 'Transform';
  position: vec3;
  rotation: quat;
  scale: vec3;
  localMatrix: mat4;
  worldMatrix: mat4;
  parentId?: number;
  childrenIds: number[];
  dirty: boolean;
}

export function createTransform(
  position: vec3 = vec3.create(),
  rotation: quat = quat.create(),
  scale: vec3 = vec3.fromValues(1, 1, 1)
): TransformComponent {
  return {
    type: 'Transform',
    position: vec3.clone(position),
    rotation: quat.clone(rotation),
    scale: vec3.clone(scale),
    localMatrix: mat4.create(),
    worldMatrix: mat4.create(),
    childrenIds: [],
    dirty: true,
  };
}

export function updateTransformMatrix(transform: TransformComponent): void {
  if (!transform.dirty) return;

  mat4.fromRotationTranslationScale(
    transform.localMatrix,
    transform.rotation,
    transform.position,
    transform.scale
  );
  transform.dirty = false;
}

export function setPosition(transform: TransformComponent, x: number, y: number, z: number): void {
  vec3.set(transform.position, x, y, z);
  transform.dirty = true;
}

export function translate(transform: TransformComponent, dx: number, dy: number, dz: number): void {
  vec3.add(transform.position, transform.position, vec3.fromValues(dx, dy, dz));
  transform.dirty = true;
}

export function setRotation(transform: TransformComponent, x: number, y: number, z: number, w: number): void {
  quat.set(transform.rotation, x, y, z, w);
  transform.dirty = true;
}

export function rotate(transform: TransformComponent, axis: vec3, angle: number): void {
  const rotationQuat = quat.create();
  quat.setAxisAngle(rotationQuat, axis, angle);
  quat.multiply(transform.rotation, transform.rotation, rotationQuat);
  transform.dirty = true;
}

export function setScale(transform: TransformComponent, x: number, y: number, z: number): void {
  vec3.set(transform.scale, x, y, z);
  transform.dirty = true;
}
