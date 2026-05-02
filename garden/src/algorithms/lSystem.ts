import * as THREE from 'three';
import type { LSystemConfig, LSystemRule } from '../types';
import { SeededRandom } from '../utils/random';

export interface LSysState {
  position: THREE.Vector3;
  heading: THREE.Quaternion;
  lineWidth: number;
  lengthScale: number;
  age: number;
}

export interface LSysSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  lineWidth: number;
  age: number;
  isLeaf?: boolean;
}

export interface LSysResult {
  segments: LSysSegment[];
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
}

export function createTreeLSystem(seed: number, height: number = 1): LSystemConfig {
  const random = new SeededRandom(seed);
  
  const rules: LSystemRule[] = [
    {
      symbol: 'X',
      replacement: random.next() > 0.3 
        ? 'F[-[[X]+X]+F[+FX]-X]' 
        : 'F[-[X]+F[+FX]-X]]',
    },
    {
      symbol: 'X',
      replacement: 'F[+X][-X]FX',
      probability: 0.3,
    },
    {
      symbol: 'F',
      replacement: 'FF',
      probability: 0.4,
    },
    {
      symbol: 'F',
      replacement: 'F[+F]F[-F]F',
      probability: 0.15,
    },
  ];
  
  return {
    axiom: 'X',
    rules,
    iterations: Math.floor(4 + random.next() * 2),
    angle: 25 + random.range(-5, 5),
    stepSize: height * 0.25,
  };
}

export function createShrubLSystem(seed: number, height: number = 0.5): LSystemConfig {
  const random = new SeededRandom(seed);
  
  const rules: LSystemRule[] = [
    {
      symbol: 'X',
      replacement: 'F[-FX][+FX]FX',
    },
    {
      symbol: 'X',
      replacement: 'F[+FX]F[-FX]X',
      probability: 0.4,
    },
    {
      symbol: 'F',
      replacement: 'F[&F]F[^F]F',
      probability: 0.25,
    },
  ];
  
  return {
    axiom: 'X',
    rules,
    iterations: 3 + Math.floor(random.next() * 2),
    angle: 18 + random.range(-8, 8),
    stepSize: height * 0.35,
  };
}

export function createPathLSystem(seed: number): LSystemConfig {
  const random = new SeededRandom(seed);
  
  const rules: LSystemRule[] = [
    {
      symbol: 'F',
      replacement: 'F+F-F-F+F',
    },
    {
      symbol: 'F',
      replacement: 'F-F+F+F-F',
      probability: 0.5,
    },
  ];
  
  return {
    axiom: 'F+F+F+F',
    rules,
    iterations: 2 + Math.floor(random.next() * 2),
    angle: 90,
    stepSize: 1,
  };
}

class LSystemInterpreter {
  private config: LSystemConfig;
  private random: SeededRandom;
  private expanded: string = '';
  
  constructor(config: LSystemConfig, seed: number = Date.now()) {
    this.config = config;
    this.random = new SeededRandom(seed);
    this.expanded = this.expand();
  }
  
  private expand(): string {
    let result = this.config.axiom;
    
    for (let i = 0; i < this.config.iterations; i++) {
      let newResult = '';
      
      for (const char of result) {
        const rules = this.config.rules.filter(r => r.symbol === char);
        
        if (rules.length === 0) {
          newResult += char;
          continue;
        }
        
        let selectedRule = rules[0];
        
        if (rules.length > 1 || (rules[0].probability !== undefined)) {
          let totalProb = 0;
          const weightedRules: { rule: LSystemRule; weight: number }[] = [];
          
          for (const rule of rules) {
            const weight = rule.probability ?? 1;
            weightedRules.push({ rule, weight });
            totalProb += weight;
          }
          
          let r = this.random.next() * totalProb;
          for (const { rule, weight } of weightedRules) {
            r -= weight;
            if (r <= 0) {
              selectedRule = rule;
              break;
            }
          }
        }
        
        newResult += selectedRule.replacement;
      }
      
      result = newResult;
    }
    
    return result;
  }
  
  getExpandedString(): string {
    return this.expanded;
  }
  
  interpret(): LSysResult {
    const segments: LSysSegment[] = [];
    const stack: LSysState[] = [];
    
    const state: LSysState = {
      position: new THREE.Vector3(0, 0, 0),
      heading: new THREE.Quaternion(),
      lineWidth: 1.0,
      lengthScale: 1.0,
      age: 0,
    };
    
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    
    const updateBounds = (point: THREE.Vector3) => {
      min.min(point);
      max.max(point);
    };
    
    const rotateY = (angle: number) => {
      const rad = THREE.MathUtils.degToRad(angle);
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
      state.heading.premultiply(rot);
    };
    
    const rotateX = (angle: number) => {
      const rad = THREE.MathUtils.degToRad(angle);
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rad);
      state.heading.premultiply(rot);
    };
    
