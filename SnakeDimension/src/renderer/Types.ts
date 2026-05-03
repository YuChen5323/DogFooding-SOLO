import { vec3, vec4, mat4 } from 'gl-matrix';

export interface UniformBufferObject {
  viewMatrix: mat4;
  projMatrix: mat4;
  viewProjMatrix: mat4;
  invViewMatrix: mat4;
  invProjMatrix: mat4;
  cameraPosition: vec4;
  lightCount: number;
  padding: [number, number, number];
}

export interface LightData {
  position: vec4;
  color: vec4;
  direction: vec4;
  params: vec4;
}

export interface MaterialData {
  baseColor: vec4;
  metallicRoughness: vec4;
  emissiveColor: vec4;
  materialType: number;
  padding: [number, number, number];
}

export interface InstanceData {
  modelMatrix: mat4;
  normalMatrix: mat4;
  materialIndex: number;
  padding: [number, number, number];
}

export interface PointLight {
  position: vec3;
  color: vec3;
  intensity: number;
  range: number;
}

export interface DirectionalLight {
  direction: vec3;
  color: vec3;
  intensity: number;
}

export interface SpotLight {
  position: vec3;
  direction: vec3;
  color: vec3;
  intensity: number;
  range: number;
  spotAngle: number;
  spotInnerAngle: number;
}

export interface ShadowMap {
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;
}

export interface ForwardPlusConfig {
  tileSize: number;
  maxLightsPerTile: number;
  shadowMapSize: number;
}

export const DEFAULT_FORWARD_PLUS_CONFIG: ForwardPlusConfig = {
  tileSize: 16,
  maxLightsPerTile: 32,
  shadowMapSize: 2048,
};
