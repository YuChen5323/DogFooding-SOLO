import type { GardenElementType, GridCell, WFCConstraint } from '../types';
import { SeededRandom, hash2 } from '../utils/random';

export type AdjacencyMap = Map<GardenElementType, Map<Direction, GardenElementType[]>>;
export type Direction = 'north' | 'south' | 'east' | 'west';

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

export const DIRECTION_OFFSET: Record<Direction, { dx: number; dz: number }> = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  east: { dx: 1, dz: 0 },
  west: { dx: -1, dz: 0 },
};

export interface WFCConfig {
  gridSize: number;
  allTypes: GardenElementType[];
  adjacencyRules: AdjacencyMap;
  seed: number;
  initialConstraints?: WFCConstraint[];
}

export function createDefaultAdjacencyRules(): AdjacencyMap {
  const rules: AdjacencyMap = new Map();
  
  const addRule = (
    type: GardenElementType,
    direction: Direction,
    allowed: GardenElementType[]
  ) => {
    if (!rules.has(type)) {
      rules.set(type, new Map());
    }
    rules.get(type)!.set(direction, allowed);
  };
  
  const allTypes: GardenElementType[] = [
    'pavilion', 'corridor', 'waterside_pavilion', 'rockery',
    'taihu_stone', 'tree', 'shrub', 'water', 'bridge', 'path'
  ];
  
  const allExceptWater: GardenElementType[] = allTypes.filter(t => t !== 'water');
  const allExceptArchitecture: GardenElementType[] = allTypes.filter(
    t => !['pavilion', 'corridor', 'waterside_pavilion', 'bridge'].includes(t)
  );
  
  addRule('water', 'north', ['water', 'bridge', 'waterside_pavilion', 'path', 'rockery', 'taihu_stone', 'shrub']);
  addRule('water', 'south', ['water', 'bridge', 'waterside_pavilion', 'path', 'rockery', 'taihu_stone', 'shrub']);
  addRule('water', 'east', ['water', 'bridge', 'waterside_pavilion', 'path', 'rockery', 'taihu_stone', 'shrub']);
  addRule('water', 'west', ['water', 'bridge', 'waterside_pavilion', 'path', 'rockery', 'taihu_stone', 'shrub']);
  
  addRule('pavilion', 'north', ['corridor', 'path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  addRule('pavilion', 'south', ['corridor', 'path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  addRule('pavilion', 'east', ['corridor', 'path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  addRule('pavilion', 'west', ['corridor', 'path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  
  addRule('corridor', 'north', ['pavilion', 'corridor', 'waterside_pavilion', 'path', 'tree', 'shrub']);
  addRule('corridor', 'south', ['pavilion', 'corridor', 'waterside_pavilion', 'path', 'tree', 'shrub']);
  addRule('corridor', 'east', ['path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  addRule('corridor', 'west', ['path', 'tree', 'shrub', 'rockery', 'taihu_stone']);
  
  addRule('waterside_pavilion', 'north', ['corridor', 'path', 'water', 'bridge']);
  addRule('waterside_pavilion', 'south', ['corridor', 'path', 'water', 'bridge']);
  addRule('waterside_pavilion', 'east', ['corridor', 'path', 'water', 'bridge']);
  addRule('waterside_pavilion', 'west', ['corridor', 'path', 'water', 'bridge']);
  
  addRule('bridge', 'north', ['water', 'path', 'shrub', 'taihu_stone']);
  addRule('bridge', 'south', ['water', 'path', 'shrub', 'taihu_stone']);
  addRule('bridge', 'east', ['water', 'path', 'shrub', 'taihu_stone']);
  addRule('bridge', 'west', ['water', 'path', 'shrub', 'taihu_stone']);
  
  addRule('rockery', 'north', ['path', 'tree', 'shrub', 'taihu_stone', 'water']);
  addRule('rockery', 'south', ['path', 'tree', 'shrub', 'taihu_stone', 'water']);
  addRule('rockery', 'east', ['path', 'tree', 'shrub', 'taihu_stone', 'water']);
  addRule('rockery', 'west', ['path', 'tree', 'shrub', 'taihu_stone', 'water']);
  
  addRule('taihu_stone', 'north', allExceptArchitecture);
  addRule('taihu_stone', 'south', allExceptArchitecture);
  addRule('taihu_stone', 'east', allExceptArchitecture);
  addRule('taihu_stone', 'west', allExceptArchitecture);
  
  addRule('tree', 'north', allExceptWater);
  addRule('tree', 'south', allExceptWater);
  addRule('tree', 'east', allExceptWater);
  addRule('tree', 'west', allExceptWater);
  
  addRule('shrub', 'north', allTypes);
  addRule('shrub', 'south', allTypes);
  addRule('shrub', 'east', allTypes);
  addRule('shrub', 'west', allTypes);
  
  addRule('path', 'north', allTypes);
  addRule('path', 'south', allTypes);
  addRule('path', 'east', allTypes);
  addRule('path', 'west', allTypes);
  
  return rules;
}

export class WaveFunctionCollapse {
  private grid: GridCell[][];
  private config: WFCConfig;
  private random: SeededRandom;
  private adjacencyRules: AdjacencyMap;
  private allTypes: GardenElementType[];
  
  constructor(config: WFCConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
    this.adjacencyRules = config.adjacencyRules;
    this.allTypes = config.allTypes;
    this.grid = this.initializeGrid();
  }
  
  private initializeGrid(): GridCell[][] {
    const grid: GridCell[][] = [];
    const size = this.config.gridSize;
    
    for (let z = 0; z < size; z++) {
      grid[z] = [];
      for (let x = 0; x < size; x++) {
        grid[z][x] = {
          x,
          z,
          element: null,
          constraints: [],
          availableTypes: [...this.allTypes],
          entropy: this.allTypes.length,
        };
      }
    }
    
    return grid;
  }
  
  getGrid(): GridCell[][] {
    return this.grid;
  }
  
  getCell(x: number, z: number): GridCell | null {
    if (x < 0 || x >= this.config.gridSize || z < 0 || z >= this.config.gridSize) {
      return null;
    }
    return this.grid[z][x];
  }
  
  private getLowestEntropyCell(): GridCell | null {
    let lowestEntropy = Infinity;
    let candidates: GridCell[] = [];
    
    for (let z = 0; z < this.config.gridSize; z++) {
      for (let x = 0; x < this.config.gridSize; x++) {
        const cell = this.grid[z][x];
        if (cell.element) continue;
        
        if (cell.entropy < lowestEntropy) {
          lowestEntropy = cell.entropy;
          candidates = [cell];
        } else if (cell.entropy === lowestEntropy) {
          candidates.push(cell);
        }
      }
    }
    
    if (candidates.length === 0) return null;
    
    return this.random.pick(candidates);
  }
  
  private computeEntropy(cell: GridCell): number {
    const weightMap = this.getTypeWeights();
    let sum = 0;
    let sumLog = 0;
    
    for (const type of cell.availableTypes) {
      const weight = weightMap.get(type) || 1;
      sum += weight;
      sumLog += weight * Math.log(weight);
    }
    
    return Math.log(sum) - sumLog / sum;
  }
  
  private getTypeWeights(): Map<GardenElementType, number> {
    const weights = new Map<GardenElementType, number>();
    
    weights.set('pavilion', 0.08);
    weights.set('corridor', 0.12);
    weights.set('waterside_pavilion', 0.05);
    weights.set('rockery', 0.10);
    weights.set('taihu_stone', 0.15);
    weights.set('tree', 0.20);
    weights.set('shrub', 0.15);
    weights.set('water', 0.10);
    weights.set('bridge', 0.03);
    weights.set('path', 0.02);
    
    return weights;
  }
  
  private selectType(cell: GridCell): GardenElementType | null {
    if (cell.availableTypes.length === 0) return null;
    
    const weights = this.getTypeWeights();
    const weightedTypes: { type: GardenElementType; weight: number }[] = [];
    
    for (const type of cell.availableTypes) {
      const baseWeight = weights.get(type) || 1;
      const hashVal = hash2(cell.x + this.config.seed, cell.z + this.config.seed);
      const noise = (hashVal / 4294967296) * 0.3 - 0.15;
      weightedTypes.push({ type, weight: Math.max(0.01, baseWeight + noise) });
    }
    
    const totalWeight = weightedTypes.reduce((sum, t) => sum + t.weight, 0);
    let r = this.random.next() * totalWeight;
    
    for (const { type, weight } of weightedTypes) {
      r -= weight;
      if (r <= 0) return type;
    }
    
    return weightedTypes[weightedTypes.length - 1].type;
  }
  
  private propagate(cell: GridCell): boolean {
    const stack: GridCell[] = [cell];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      
      for (const direction of ['north', 'south', 'east', 'west'] as Direction[]) {
        const offset = DIRECTION_OFFSET[direction];
        const neighbor = this.getCell(current.x + offset.dx, current.z + offset.dz);
        
        if (!neighbor || neighbor.element) continue;
        
        const allowedInNeighbor = new Set<GardenElementType>();
        
        for (const currentType of current.availableTypes) {
          const rules = this.adjacencyRules.get(currentType);
          if (!rules) continue;
          
          const allowed = rules.get(direction);
          if (allowed) {
            for (const type of allowed) {
              allowedInNeighbor.add(type);
            }
          }
        }
        
        const newAvailableTypes = neighbor.availableTypes.filter(t => allowedInNeighbor.has(t));
        
        if (newAvailableTypes.length !== neighbor.availableTypes.length) {
          if (newAvailableTypes.length === 0) {
            return false;
          }
          
          neighbor.availableTypes = newAvailableTypes;
          neighbor.entropy = this.computeEntropy(neighbor);
          
          if (!stack.includes(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }
    
    return true;
  }
  
  collapse(): boolean {
    while (true) {
      const cell = this.getLowestEntropyCell();
      
      if (!cell) {
        return true;
      }
      
      const selectedType = this.selectType(cell);
      
      if (!selectedType) {
        return false;
      }
      
      cell.availableTypes = [selectedType];
      cell.entropy = 0;
      
      if (!this.propagate(cell)) {
        return false;
      }
    }
  }
  
  collapseOneStep(): { done: boolean; success: boolean } {
    const cell = this.getLowestEntropyCell();
    
    if (!cell) {
      return { done: true, success: true };
    }
    
    const selectedType = this.selectType(cell);
    
    if (!selectedType) {
      return { done: false, success: false };
    }
    
    cell.availableTypes = [selectedType];
    cell.entropy = 0;
    
    const success = this.propagate(cell);
    
    return { done: false, success };
  }
  
  getCollapsedGrid(): GridCell[][] {
    return this.grid;
  }
  
  getTypeAt(x: number, z: number): GardenElementType | null {
    const cell = this.getCell(x, z);
    if (!cell) return null;
    if (cell.availableTypes.length === 1) {
      return cell.availableTypes[0];
    }
    return null;
  }
  
  setFixedCell(x: number, z: number, type: GardenElementType): boolean {
    const cell = this.getCell(x, z);
    if (!cell) return false;
    
    cell.availableTypes = [type];
    cell.entropy = 0;
    
    return this.propagate(cell);
  }
}
