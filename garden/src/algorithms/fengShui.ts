import type { GardenElementType, FengShuiRules, GridCell } from '../types';
import { SeededRandom, hash2 } from '../utils/random';
import { PerlinNoise } from '../utils/noise';

export interface LayoutConstraint {
  type: 'water_border' | 'mountain_north' | 'entrance_south' | 'avoid_center' | 'balance';
  priority: number;
  required: boolean;
}

export const DEFAULT_FENG_SHUI_RULES: FengShuiRules = {
  waterPosition: 'south',
  mountainPosition: 'north',
  entranceDirection: 'south',
  avoidNegativeEnergy: true,
  balanceElements: true,
};

export interface ElementDistribution {
  pavilion: number;
  corridor: number;
  waterside_pavilion: number;
  rockery: number;
  taihu_stone: number;
  tree: number;
  shrub: number;
  water: number;
  bridge: number;
  path: number;
}

export const ELEMENT_WEIGHTS: Record<GardenElementType, { weight: number; fengShuiScore: number }> = {
  pavilion: { weight: 0.06, fengShuiScore: 3 },
  corridor: { weight: 0.10, fengShuiScore: 2 },
  waterside_pavilion: { weight: 0.04, fengShuiScore: 5 },
  rockery: { weight: 0.08, fengShuiScore: 4 },
  taihu_stone: { weight: 0.12, fengShuiScore: 4 },
  tree: { weight: 0.22, fengShuiScore: 2 },
  shrub: { weight: 0.18, fengShuiScore: 2 },
  water: { weight: 0.12, fengShuiScore: 5 },
  bridge: { weight: 0.04, fengShuiScore: 3 },
  path: { weight: 0.04, fengShuiScore: 1 },
};

export class FengShuiLayoutGenerator {
  private gridSize: number;
  private rules: FengShuiRules;
  private seed: number;
  private random: SeededRandom;
  private noise: PerlinNoise;
  private lakeSize: number;
  private vegetationDensity: number;
  
  constructor(
    gridSize: number,
    rules: FengShuiRules = DEFAULT_FENG_SHUI_RULES,
    seed: number = Date.now(),
    lakeSize: number = 0.35,
    vegetationDensity: number = 0.6
  ) {
    this.gridSize = gridSize;
    this.rules = rules;
    this.seed = seed;
    this.random = new SeededRandom(seed);
    this.noise = new PerlinNoise(seed);
    this.lakeSize = lakeSize;
    this.vegetationDensity = vegetationDensity;
  }
  
