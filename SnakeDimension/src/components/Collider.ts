import { IComponent } from '../ecs';
import { vec3 } from 'gl-matrix';

export type ColliderType = 'Sphere' | 'Box' | 'Capsule' | 'Mesh';

export interface SphereCollider {
  radius: number;
}

export interface BoxCollider {
  halfExtents: vec3;
}

export interface CapsuleCollider {
  radius: number;
  height: number;
}

export interface MeshCollider {
  vertices: vec3[];
  indices: number[];
}

export interface ColliderComponent extends IComponent {
  type: 'Collider';
  colliderType: ColliderType;
  isTrigger: boolean;
  center: vec3;
  sphere?: SphereCollider;
  box?: BoxCollider;
  capsule?: CapsuleCollider;
  mesh?: MeshCollider;
  collisionLayer: number;
  collisionMask: number;
}

export function createSphereCollider(
  radius: number = 0.5,
  center: vec3 = vec3.create()
): ColliderComponent {
  return {
    type: 'Collider',
    colliderType: 'Sphere',
    isTrigger: false,
    center: vec3.clone(center),
    sphere: { radius },
    collisionLayer: 1,
    collisionMask: 0xffffffff,
  };
}

export function createBoxCollider(
  halfExtents: vec3 = vec3.fromValues(0.5, 0.5, 0.5),
  center: vec3 = vec3.create()
): ColliderComponent {
  return {
    type: 'Collider',
    colliderType: 'Box',
    isTrigger: false,
    center: vec3.clone(center),
    box: { halfExtents: vec3.clone(halfExtents) },
    collisionLayer: 1,
    collisionMask: 0xffffffff,
  };
}

export function createCapsuleCollider(
  radius: number = 0.5,
  height: number = 1.0,
  center: vec3 = vec3.create()
): ColliderComponent {
  return {
    type: 'Collider',
    colliderType: 'Capsule',
    isTrigger: false,
    center: vec3.clone(center),
    capsule: { radius, height },
    collisionLayer: 1,
    collisionMask: 0xffffffff,
  };
}
