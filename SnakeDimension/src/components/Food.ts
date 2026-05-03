import { IComponent } from '../ecs';
import { vec3 } from 'gl-matrix';

export interface FoodComponent extends IComponent {
  type: 'Food';
  position: vec3;
  value: number;
  foodType: 'Normal' | 'Bonus' | 'Speed';
  rotation: number;
  bobOffset: number;
  collected: boolean;
}

export function createFoodComponent(
  position: vec3,
  value: number = 10,
  foodType: 'Normal' | 'Bonus' | 'Speed' = 'Normal'
): FoodComponent {
  return {
    type: 'Food',
    position: vec3.clone(position),
    value,
    foodType,
    rotation: 0,
    bobOffset: Math.random() * Math.PI * 2,
    collected: false,
  };
}