  generateWaterPositions(): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];
    const center = Math.floor(this.gridSize / 2);
    const radius = Math.floor(this.gridSize * this.lakeSize * 0.8);
    
    let waterCenterX = center;
    let waterCenterZ = center;
    
    switch (this.rules.waterPosition) {
      case 'north':
        waterCenterZ = Math.max(radius, center - Math.floor(this.gridSize * 0.3));
        break;
      case 'south':
        waterCenterZ = Math.min(this.gridSize - radius - 1, center + Math.floor(this.gridSize * 0.3));
        break;
      case 'east':
        waterCenterX = Math.min(this.gridSize - radius - 1, center + Math.floor(this.gridSize * 0.3));
        break;
      case 'west':
        waterCenterX = Math.max(radius, center - Math.floor(this.gridSize * 0.3));
        break;
      case 'center':
      default:
        waterCenterX = center;
        waterCenterZ = center;
        break;
    }
    
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const dx = x - waterCenterX;
        const dz = z - waterCenterZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        const noiseVal = this.noise.fbm(
          x * 0.3 + this.seed * 0.001,
          z * 0.3 + this.seed * 0.001,
          0,
          3
        );
        
        const adjustedRadius = radius + noiseVal * (radius * 0.3);
        
        if (dist <= adjustedRadius) {
          positions.push({ x, z });
        }
      }
    }
    
    return positions;
  }
  
  generateMountainPositions(waterPositions: Set<string>): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];
    const center = Math.floor(this.gridSize / 2);
    
    let mountainStartZ = 0;
    let mountainEndZ = Math.floor(this.gridSize * 0.2);
    let startX = 0;
    let endX = this.gridSize - 1;
    
    switch (this.rules.mountainPosition) {
      case 'north':
        mountainStartZ = 0;
        mountainEndZ = Math.floor(this.gridSize * 0.25);
        break;
      case 'northeast':
        mountainStartZ = 0;
        mountainEndZ = Math.floor(this.gridSize * 0.3);
        startX = Math.floor(this.gridSize * 0.6);
        endX = this.gridSize - 1;
        break;
      case 'northwest':
        mountainStartZ = 0;
        mountainEndZ = Math.floor(this.gridSize * 0.3);
        startX = 0;
        endX = Math.floor(this.gridSize * 0.4);
        break;
    }
    
    const mountainCount = Math.floor(this.gridSize * 0.15 + this.random.next() * 3);
    
    for (let i = 0; i < mountainCount; i++) {
      let attempts = 0;
      while (attempts < 50) {
        const x = this.random.rangeInt(startX, endX + 1);
        const z = this.random.rangeInt(mountainStartZ, mountainEndZ + 1);
        const key = `${x},${z}`;
        
        if (!waterPositions.has(key)) {
          const neighborKeys = [
            `${x-1},${z}`, `${x+1},${z}`,
            `${x},${z-1}`, `${x},${z+1}`,
          ];
          
          const isTooClose = positions.some(p => 
            Math.abs(p.x - x) <= 1 && Math.abs(p.z - z) <= 1
          );
          
          if (!isTooClose) {
            positions.push({ x, z });
            break;
          }
        }
        attempts++;
      }
    }
    
    return positions;
  }
  
  generatePavilionPositions(
    waterPositions: Set<string>,
    mountainPositions: Set<string>
  ): { x: number; z: number; isWaterside: boolean }[] {
    const positions: { x: number; z: number; isWaterside: boolean }[] = [];
    const center = Math.floor(this.gridSize / 2);
    
    const pavilionCount = Math.max(1, Math.floor(this.gridSize * 0.08 + this.random.next() * 2));
    
    for (let i = 0; i < pavilionCount; i++) {
      let attempts = 0;
      let bestPosition: { x: number; z: number; isWaterside: boolean } | null = null;
      let bestScore = -Infinity;
      
      while (attempts < 100) {
        const x = this.random.rangeInt(1, this.gridSize - 1);
        const z = this.random.rangeInt(1, this.gridSize - 1);
        const key = `${x},${z}`;
        
        if (waterPositions.has(key) || mountainPositions.has(key)) {
          attempts++;
          continue;
        }
        
        const isTooClose = positions.some(p => 
          Math.abs(p.x - x) <= 2 && Math.abs(p.z - z) <= 2
        );
        
        if (isTooClose) {
          attempts++;
          continue;
        }
        
        let score = 0;
        let isWaterside = false;
        
        const neighborKeys = [
          `${x-1},${z}`, `${x+1},${z}`,
          `${x},${z-1}`, `${x},${z+1}`,
        ];
        
        for (const nk of neighborKeys) {
          if (waterPositions.has(nk)) {
            isWaterside = true;
            score += 50;
            break;
          }
        }
        
        const dx = x - center;
        const dz = z - center;
        const distFromCenter = Math.sqrt(dx * dx + dz * dz);
        const idealDist = this.gridSize * 0.25;
        score -= Math.abs(distFromCenter - idealDist) * 2;
        
        if (this.rules.entranceDirection === 'south') {
          score += (this.gridSize - z) * 0.5;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestPosition = { x, z, isWaterside };
        }
        
        attempts++;
      }
      
      if (bestPosition) {
        positions.push(bestPosition);
      }
    }
    
    return positions;
  }
  
  generateTaihuStonePositions(
    waterPositions: Set<string>,
    mountainPositions: Set<string>,
    pavilionPositions: Set<string>
  ): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];
    
    const stoneCount = Math.floor(
      this.gridSize * this.gridSize * 0.08 * (0.5 + this.random.next())
    );
    
    for (let i = 0; i < stoneCount; i++) {
      let attempts = 0;
      while (attempts < 30) {
        const x = this.random.rangeInt(0, this.gridSize);
        const z = this.random.rangeInt(0, this.gridSize);
        const key = `${x},${z}`;
        
        if (waterPositions.has(key) || mountainPositions.has(key) || pavilionPositions.has(key)) {
          attempts++;
          continue;
        }
        
        const isTooClose = positions.some(p => 
          Math.abs(p.x - x) <= 0 && Math.abs(p.z - z) <= 0
        );
        
        if (!isTooClose) {
          const neighborKeys = [
            `${x-1},${z}`, `${x+1},${z}`,
            `${x},${z-1}`, `${x},${z+1}`,
          ];
          
          let nearWaterOrPavilion = false;
          for (const nk of neighborKeys) {
            if (waterPositions.has(nk) || pavilionPositions.has(nk)) {
              nearWaterOrPavilion = true;
              break;
            }
          }
          
          if (nearWaterOrPavilion || this.random.next() > 0.6) {
            positions.push({ x, z });
            break;
          }
        }
        attempts++;
      }
    }
    
    return positions;
  }
  
  generateVegetationPositions(
    occupiedPositions: Set<string>,
    density: number
  ): { x: number; z: number; type: 'tree' | 'shrub' }[] {
    const positions: { x: number; z: number; type: 'tree' | 'shrub' }[] = [];
    
    const totalCells = this.gridSize * this.gridSize;
    const vegCount = Math.floor(totalCells * density * this.vegetationDensity);
    
    for (let i = 0; i < vegCount; i++) {
      let attempts = 0;
      while (attempts < 20) {
        const x = this.random.rangeInt(0, this.gridSize);
        const z = this.random.rangeInt(0, this.gridSize);
        const key = `${x},${z}`;
        
        if (occupiedPositions.has(key)) {
          attempts++;
          continue;
        }
        
        const isTooClose = positions.some(p => 
          Math.abs(p.x - x) <= 0 && Math.abs(p.z - z) <= 0
        );
        
        if (!isTooClose) {
          const noiseVal = this.noise.fbm(
            x * 0.5 + this.seed * 0.0001,
            z * 0.5 + this.seed * 0.0001,
            0,
            2
          );
          
          const type = noiseVal > 0.3 ? 'tree' : 'shrub';
          
          positions.push({ x, z, type });
          break;
        }
        attempts++;
      }
    }
    
    return positions;
  }
  
  generatePathPositions(
    occupiedPositions: Set<string>,
    pavilionPositions: { x: number; z: number }[]
  ): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];
    
    if (pavilionPositions.length < 2) {
      const edgeX = Math.floor(this.gridSize / 2);
      const edgeZ = this.gridSize - 1;
      if (!occupiedPositions.has(`${edgeX},${edgeZ}`)) {
        positions.push({ x: edgeX, z: edgeZ });
      }
      return positions;
    }
    
    for (let i = 0; i < pavilionPositions.length - 1; i++) {
      const start = pavilionPositions[i];
      const end = pavilionPositions[i + 1];
      
      let x = start.x;
      let z = start.z;
      
      while (x !== end.x || z !== end.z) {
        const key = `${x},${z}`;
        if (!occupiedPositions.has(key) && !positions.some(p => p.x === x && p.z === z)) {
          positions.push({ x, z });
        }
        
        const dx = end.x - x;
        const dz = end.z - z;
        
        if (Math.abs(dx) > Math.abs(dz)) {
          x += Math.sign(dx);
        } else if (dz !== 0) {
          z += Math.sign(dz);
        } else if (dx !== 0) {
          x += Math.sign(dx);
        }
      }
    }
    
    return positions;
  }
  
  generateBridgePositions(
    waterPositions: Set<string>,
    pathPositions: { x: number; z: number }[]
  ): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];
    
    for (const path of pathPositions) {
      const neighbors = [
        { x: path.x - 1, z: path.z },
        { x: path.x + 1, z: path.z },
        { x: path.x, z: path.z - 1 },
        { x: path.x, z: path.z + 1 },
      ];
      
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.z}`;
        if (waterPositions.has(key)) {
          if (!positions.some(p => p.x === neighbor.x && p.z === neighbor.z)) {
            positions.push(neighbor);
          }
        }
      }
    }
    
    return positions;
  }
  
  generateLayout(): {
    grid: (GardenElementType | null)[][];
    fengShuiScore: number;
  } {
    const grid: (GardenElementType | null)[][] = [];
    
    for (let z = 0; z < this.gridSize; z++) {
      grid[z] = [];
      for (let x = 0; x < this.gridSize; x++) {
        grid[z][x] = null;
      }
    }
    
    const occupiedPositions = new Set<string>();
    let fengShuiScore = 0;
    
    const waterPositions = this.generateWaterPositions();
    const waterSet = new Set<string>();
    
    for (const pos of waterPositions) {
      grid[pos.z][pos.x] = 'water';
      waterSet.add(`${pos.x},${pos.z}`);
      occupiedPositions.add(`${pos.x},${pos.z}`);
    }
    fengShuiScore += waterPositions.length * 0.5;
    
    const mountainPositions = this.generateMountainPositions(waterSet);
    const mountainSet = new Set<string>();
    
    for (const pos of mountainPositions) {
      grid[pos.z][pos.x] = 'rockery';
      mountainSet.add(`${pos.x},${pos.z}`);
      occupiedPositions.add(`${pos.x},${pos.z}`);
    }
    fengShuiScore += mountainPositions.length * 2;
    
    if (this.rules.mountainPosition === 'north' && mountainPositions.length > 0) {
      fengShuiScore += 20;
    }
    
    const pavilionPositions = this.generatePavilionPositions(waterSet, mountainSet);
    const pavilionSet = new Set<string>();
    
    for (const pos of pavilionPositions) {
      grid[pos.z][pos.x] = pos.isWaterside ? 'waterside_pavilion' : 'pavilion';
      pavilionSet.add(`${pos.x},${pos.z}`);
      occupiedPositions.add(`${pos.x},${pos.z}`);
      
      if (pos.isWaterside) {
        fengShuiScore += 10;
      }
    }
    
    const pathPositions = this.generatePathPositions(
      occupiedPositions,
      pavilionPositions.map(p => ({ x: p.x, z: p.z }))
    );
    
    for (const pos of pathPositions) {
      if (!occupiedPositions.has(`${pos.x},${pos.z}`)) {
        grid[pos.z][pos.x] = 'path';
        occupiedPositions.add(`${pos.x},${pos.z}`);
      }
    }
    
    const bridgePositions = this.generateBridgePositions(waterSet, pathPositions);
    
    for (const pos of bridgePositions) {
      if (waterSet.has(`${pos.x},${pos.z}`)) {
        grid[pos.z][pos.x] = 'bridge';
        occupiedPositions.add(`${pos.x},${pos.z}`);
        fengShuiScore += 5;
      }
    }
    
    const taihuStonePositions = this.generateTaihuStonePositions(waterSet, mountainSet, pavilionSet);
    
    for (const pos of taihuStonePositions) {
      if (!occupiedPositions.has(`${pos.x},${pos.z}`)) {
        grid[pos.z][pos.x] = 'taihu_stone';
        occupiedPositions.add(`${pos.x},${pos.z}`);
      }
    }
    
    const vegetationPositions = this.generateVegetationPositions(occupiedPositions, 0.4);
    
    for (const pos of vegetationPositions) {
      if (!occupiedPositions.has(`${pos.x},${pos.z}`)) {
        grid[pos.z][pos.x] = pos.type;
        occupiedPositions.add(`${pos.x},${pos.z}`);
      }
    }
    
    return {
      grid,
      fengShuiScore: Math.min(100, Math.floor(fengShuiScore)),
    };
  }
}
