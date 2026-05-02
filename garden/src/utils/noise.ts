import { lerp, smoothstep } from './random';

export class PerlinNoise {
  private permutation: number[];
  private perm: number[];
  
  constructor(seed: number = Math.random() * 10000) {
    this.permutation = this.generatePermutation(seed);
    this.perm = [...this.permutation, ...this.permutation];
  }
  
  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    let s = seed;
    const pseudoRandom = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    return p;
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x: number, y: number = 0, z: number = 0): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;
    
    return lerp(
      lerp(
        lerp(
          this.grad(this.perm[AA], x, y, z),
          this.grad(this.perm[BA], x - 1, y, z),
          u
        ),
        lerp(
          this.grad(this.perm[AB], x, y - 1, z),
          this.grad(this.perm[BB], x - 1, y - 1, z),
          u
        ),
        v
      ),
      lerp(
        lerp(
          this.grad(this.perm[AA + 1], x, y, z - 1),
          this.grad(this.perm[BA + 1], x - 1, y, z - 1),
          u
        ),
        lerp(
          this.grad(this.perm[AB + 1], x, y - 1, z - 1),
          this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1),
          u
        ),
        v
      ),
      w
    );
  }
  
  fbm(
    x: number,
    y: number = 0,
    z: number = 0,
    octaves: number = 6,
    persistence: number = 0.5,
    lacunarity: number = 2
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise(x * frequency, y * frequency, z * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
  
  turbulence(
    x: number,
    y: number = 0,
    z: number = 0,
    octaves: number = 6
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * Math.abs(this.noise(x * frequency, y * frequency, z * frequency));
      amplitude *= 0.5;
      frequency *= 2;
    }
    
    return value;
  }
}

export const ridgedNoise = (
  noise: PerlinNoise,
  x: number,
  y: number,
  z: number,
  octaves: number = 4
): number => {
  let value = 0;
  let weight = 1;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    const n = noise.noise(x * frequency, y * frequency, z * frequency);
    const ridge = 1 - Math.abs(n);
    const squared = ridge * ridge;
    value += squared * amplitude * weight;
    maxValue += amplitude * weight;
    
    weight = Math.max(0, Math.min(1, squared * 2));
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / maxValue;
};

export const voronoiNoise2D = (
  x: number,
  y: number,
  seed: number = 0
): { distance: number; cellId: number } => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  
  let minDist = 9999;
  let secondMinDist = 9999;
  let closestCellId = 0;
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const cellX = xi + i;
      const cellY = yi + j;
      
      const h = ((cellX * 374761393 + cellY * 668265263 + seed) >>> 0) / 4294967296;
      const h2 = ((cellX * 1274126177 + cellY * 9301 + seed * 49297) >>> 0) / 4294967296;
      
      const pointX = cellX + 0.3 + h * 0.4;
      const pointY = cellY + 0.3 + h2 * 0.4;
      
      const dx = x - pointX;
      const dy = y - pointY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
        closestCellId = (cellX * 1000 + cellY + seed * 7) >>> 0;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }
  }
  
  return {
    distance: minDist,
    cellId: closestCellId,
  };
};
