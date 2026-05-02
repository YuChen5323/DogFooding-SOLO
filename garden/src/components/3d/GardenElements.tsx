import * as THREE from 'three';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  generateTaihuStoneGeometry, 
  createTaihuStoneMaterial,
} from '../../algorithms/marchingCubes';
import type { TaihuStoneParams } from '../../algorithms/marchingCubes';
import { generateTreeGeometry, lsysResultToMesh } from '../../algorithms/lSystem';
import type { Season, GardenElementType } from '../../types';
import { SeededRandom } from '../../utils/random';

interface SeasonalColors {
  trunk: THREE.ColorRepresentation;
  leaf: THREE.ColorRepresentation;
  leafVariation: number;
}

const seasonalTreeColors: Record<Season, SeasonalColors> = {
  spring: {
    trunk: 0x5a4728,
    leaf: 0x8bc34a,
    leafVariation: 0.15,
  },
  summer: {
    trunk: 0x4a3728,
    leaf: 0x2e7d32,
    leafVariation: 0.1,
  },
  autumn: {
    trunk: 0x4a3728,
    leaf: 0xff7043,
    leafVariation: 0.25,
  },
  winter: {
    trunk: 0x3a2718,
    leaf: 0x9e9e9e,
    leafVariation: 0.05,
  },
};

export const TaihuStone: React.FC<{
  seed: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  params?: Partial<TaihuStoneParams>;
}> = ({
  seed,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  params = {},
}) => {
  const geometry = useMemo(() => {
    return generateTaihuStoneGeometry({
      seed,
      resolution: 24,
      threshold: 0.42,
      roughness: 0.75,
      holeFrequency: 0.35,
      holeSize: 0.2,
      ...params,
    });
  }, [seed, params]);

  const material = useMemo(() => {
    return createTaihuStoneMaterial(0x6a6a6a);
  }, []);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
};

export const Tree: React.FC<{
  seed: number;
  position?: [number, number, number];
  height?: number;
  season?: Season;
  type?: 'tree' | 'shrub';
}> = ({
  seed,
  position = [0, 0, 0],
  height = 1,
  season = 'summer',
  type = 'tree',
}) => {
  const meshesRef = useRef<THREE.Group>(null);
  
  const { trunkMeshes, leafMeshes } = useMemo(() => {
    const result = generateTreeGeometry(seed, height, type);
    const colors = seasonalTreeColors[season];
    const random = new SeededRandom(seed + 1000);
    
    const trunks: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
    const leaves: { geometry: THREE.BufferGeometry; material: THREE.Material; position: THREE.Vector3 }[] = [];
    
    for (const segment of result.segments) {
      const start = segment.start;
      const end = segment.end;
      const length = start.distanceTo(end);
      
      if (length < 0.01) continue;
      
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      const radius = Math.max(0.015, segment.lineWidth * 0.06);
      
      const cylinderGeometry = new THREE.CylinderGeometry(
        radius * 0.85,
        radius,
        length,
        6
      );
      
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: colors.trunk,
        roughness: 0.9,
        metalness: 0.0,
      });
      
      trunks.push({ geometry: cylinderGeometry, material: trunkMaterial });
      
      if (segment.isLeaf && season !== 'winter') {
        const leafCount = Math.floor(2 + segment.lineWidth);
        for (let i = 0; i < leafCount; i++) {
          const leafRadius = radius * 1.2;
          const leafGeometry = new THREE.SphereGeometry(leafRadius, 5, 5);
          
          const baseColor = new THREE.Color(colors.leaf);
          const variation = random.range(-colors.leafVariation, colors.leafVariation);
          const leafColor = baseColor.offsetHSL(variation * 0.3, 0, variation * 0.5);
          
          const leafMaterial = new THREE.MeshStandardMaterial({
            color: leafColor,
            roughness: 0.8,
            metalness: 0.0,
          });
          
          const angle = (i / leafCount) * Math.PI * 2;
          const heightOffset = random.range(-0.1, 0.1);
          const leafPos = new THREE.Vector3(
            Math.cos(angle) * radius * 2,
            heightOffset,
            Math.sin(angle) * radius * 2
          ).add(end);
          
          leaves.push({
            geometry: leafGeometry,
            material: leafMaterial,
            position: leafPos,
          });
        }
      }
    }
    
    return { trunkMeshes: trunks, leafMeshes: leaves };
  }, [seed, height, season, type]);

  const rotationQuaternion = useMemo(() => {
    const random = new SeededRandom(seed + 500);
    return new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      random.range(0, Math.PI * 2)
    );
  }, [seed]);

  return (
    <group position={position} quaternion={rotationQuaternion}>
      {trunkMeshes.map((trunk, i) => (
        <mesh
          key={`trunk-${i}`}
          geometry={trunk.geometry}
          material={trunk.material}
          castShadow
          receiveShadow
        />
      ))}
      {leafMeshes.map((leaf, i) => (
        <mesh
          key={`leaf-${i}`}
          geometry={leaf.geometry}
          material={leaf.material}
          position={leaf.position}
          castShadow
        />
      ))}
    </group>
  );
};

