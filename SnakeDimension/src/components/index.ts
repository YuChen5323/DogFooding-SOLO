export type { TransformComponent } from './Transform';
export { 
  createTransform, 
  updateTransformMatrix,
  setPosition,
  translate,
  setRotation,
  rotate,
  setScale
} from './Transform';

export type { Vertex, MeshData, MeshComponent } from './Mesh';
export {
  createMesh,
  createBoxMesh,
  createSphereMesh,
  createPlaneMesh
} from './Mesh';

export type { MaterialType, MaterialComponent } from './Material';
export {
  createStandardMaterial,
  createUnlitMaterial,
  createEmissiveMaterial
} from './Material';

export type { ProjectionType, CameraComponent } from './Camera';
export {
  createPerspectiveCamera,
  createOrthographicCamera,
  updateCameraMatrices
} from './Camera';

export type { LightType, LightComponent } from './Light';
export {
  createDirectionalLight,
  createPointLight,
  createSpotLight
} from './Light';

export type { SnakeSegment, SnakeComponent } from './Snake';
export {
  createSnakeComponent,
  growSnake,
  changeDirection
} from './Snake';

export type { FoodComponent } from './Food';
export { createFoodComponent } from './Food';

export type { 
  ColliderType, 
  SphereCollider, 
  BoxCollider, 
  CapsuleCollider, 
  MeshCollider, 
  ColliderComponent 
} from './Collider';
export {
  createSphereCollider,
  createBoxCollider,
  createCapsuleCollider
} from './Collider';
