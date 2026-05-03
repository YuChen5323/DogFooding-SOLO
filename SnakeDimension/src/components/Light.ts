import { IComponent } from '../ecs';
import { vec3 } from 'gl-matrix';

export type LightType = 'Directional' | 'Point' | 'Spot';

export interface LightComponent extends IComponent {
  type: 'Light';
  lightType: LightType;
  color: vec3;
  intensity: number;
  range: number;
  spotAngle: number;
  spotInnerAngle: number;
  castsShadow: boolean;
  shadowMapSize: number;
}

export function createDirectionalLight(
  color: vec3 = vec3.fromValues(1, 1, 1),
  intensity: number = 1.0,
  castsShadow: boolean = true
): LightComponent {
  return {
    type: 'Light',
    lightType: 'Directional',
    color: vec3.clone(color),
    intensity,
    range: 1000,
    spotAngle: Math.PI / 6,
    spotInnerAngle: Math.PI / 12,
    castsShadow,
    shadowMapSize: 2048,
  };
}

export function createPointLight(
  color: vec3 = vec3.fromValues(1, 1, 1),
  intensity: number = 1.0,
  range: number = 10,
  castsShadow: boolean = false
): LightComponent {
  return {
    type: 'Light',
    lightType: 'Point',
    color: vec3.clone(color),
    intensity,
    range,
    spotAngle: Math.PI / 6,
    spotInnerAngle: Math.PI / 12,
    castsShadow,
    shadowMapSize: 1024,
  };
}

export function createSpotLight(
  color: vec3 = vec3.fromValues(1, 1, 1),
  intensity: number = 1.0,
  range: number = 10,
  spotAngle: number = Math.PI / 6,
  spotInnerAngle: number = Math.PI / 12,
  castsShadow: boolean = false
): LightComponent {
  return {
    type: 'Light',
    lightType: 'Spot',
    color: vec3.clone(color),
    intensity,
    range,
    spotAngle,
    spotInnerAngle,
    castsShadow,
    shadowMapSize: 1024,
  };
}