export const Pavilion: React.FC<{
  seed: number;
  position?: [number, number, number];
  scale?: number;
  isWaterside?: boolean;
}> = ({
  seed,
  position = [0, 0, 0],
  scale = 1,
  isWaterside = false,
}) => {
  const random = useMemo(() => new SeededRandom(seed), [seed]);
  
  const baseWidth = 2.5 + random.range(-0.3, 0.3);
  const baseHeight = 0.15;
  const columnHeight = 1.8 + random.range(0, 0.4);
  const roofHeight = 0.8 + random.range(-0.1, 0.2);
  const roofOverhang = 0.35 + random.range(-0.05, 0.1);
  
  const woodColor = useMemo(() => {
    const colors = [0x8b4513, 0x6b4423, 0x5d3a1a, 0x4a3728];
    return random.pick(colors);
  }, [random]);
  
  const roofColor = useMemo(() => {
    const colors = [0x2d2d2d, 0x1a1a1a, 0x333333];
    return random.pick(colors);
  }, [random]);

  const baseGeometry = useMemo(() => 
    new THREE.BoxGeometry(baseWidth, baseHeight, baseWidth),
    [baseWidth, baseHeight]
  );
  
  const columnGeometry = useMemo(() => 
    new THREE.CylinderGeometry(0.08, 0.1, columnHeight, 6),
    [columnHeight]
  );
  
  const roofBaseGeometry = useMemo(() => 
    new THREE.BoxGeometry(
      baseWidth + roofOverhang * 2,
      0.15,
      baseWidth + roofOverhang * 2
    ),
    [baseWidth, roofOverhang]
  );
  
  const roofTopGeometry = useMemo(() => {
    const roofWidth = baseWidth + roofOverhang * 2;
    const geometry = new THREE.ConeGeometry(
      roofWidth * 0.7,
      roofHeight,
      4
    );
    return geometry;
  }, [baseWidth, roofOverhang, roofHeight]);

  const columnPositions = useMemo(() => {
    const halfWidth = baseWidth * 0.35;
    return [
      [-halfWidth, columnHeight / 2 + baseHeight, -halfWidth],
      [halfWidth, columnHeight / 2 + baseHeight, -halfWidth],
      [-halfWidth, columnHeight / 2 + baseHeight, halfWidth],
      [halfWidth, columnHeight / 2 + baseHeight, halfWidth],
    ];
  }, [baseWidth, columnHeight, baseHeight]);

  const woodMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: woodColor,
      roughness: 0.85,
      metalness: 0.05,
    }),
    [woodColor]
  );

  const roofMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.6,
      metalness: 0.1,
    }),
    [roofColor]
  );

  const stoneMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.0,
    }),
    []
  );

  const rotation = useMemo(() => {
    return [0, random.range(-0.1, 0.1), 0] as [number, number, number];
  }, [random]);

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation}>
      <mesh
        geometry={baseGeometry}
        material={stoneMaterial}
        position={[0, baseHeight / 2, 0]}
        receiveShadow
        castShadow
      />
      
      {columnPositions.map((pos, i) => (
        <mesh
          key={`column-${i}`}
          geometry={columnGeometry}
          material={woodMaterial}
          position={pos}
          castShadow
        />
      ))}
      
      <mesh
        geometry={roofBaseGeometry}
        material={woodMaterial}
        position={[0, columnHeight + baseHeight + 0.075, 0]}
        castShadow
      />
      
      <mesh
        geometry={roofTopGeometry}
        material={roofMaterial}
        position={[
          0,
          columnHeight + baseHeight + 0.15 + roofHeight / 2,
          0,
        ]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      />
      
      {isWaterside && (
        <group>
          <mesh
            geometry={new THREE.BoxGeometry(baseWidth * 0.8, 0.2, baseWidth * 0.4)}
            material={woodMaterial}
            position={[0, baseHeight + 0.1, baseWidth * 0.45]}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={new THREE.BoxGeometry(0.08, 0.8, 0.08)}
            material={woodMaterial}
            position={[-baseWidth * 0.3, baseHeight + 0.5, baseWidth * 0.6]}
            castShadow
          />
          <mesh
            geometry={new THREE.BoxGeometry(0.08, 0.8, 0.08)}
            material={woodMaterial}
            position={[baseWidth * 0.3, baseHeight + 0.5, baseWidth * 0.6]}
            castShadow
          />
        </group>
      )}
    </group>
  );
};

