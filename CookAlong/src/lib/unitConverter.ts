import { UnitType } from '@/types';
import { unitConversions, unitLabels, findDensity } from '@/data/densityDatabase';

export interface ConversionResult {
  value: number;
  unit: UnitType;
  label: string;
}

export type VolumeUnit = 'cup' | 'tablespoon' | 'teaspoon' | 'milliliter' | 'liter';
export type WeightUnit = 'gram' | 'kilogram' | 'ounce' | 'pound';

const volumeUnits: VolumeUnit[] = ['cup', 'tablespoon', 'teaspoon', 'milliliter', 'liter'];
const weightUnits: WeightUnit[] = ['gram', 'kilogram', 'ounce', 'pound'];

export function isVolumeUnit(unit: string): unit is VolumeUnit {
  return volumeUnits.includes(unit as VolumeUnit);
}

export function isWeightUnit(unit: string): unit is WeightUnit {
  return weightUnits.includes(unit as WeightUnit);
}

export function convertVolume(
  value: number,
  fromUnit: VolumeUnit,
  toUnit: VolumeUnit
): number {
  const fromMl = value * unitConversions[fromUnit];
  const toValue = fromMl / unitConversions[toUnit];
  return Math.round(toValue * 100) / 100;
}

export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  const fromGrams = value * unitConversions[fromUnit];
  const toValue = fromGrams / unitConversions[toUnit];
  return Math.round(toValue * 100) / 100;
}

export function volumeToWeight(
  volume: number,
  volumeUnit: VolumeUnit,
  ingredientName: string,
  targetWeightUnit: WeightUnit = 'gram'
): number {
  const density = findDensity(ingredientName);
  const ml = volume * unitConversions[volumeUnit];
  const grams = ml * density;
  return convertWeight(grams, 'gram', targetWeightUnit);
}

export function weightToVolume(
  weight: number,
  weightUnit: WeightUnit,
  ingredientName: string,
  targetVolumeUnit: VolumeUnit = 'cup'
): number {
  const density = findDensity(ingredientName);
  const grams = convertWeight(weight, weightUnit, 'gram');
  const ml = grams / density;
  return convertVolume(ml, 'milliliter', targetVolumeUnit);
}

export function smartConvert(
  value: number,
  fromUnit: string,
  toUnit: string,
  ingredientName?: string
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  if (isVolumeUnit(fromUnit) && isVolumeUnit(toUnit)) {
    return convertVolume(value, fromUnit, toUnit);
  }

  if (isWeightUnit(fromUnit) && isWeightUnit(toUnit)) {
    return convertWeight(value, fromUnit, toUnit);
  }

  if (isVolumeUnit(fromUnit) && isWeightUnit(toUnit)) {
    if (!ingredientName) {
      console.warn('Ingredient name required for volume to weight conversion');
      return value;
    }
    return volumeToWeight(value, fromUnit, ingredientName, toUnit);
  }

  if (isWeightUnit(fromUnit) && isVolumeUnit(toUnit)) {
    if (!ingredientName) {
      console.warn('Ingredient name required for weight to volume conversion');
      return value;
    }
    return weightToVolume(value, fromUnit, ingredientName, toUnit);
  }

  return value;
}

export function formatQuantity(quantity: number, unit: string): string {
  let formattedValue: string;
  
  if (Number.isInteger(quantity)) {
    formattedValue = quantity.toString();
  } else if (quantity < 1) {
    const fraction = toFraction(quantity);
    formattedValue = fraction;
  } else {
    formattedValue = quantity.toFixed(2).replace(/\.?0+$/, '');
  }

  const label = unitLabels[unit] || unit;
  return `${formattedValue} ${label}`;
}

function toFraction(value: number): string {
  const tolerance = 0.01;
  const fractions: { value: number; label: string }[] = [
    { value: 0.125, label: '1/8' },
    { value: 0.1667, label: '1/6' },
    { value: 0.2, label: '1/5' },
    { value: 0.25, label: '1/4' },
    { value: 0.3333, label: '1/3' },
    { value: 0.375, label: '3/8' },
    { value: 0.4, label: '2/5' },
    { value: 0.5, label: '1/2' },
    { value: 0.6, label: '3/5' },
    { value: 0.625, label: '5/8' },
    { value: 0.6667, label: '2/3' },
    { value: 0.75, label: '3/4' },
    { value: 0.8, label: '4/5' },
    { value: 0.875, label: '7/8' },
  ];

  for (const fraction of fractions) {
    if (Math.abs(value - fraction.value) < tolerance) {
      return fraction.label;
    }
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}

export function getBestDisplayUnit(value: number, unit: string): { value: number; unit: string } {
  if (isWeightUnit(unit)) {
    const grams = convertWeight(value, unit, 'gram');
    if (grams >= 1000) {
      return { value: convertWeight(grams, 'gram', 'kilogram'), unit: 'kilogram' };
    }
    if (grams < 1 && unit !== 'gram') {
      return { value: grams, unit: 'gram' };
    }
  }

  if (isVolumeUnit(unit)) {
    const ml = convertVolume(value, unit, 'milliliter');
    if (ml >= 1000) {
      return { value: convertVolume(ml, 'milliliter', 'liter'), unit: 'liter' };
    }
    if (ml >= 240) {
      return { value: convertVolume(ml, 'milliliter', 'cup'), unit: 'cup' };
    }
  }

  return { value, unit };
}
