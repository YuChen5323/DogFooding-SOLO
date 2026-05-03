import { IComponent } from '../ecs';
import { vec3, vec4 } from 'gl-matrix';

export type MaterialType = 'Standard' | 'Unlit' | 'Emissive';

export interface MaterialComponent extends IComponent {
  type: 'Material';
  materialType: MaterialType;
  baseColor: vec4;
  metallic: number;
  roughness: number;
  emissiveColor: vec3;
  emissiveIntensity: number;
  texture?: GPUTexture;
  textureView?: GPUTextureView;
  sampler?: GPUSampler;
}

export function createStandardMaterial(
  baseColor: vec4 = vec4.fromValues(1, 1, 1, 1),
  metallic: number = 0.0,
  roughness: number = 0.5
): MaterialComponent {
  return {
    type: 'Material',
    materialType: 'Standard',
    baseColor: vec4.clone(baseColor),
    metallic,
    roughness,
    emissiveColor: vec3.fromValues(0, 0, 0),
    emissiveIntensity: 0,
  };
}

export function createUnlitMaterial(
  baseColor: vec4 = vec4.fromValues(1, 1, 1, 1)
): MaterialComponent {
  return {
    type: 'Material',
    materialType: 'Unlit',
    baseColor: vec4.clone(baseColor),
    metallic: 0,
    roughness: 0,
    emissiveColor: vec3.fromValues(0, 0, 0),
    emissiveIntensity: 0,
  };
}

export function createEmissiveMaterial(
  emissiveColor: vec3 = vec3.fromValues(1, 1, 1),
  emissiveIntensity: number = 1.0
): MaterialComponent {
  return {
    type: 'Material',
    materialType: 'Emissive',
    baseColor: vec4.fromValues(1, 1, 1, 1),
    metallic: 0,
    roughness: 0,
    emissiveColor: vec3.clone(emissiveColor),
    emissiveIntensity,
  };
}
