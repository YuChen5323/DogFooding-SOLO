import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGardenStore } from '../../store';
import { FengShuiLayoutGenerator, DEFAULT_FENG_SHUI_RULES } from '../../algorithms/fengShui';
import type { GardenElementType, Season, TimeOfDay } from '../../types';
import {
  TaihuStone,
  Tree,
  Pavilion,
  Rockery,
  WaterSurface,
  Bridge,
  Path,
} from './GardenElements';
import { SeededRandom } from '../../utils/random';

interface GardenElementData {
  type: GardenElementType;
  position: [number, number, number];
  seed: number;
  scale?: number;
  rotation?: [number, number, number];
  isWaterside?: boolean;
}

export const GardenScene: React.FC = () => {
  const { globalParams, setElements, setGenerating, setGenerationProgress } = useGardenStore();
  const [elements, setLocalElements] = useState<GardenElementData[]>([]);
  const [waterAreas, setWaterAreas] = useState<{ x: number; z: number }[]>([]);
  const [pathSegments, setPathSegments] = useState<[number, number][]>([]);
  const [bridgeData, setBridgeData] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
    length: number;
    seed: number;
  }[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  
  const cellSize = 2;
  const gridHalfSize = (globalParams.gridSize * cellSize) / 2;
  const totalSize = globalParams.gridSize * cellSize;
  
  useEffect(() => {
    generateGarden();
  }, [globalParams.seed, globalParams.gridSize, globalParams.lakeSize, globalParams.vegetationDensity]);
  
  const generateGarden = () => {
    setIsGenerating(true);
    setGenerating(true);
    setGenerationProgress(0);
    
    setTimeout(() => {
      try {
        const random = new SeededRandom(globalParams.seed);
        
        setGenerationProgress(10);
        
        const layoutGenerator = new FengShuiLayoutGenerator(
          globalParams.gridSize,
          DEFAULT_FENG_SHUI_RULES,
          globalParams.seed,
          globalParams.lakeSize,
          globalParams.vegetationDensity
        );
        
        setGenerationProgress(30);
        
        const layout = layoutGenerator.generateLayout();
        
        setGenerationProgress(60);
        
        const newElements: GardenElementData[] = [];
        const waterCells: { x: number; z: number }[] = [];
        const pathCells: { x: number; z: number }[] = [];
        const bridgeCells: { x: number; z: number }[] = [];
        
        let elementIndex = 0;
        
        for (let z = 0; z < globalParams.gridSize; z++) {
          for (let x = 0; x < globalParams.gridSize; x++) {
            const cellType = layout.grid[z]?.[x];
            if (!cellType) continue;
            
            const worldX = x * cellSize - gridHalfSize + cellSize / 2;
            const worldZ = z * cellSize - gridHalfSize + cellSize / 2;
            const elementSeed = globalParams.seed + x * 1000 + z;
            
            switch (cellType) {
              case 'water':
                waterCells.push({ x: worldX, z: worldZ });
                break;
                
              case 'pavilion':
                newElements.push({
                  type: 'pavilion',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.9, 1.1),
                  isWaterside: false,
                });
                break;
                
              case 'waterside_pavilion':
                newElements.push({
                  type: 'waterside_pavilion',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.9, 1.1),
                  isWaterside: true,
                });
                break;
                
              case 'rockery':
                newElements.push({
                  type: 'rockery',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.8, 1.2),
                });
                break;
                
              case 'taihu_stone':
                newElements.push({
                  type: 'taihu_stone',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.6, 1.0),
                  rotation: [0, random.range(0, Math.PI * 2), 0],
                });
                break;
                
              case 'tree':
                newElements.push({
                  type: 'tree',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.8, 1.3),
                });
                break;
                
              case 'shrub':
                newElements.push({
                  type: 'shrub',
                  position: [worldX, 0, worldZ],
                  seed: elementSeed,
                  scale: random.range(0.5, 0.9),
                });
                break;
                
              case 'bridge':
                bridgeCells.push({ x: worldX, z: worldZ });
                break;
                
              case 'path':
                pathCells.push({ x, z });
                break;
            }
            
            elementIndex++;
          }
        }
        
        setGenerationProgress(80);
        
        const pathSegmentsSorted: [number, number][] = [];
        if (pathCells.length > 0) {
          pathCells.sort((a, b) => a.z - b.z || a.x - b.x);
          for (const cell of pathCells) {
            pathSegmentsSorted.push([
              cell.x * cellSize - gridHalfSize + cellSize / 2,
              cell.z * cellSize - gridHalfSize + cellSize / 2,
            ]);
          }
        }
        
        const bridges: typeof bridgeData = [];
        for (const bridge of bridgeCells) {
          const bridgeSeed = globalParams.seed + bridge.x * 100 + bridge.z;
          const isHorizontal = random.next() > 0.5;
          
          bridges.push({
            position: [bridge.x, 0.1, bridge.z],
            rotation: [0, isHorizontal ? Math.PI / 2 : 0, 0],
            length: cellSize * 1.2,
            seed: bridgeSeed,
          });
        }
        
        setLocalElements(newElements);
        setWaterAreas(waterCells);
        setPathSegments(pathSegmentsSorted);
        setBridgeData(bridges);
        
        setGenerationProgress(100);
        setIsGenerating(false);
        setGenerating(false);
        
      } catch (error) {
        console.error('Garden generation error:', error);
        setIsGenerating(false);
        setGenerating(false);
      }
    }, 100);
  };
  
  const waterMinX = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return Math.min(...waterAreas.map(w => w.x)) - cellSize / 2;
  }, [waterAreas]);
  
  const waterMaxX = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return Math.max(...waterAreas.map(w => w.x)) + cellSize / 2;
  }, [waterAreas]);
  
  const waterMinZ = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return Math.min(...waterAreas.map(w => w.z)) - cellSize / 2;
  }, [waterAreas]);
  
  const waterMaxZ = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return Math.max(...waterAreas.map(w => w.z)) + cellSize / 2;
  }, [waterAreas]);
  
  const waterWidth = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return waterMaxX - waterMinX;
  }, [waterMaxX, waterMinX]);
  
  const waterDepth = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return waterMaxZ - waterMinZ;
  }, [waterMaxZ, waterMinZ]);
  
  const waterCenterX = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return (waterMinX + waterMaxX) / 2;
  }, [waterMinX, waterMaxX]);
  
  const waterCenterZ = useMemo(() => {
    if (waterAreas.length === 0) return 0;
    return (waterMinZ + waterMaxZ) / 2;
  }, [waterMinZ, waterMaxZ]);
  
  const renderElement = (element: GardenElementData, index: number) => {
    const key = `${element.type}-${index}-${element.seed}`;
    
    switch (element.type) {
      case 'pavilion':
      case 'waterside_pavilion':
        return (
          <Pavilion
            key={key}
            seed={element.seed}
            position={element.position}
            scale={element.scale || 1}
            isWaterside={element.isWaterside || false}
          />
        );
        
      case 'rockery':
        return (
          <Rockery
            key={key}
            seed={element.seed}
            position={element.position}
            scale={element.scale || 1}
          />
        );
        
      case 'taihu_stone':
        return (
          <TaihuStone
            key={key}
            seed={element.seed}
            position={element.position}
            scale={[
              (element.scale || 1) * 0.8,
              (element.scale || 1) * 1,
              (element.scale || 1) * 0.8,
            ]}
            rotation={element.rotation || [0, 0, 0]}
          />
        );
        
      case 'tree':
        return (
          <Tree
            key={key}
            seed={element.seed}
            position={element.position}
            height={(element.scale || 1) * 2.5}
            season={globalParams.season}
            type="tree"
          />
        );
        
      case 'shrub':
        return (
          <Tree
            key={key}
            seed={element.seed}
            position={element.position}
            height={(element.scale || 1) * 1}
            season={globalParams.season}
            type="shrub"
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <group>
      {waterWidth > 0 && waterDepth > 0 && (
        <WaterSurface
          width={waterWidth + cellSize}
          depth={waterDepth + cellSize}
          position={[waterCenterX, 0.01, waterCenterZ]}
          seed={globalParams.seed}
        />
      )}
      
      {elements.map((element, index) => renderElement(element, index))}
      
      {pathSegments.length >= 2 && (
        <Path
          positions={pathSegments}
          width={0.9}
          seed={globalParams.seed}
        />
      )}
      
      {bridgeData.map((bridge, index) => (
        <Bridge
          key={`bridge-${index}`}
          seed={bridge.seed}
          position={bridge.position}
          length={bridge.length}
          width={1.2}
          rotation={bridge.rotation}
        />
      ))}
    </group>
  );
};