export const Rockery: React.FC<{
  seed: number;
  position?: [number, number, number];
  scale?: number;
}> = ({
  seed,
  position = [0, 0, 0],
  scale = 1,
}) => {
  const random = useMemo(() => new SeededRandom(seed), [seed]);
  
  const rocks = useMemo(() => {
    const result: {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      position: [number, number, number];
      scale: [number, number, number];
      rotation: [number, number, number];
    }[] = [];
    
    const rockCount = random.rangeInt(3, 7);
    const baseY = 0;
    
    for (let i = 0; i < rockCount; i++) {
      const size = random.range(0.3, 1.2);
      const height = size * random.range(0.8, 1.5);
      
      const geometry = new THREE.DodecahedronGeometry(1, random.rangeInt(0, 2));
      
      const positions = geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        const x = positions.getX(j);
        const y = positions.getY(j);
        const z = positions.getZ(j);
        
        const noise = random.range(-0.15, 0.15);
        positions.setX(j, x * (1 + noise));
        positions.setY(j, y * height + noise * 0.3);
        positions.setZ(j, z * (1 + noise * 0.8));
      }
      geometry.computeVertexNormals();
      
      const colorVariation = random.range(-0.1, 0.1);
      const baseColor = new THREE.Color(0x696969);
      baseColor.offsetHSL(0, 0, colorVariation);
      
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.95,
        metalness: 0.02,
      });
      
      const angle = (i / rockCount) * Math.PI * 2 + random.range(-0.3, 0.3);
      const dist = random.range(0.2, 0.8);
      
      result.push({
        geometry,
        material,
        position: [
          Math.cos(angle) * dist,
          baseY + random.range(0, 0.2),
          Math.sin(angle) * dist,
        ],
        scale: [size, size * 0.8, size],
        rotation: [
          random.range(-0.3, 0.3),
          random.range(0, Math.PI * 2),
          random.range(-0.2, 0.2),
        ],
      });
    }
    
    return result;
  }, [seed, random]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {rocks.map((rock, i) => (
        <mesh
          key={`rock-${i}`}
          geometry={rock.geometry}
          material={rock.material}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
};

export const WaterSurface: React.FC<{
  width: number;
  depth: number;
  position?: [number, number, number];
  seed?: number;
}> = ({
  width,
  depth,
  position = [0, 0, 0],
  seed = Date.now(),
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, depth, 64, 64);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [width, depth]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x1a3a5c,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    timeRef.current += delta * 0.5;
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      const wave1 = Math.sin(x * 2 + timeRef.current) * 0.02;
      const wave2 = Math.cos(z * 2.5 + timeRef.current * 0.8) * 0.015;
      const wave3 = Math.sin((x + z) * 1.5 + timeRef.current * 1.2) * 0.01;
      
      positions.setY(i, wave1 + wave2 + wave3);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      receiveShadow
    />
  );
};

export const Bridge: React.FC<{
  seed: number;
  position?: [number, number, number];
  length?: number;
  width?: number;
  rotation?: [number, number, number];
}> = ({
  seed,
  position = [0, 0, 0],
  length = 3,
  width = 1.2,
  rotation = [0, 0, 0],
}) => {
  const random = useMemo(() => new SeededRandom(seed), [seed]);
  
  const woodColor = useMemo(() => {
    const colors = [0x7a5230, 0x6b4423, 0x5d3a1a];
    return random.pick(colors);
  }, [random]);

  const woodMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: woodColor,
      roughness: 0.85,
      metalness: 0.05,
    }),
    [woodColor]
  );

  const archGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const archHeight = length * 0.15;
    const halfLength = length / 2;
    
    shape.moveTo(-halfLength, 0);
    shape.quadraticCurveTo(0, archHeight + 0.05, halfLength, 0);
    shape.lineTo(halfLength, -0.1);
    shape.quadraticCurveTo(0, archHeight - 0.05, -halfLength, -0.1);
    shape.lineTo(-halfLength, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: width,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [length, width]);

  const planks = useMemo(() => {
    const plankCount = Math.floor(length / 0.25);
    const result: { position: [number, number, number] }[] = [];
    
    for (let i = 0; i < plankCount; i++) {
      const x = -length / 2 + (i + 0.5) * (length / plankCount);
      result.push({
        position: [x, 0.12, 0],
      });
    }
    
    return result;
  }, [length]);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={archGeometry}
        material={woodMaterial}
        position={[0, 0.05, -width / 2]}
        castShadow
        receiveShadow
      />
      
      {planks.map((plank, i) => (
        <mesh
          key={`plank-${i}`}
          geometry={new THREE.BoxGeometry(0.2, 0.05, width)}
          material={woodMaterial}
          position={plank.position}
          castShadow
          receiveShadow
        />
      ))}
      
      <mesh
        geometry={new THREE.BoxGeometry(0.15, 0.8, width)}
        material={woodMaterial}
        position={[-length / 2 - 0.2, -0.3, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={new THREE.BoxGeometry(0.15, 0.8, width)}
        material={woodMaterial}
        position={[length / 2 + 0.2, -0.3, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

export const Path: React.FC<{
  width?: number;
  positions: [number, number][];
  seed?: number;
}> = ({
  width = 0.8,
  positions,
  seed = Date.now(),
}) => {
  const random = useMemo(() => new SeededRandom(seed), [seed]);
  
  const stoneMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: 0x9e8b7d,
      roughness: 0.9,
      metalness: 0.0,
    }),
    []
  );

  const pathElements = useMemo(() => {
    if (positions.length < 2) return [];
    
    const result: {
      position: [number, number, number];
      scale: [number, number, number];
      rotation: [number, number, number];
    }[] = [];
    
    for (let i = 0; i < positions.length - 1; i++) {
      const [x1, z1] = positions[i];
      const [x2, z2] = positions[i + 1];
      
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      
      if (length < 0.01) continue;
      
      const angle = Math.atan2(dx, dz);
      
      const stoneCount = Math.max(2, Math.floor(length / 0.6));
      
      for (let j = 0; j < stoneCount; j++) {
        const t = j / stoneCount;
        const x = x1 + dx * t;
        const z = z1 + dz * t;
        
        const stoneWidth = random.range(width * 0.4, width * 0.7);
        const stoneLength = random.range(0.5, 0.8);
        
        result.push({
          position: [
            x + random.range(-0.1, 0.1),
            0.02,
            z + random.range(-0.1, 0.1),
          ],
          scale: [stoneWidth, 0.04, stoneLength],
          rotation: [0, angle + random.range(-0.2, 0.2), 0],
        });
      }
    }
    
    return result;
  }, [positions, width, random]);

  return (
    <group>
      {pathElements.map((element, i) => (
        <mesh
          key={`stone-${i}`}
          geometry={new THREE.BoxGeometry(1, 1, 1)}
          material={stoneMaterial}
          position={element.position}
          scale={element.scale}
          rotation={element.rotation}
          receiveShadow
        />
      ))}
    </group>
  );
};
