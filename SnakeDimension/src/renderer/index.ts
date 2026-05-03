export type {
  UniformBufferObject,
  LightData,
  MaterialData,
  InstanceData,
  PointLight,
  DirectionalLight,
  SpotLight,
  ShadowMap,
  ForwardPlusConfig,
} from './Types';

export { DEFAULT_FORWARD_PLUS_CONFIG } from './Types';

export {
  vertexShaderCode,
  fragmentShaderCode,
  lightCullingComputeShaderCode,
  shadowShaderCode,
} from './Shaders';

export type {
  RenderMesh,
  RenderMaterial,
  RenderInstance,
} from './WebGPURenderer';

export { WebGPURenderer } from './WebGPURenderer';

export {
  catmullRom,
  catmullRomDerivative,
  CatmullRomPath,
  createTubeMeshFromPath,
  createSnakeBodyMesh,
  updateSnakeBodyMesh,
} from './CatmullRom';
