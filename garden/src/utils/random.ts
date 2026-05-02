export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }
  
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
  
  reset(seed: number): void {
    this.seed = seed;
  }
}

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
};

export const hash2 = (x: number, y: number): number => {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 15)) * 2246822519;
  n = (n ^ (n >> 13)) * 3266489917;
  return (n ^ (n >> 16)) >>> 0;
};

export const hash3 = (x: number, y: number, z: number): number => {
  let n = x * 374761393 + y * 668265263 + z * 1274126177;
  n = (n ^ (n >> 15)) * 2246822519;
  n = (n ^ (n >> 13)) * 3266489917;
  return (n ^ (n >> 16)) >>> 0;
};