    const rotateZ = (angle: number) => {
      const rad = THREE.MathUtils.degToRad(angle);
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad);
      state.heading.premultiply(rot);
    };
    
    for (let i = 0; i < this.expanded.length; i++) {
      const char = this.expanded[i];
      
      switch (char) {
        case 'F': {
          const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(state.heading);
          const length = this.config.stepSize * state.lengthScale;
          const end = state.position.clone().add(direction.multiplyScalar(length));
          
          segments.push({
            start: state.position.clone(),
            end: end.clone(),
            lineWidth: state.lineWidth,
            age: state.age,
          });
          
          updateBounds(state.position);
          updateBounds(end);
          
          state.position.copy(end);
          state.age++;
          break;
        }
        case 'f': {
          const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(state.heading);
          const length = this.config.stepSize * state.lengthScale;
          state.position.add(direction.multiplyScalar(length));
          break;
        }
        case '+':
          rotateY(this.config.angle + this.random.range(-2, 2));
          break;
        case '-':
          rotateY(-this.config.angle + this.random.range(-2, 2));
          break;
        case '&':
          rotateX(this.config.angle + this.random.range(-2, 2));
          break;
        case '^':
          rotateX(-this.config.angle + this.random.range(-2, 2));
          break;
        case '\\':
          rotateZ(-this.config.angle + this.random.range(-2, 2));
          break;
        case '/':
          rotateZ(this.config.angle + this.random.range(-2, 2));
          break;
        case '|':
          rotateY(180);
          break;
        case '[':
          stack.push({
            position: state.position.clone(),
            heading: state.heading.clone(),
            lineWidth: state.lineWidth,
            lengthScale: state.lengthScale,
            age: state.age,
          });
          break;
        case ']': {
          const saved = stack.pop();
          if (saved) {
            Object.assign(state, saved);
          }
          break;
        }
        case '!':
          state.lineWidth *= 0.7;
          break;
        case '?':
          state.lineWidth *= 1.3;
          break;
        case '"':
          state.lengthScale *= 1.1;
          break;
        case "'":
          state.lengthScale *= 0.9;
          break;
        case '%':
          state.lineWidth *= 0.5;
          break;
        case 'L':
        case 'l':
          const lastSegment = segments[segments.length - 1];
          if (lastSegment) {
            lastSegment.isLeaf = true;
          }
          break;
        default:
          break;
      }
    }
    
    return {
      segments,
      bounds: { min, max },
    };
  }
}

export function generateTreeGeometry(
  seed: number,
  height: number = 1,
  type: 'tree' | 'shrub' = 'tree'
): { segments: LSysSegment[]; bounds: { min: THREE.Vector3; max: THREE.Vector3 } } {
  const config = type === 'tree' 
    ? createTreeLSystem(seed, height) 
    : createShrubLSystem(seed, height);
  
  const interpreter = new LSystemInterpreter(config, seed);
  return interpreter.interpret();
}

export function lsysResultToMesh(
  result: LSysResult,
  color: THREE.ColorRepresentation = 0x4a3728
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
  });
  
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5016,
    roughness: 0.8,
    metalness: 0.0,
  });
  
  for (const segment of result.segments) {
    const start = segment.start;
    const end = segment.end;
    const length = start.distanceTo(end);
    
    if (length < 0.01) continue;
    
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    const radius = Math.max(0.02, segment.lineWidth * 0.08);
    
    const cylinderGeometry = new THREE.CylinderGeometry(
      radius * 0.9,
      radius,
      length,
      6
    );
    
    const cylinder = new THREE.Mesh(
      cylinderGeometry,
      segment.isLeaf ? leafMaterial : trunkMaterial
    );
    
    cylinder.position.copy(midPoint);
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );
    
    meshes.push(cylinder);
    
    if (segment.isLeaf) {
      const leafCount = Math.floor(3 + segment.lineWidth * 2);
      for (let i = 0; i < leafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(radius * 0.8, 4, 4);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        const angle = (i / leafCount) * Math.PI * 2;
        const offset = new THREE.Vector3(
          Math.cos(angle) * radius * 1.5,
          0,
          Math.sin(angle) * radius * 1.5
        );
        
        leaf.position.copy(end).add(offset);
        leaf.scale.set(1, 0.6, 1);
        meshes.push(leaf);
      }
    }
  }
  
  return meshes;
}
