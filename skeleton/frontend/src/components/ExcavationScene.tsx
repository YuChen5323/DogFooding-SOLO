import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BoneFragment, Position, Rotation, BrushTool } from '../types';

interface BoneFragmentMeshProps {
  bone: BoneFragment;
  isExposed: boolean;
  isSelected: boolean;
  onSelect: (bone: BoneFragment) => void;
  position: Position;
  rotation: Rotation;
}

const BoneFragmentMesh: React.FC<BoneFragmentMeshProps> = ({
  bone,
  isExposed,
  isSelected,
  onSelect,
  position,
  rotation,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const getBoneGeometry = () => {
    switch (bone.type) {
      case 'skull':
        return <sphereGeometry args={[0.8, 32, 32]} />;
      case 'vertebra':
        return <cylinderGeometry args={[0.3, 0.4, 0.5, 16]} />;
      case 'rib':
        return <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />;
      case 'femur':
        return <cylinderGeometry args={[0.2, 0.25, 2, 12]} />;
      case 'tibia':
        return <cylinderGeometry args={[0.15, 0.2, 1.8, 12]} />;
      case 'humerus':
        return <cylinderGeometry args={[0.18, 0.22, 1.6, 12]} />;
      case 'jaw':
        return <boxGeometry args={[1.2, 0.4, 0.6]} />;
      case 'tooth':
        return <coneGeometry args={[0.15, 0.6, 8]} />;
      case 'tail':
        return <cylinderGeometry args={[0.2, 0.1, 3, 12]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  if (!isExposed) return null;

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(bone);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {getBoneGeometry()}
      <meshStandardMaterial
        color={isSelected ? '#E8C872' : hovered ? '#D4A373' : '#CD853F'}
        roughness={0.8}
        metalness={0.1}
        emissive={isSelected ? '#5D4E37' : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
    </mesh>
  );
};

interface ExcavationGridProps {
  gridSize: number;
  cells: Array<{
    id: string;
    row: number;
    col: number;
    excavatedLevel: number;
    hasBone: boolean;
    boneVisible: boolean;
  }>;
  brushTool: BrushTool;
  onExcavate: (cellId: string, strength: number) => void;
}

const ExcavationGrid: React.FC<ExcavationGridProps> = ({
  gridSize,
  cells,
  brushTool,
  onExcavate,
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [isDigging, setIsDigging] = useState(false);

  const cellSize = 1.5;
  const totalSize = gridSize * cellSize;
  const startOffset = -totalSize / 2 + cellSize / 2;

  useEffect(() => {
    if (isDigging && hoveredCell) {
      onExcavate(hoveredCell, brushTool.strength);
    }
  }, [isDigging, hoveredCell, brushTool.strength, onExcavate]);

  return (
    <group>
      {cells.map((cell) => {
        const x = startOffset + cell.col * cellSize;
        const z = startOffset + cell.row * cellSize;
        const y = -0.5 + cell.excavatedLevel * 0.1;

        const isHovered = hoveredCell === cell.id;
        const soilColor = cell.excavatedLevel > 0.8 ? '#F5F5DC' :
          cell.excavatedLevel > 0.5 ? '#D2B48C' :
          cell.excavatedLevel > 0.2 ? '#8B7355' : '#5D4037';

        return (
          <mesh
            key={cell.id}
            position={[x, y, z]}
            onPointerOver={() => setHoveredCell(cell.id)}
            onPointerOut={() => setHoveredCell(null)}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDigging(true);
              onExcavate(cell.id, brushTool.strength);
            }}
            onPointerUp={() => setIsDigging(false)}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[cellSize * 0.95, 1, cellSize * 0.95]} />
            <meshStandardMaterial
              color={soilColor}
              roughness={0.9}
              metalness={0}
              emissive={isHovered ? '#333333' : '#000000'}
              emissiveIntensity={isHovered ? 0.2 : 0}
            />
            {cell.boneVisible && (
              <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[0.8, 0.2, 0.8]} />
                <meshStandardMaterial
                  color="#CD853F"
                  roughness={0.8}
                  metalness={0.1}
                  emissive="#3D2B1F"
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </mesh>
        );
      })}
    </group>
  );
};

interface ExcavationSceneProps {
  bones: BoneFragment[];
  excavatedBones: Record<string, boolean>;
  selectedBone: BoneFragment | null;
  onSelectBone: (bone: BoneFragment) => void;
  gridCells: Array<{
    id: string;
    row: number;
    col: number;
    excavatedLevel: number;
    hasBone: boolean;
    boneVisible: boolean;
  }>;
  brushTool: BrushTool;
  onExcavate: (cellId: string, strength: number) => void;
  gridSize?: number;
}

const ExcavationScene: React.FC<ExcavationSceneProps> = ({
  bones,
  excavatedBones,
  selectedBone,
  onSelectBone,
  gridCells,
  brushTool,
  onExcavate,
  gridSize = 6,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(8, 10, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#FFF8DC" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
      />

      <ExcavationGrid
        gridSize={gridSize}
        cells={gridCells}
        brushTool={brushTool}
        onExcavate={onExcavate}
      />

      {bones.map((bone) => (
        <BoneFragmentMesh
          key={bone.id}
          bone={bone}
          isExposed={excavatedBones[bone.id] || false}
          isSelected={selectedBone?.id === bone.id}
          onSelect={onSelectBone}
          position={bone.buriedPosition || { x: 0, y: 0, z: 0 }}
          rotation={bone.buriedRotation || { x: 0, y: 0, z: 0 }}
        />
      ))}

      <gridHelper args={[20, 20, '#DEB887', '#F5DEB3']} position={[0, -1, 0]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#8B7355" roughness={1} />
      </mesh>
    </>
  );
};

export default ExcavationScene;
