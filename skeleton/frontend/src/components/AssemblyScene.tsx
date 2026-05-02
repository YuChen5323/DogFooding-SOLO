import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BoneFragment, Position, Rotation } from '../types';

interface DraggableBoneProps {
  bone: BoneFragment;
  initialPosition: Position;
  isDragging: boolean;
  onDragStart: (bone: BoneFragment) => void;
  onDragEnd: (bone: BoneFragment, position: Position, rotation: Rotation) => void;
  isAssembled: boolean;
  assembledPosition?: Position;
  assembledRotation?: Rotation;
  isSelected: boolean;
  onSelect: (bone: BoneFragment) => void;
}

const DraggableBone: React.FC<DraggableBoneProps> = ({
  bone,
  initialPosition,
  isDragging,
  onDragStart,
  onDragEnd,
  isAssembled,
  assembledPosition,
  assembledRotation,
  isSelected,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, raycaster, pointer } = useThree();
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentPositionRef = useRef<THREE.Vector3>(
    new THREE.Vector3(initialPosition.x, initialPosition.y, initialPosition.z)
  );
  const currentRotationRef = useRef<THREE.Euler>(
    new THREE.Euler(0, 0, 0)
  );

  useEffect(() => {
    if (isAssembled && assembledPosition) {
      currentPositionRef.current = new THREE.Vector3(
        assembledPosition.x,
        assembledPosition.y,
        assembledPosition.z
      );
      if (assembledRotation) {
        currentRotationRef.current = new THREE.Euler(
          assembledRotation.x,
          assembledRotation.y,
          assembledRotation.z
        );
      }
    }
  }, [isAssembled, assembledPosition, assembledRotation]);

  const handlePointerDown = useCallback(
    (e: any) => {
      if (isAssembled) return;
      e.stopPropagation();
      onDragStart(bone);
      onSelect(bone);

      const planeIntersection = new THREE.Vector3();
      const mouseWorld = new THREE.Vector3();
      mouseWorld.set(pointer.x, pointer.y, 0.5);
      mouseWorld.unproject(camera);

      const rayDirection = mouseWorld.sub(camera.position).normalize();
      const planePoint = new THREE.Vector3(
        currentPositionRef.current.x,
        1,
        currentPositionRef.current.z
      );
      dragPlaneRef.current.constant = -planePoint.dot(new THREE.Vector3(0, 1, 0));

      const ray = new THREE.Ray(camera.position, rayDirection);
      ray.intersectPlane(dragPlaneRef.current, planeIntersection);

      if (planeIntersection) {
        dragOffsetRef.current.copy(currentPositionRef.current).sub(planeIntersection);
      }
    },
    [bone, isAssembled, onDragStart, onSelect, pointer, camera]
  );

  const handlePointerMove = useCallback(() => {
    if (!isDragging || isAssembled) return;

    const planeIntersection = new THREE.Vector3();
    const mouseWorld = new THREE.Vector3();
    mouseWorld.set(pointer.x, pointer.y, 0.5);
    mouseWorld.unproject(camera);

    const rayDirection = mouseWorld.sub(camera.position).normalize();
    const ray = new THREE.Ray(camera.position, rayDirection);
    ray.intersectPlane(dragPlaneRef.current, planeIntersection);

    if (planeIntersection) {
      currentPositionRef.current.copy(planeIntersection.add(dragOffsetRef.current));
    }
  }, [isDragging, isAssembled, pointer, camera]);

  useEffect(() => {
    if (isDragging) {
      handlePointerMove();
    }
  }, [isDragging, pointer, handlePointerMove]);

  const handlePointerUp = useCallback(() => {
    if (isDragging && !isAssembled) {
      onDragEnd(
        bone,
        {
          x: currentPositionRef.current.x,
          y: currentPositionRef.current.y,
          z: currentPositionRef.current.z,
        },
        {
          x: currentRotationRef.current.x,
          y: currentRotationRef.current.y,
          z: currentRotationRef.current.z,
        }
      );
    }
  }, [isDragging, isAssembled, bone, onDragEnd]);

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

  return (
    <group
      ref={groupRef}
      position={[
        currentPositionRef.current.x,
        currentPositionRef.current.y,
        currentPositionRef.current.z,
      ]}
      rotation={[
        currentRotationRef.current.x,
        currentRotationRef.current.y,
        currentRotationRef.current.z,
      ]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={() => !isAssembled && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
      >
        {getBoneGeometry()}
        <meshStandardMaterial
          color={isAssembled ? '#8B7355' : isSelected ? '#E8C872' : hovered ? '#D4A373' : '#CD853F'}
          roughness={0.8}
          metalness={0.1}
          emissive={isSelected ? '#5D4E37' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>
      
      {!isAssembled && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.2}
          color="#3D2B1F"
          anchorX="center"
          anchorY="middle"
        >
          {bone.name}
        </Text>
      )}
    </group>
  );
};

interface TargetSlotProps {
  bone: BoneFragment;
  isFilled: boolean;
  showOutline: boolean;
}

const TargetSlot: React.FC<TargetSlotProps> = ({ bone, isFilled, showOutline }) => {
  const outlineRef = useRef<THREE.LineSegments>(null);

  useFrame((_, delta) => {
    if (outlineRef.current && showOutline) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1;
      outlineRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const getBoneGeometry = () => {
    switch (bone.type) {
      case 'skull':
        return <sphereGeometry args={[0.82, 32, 32]} />;
      case 'vertebra':
        return <cylinderGeometry args={[0.32, 0.42, 0.52, 16]} />;
      case 'rib':
        return <cylinderGeometry args={[0.12, 0.12, 1.52, 8]} />;
      case 'femur':
        return <cylinderGeometry args={[0.22, 0.27, 2.02, 12]} />;
      case 'tibia':
        return <cylinderGeometry args={[0.17, 0.22, 1.82, 12]} />;
      case 'humerus':
        return <cylinderGeometry args={[0.2, 0.24, 1.62, 12]} />;
      case 'jaw':
        return <boxGeometry args={[1.22, 0.42, 0.62]} />;
      case 'tooth':
        return <coneGeometry args={[0.17, 0.62, 8]} />;
      case 'tail':
        return <cylinderGeometry args={[0.22, 0.12, 3.02, 12]} />;
      default:
        return <boxGeometry args={[1.02, 1.02, 1.02]} />;
    }
  };

  if (isFilled) return null;

  return (
    <group
      position={[
        bone.targetPosition.x,
        bone.targetPosition.y,
        bone.targetPosition.z,
      ]}
      rotation={[
        bone.targetRotation.x,
        bone.targetRotation.y,
        bone.targetRotation.z,
      ]}
    >
      <lineSegments ref={outlineRef}>
        <edgesGeometry args={[getBoneGeometry() as any]} />
        <lineBasicMaterial
          color={showOutline ? '#C4A35A' : '#8B7355'}
          opacity={showOutline ? 0.8 : 0.3}
          transparent
          dashSize={0.1}
          gapSize={0.05}
        />
      </lineSegments>
    </group>
  );
};

interface AssemblySceneProps {
  bones: BoneFragment[];
  excavatedBones: Record<string, boolean>;
  assembledBones: Record<string, { position: Position; rotation: Rotation; correct: boolean }>;
  draggedBone: BoneFragment | null;
  onDragStart: (bone: BoneFragment) => void;
  onDragEnd: (bone: BoneFragment, position: Position, rotation: Rotation) => void;
  selectedBone: BoneFragment | null;
  onSelectBone: (bone: BoneFragment) => void;
  showOutlines: boolean;
}

const AssemblyScene: React.FC<AssemblySceneProps> = ({
  bones,
  excavatedBones,
  assembledBones,
  draggedBone,
  onDragStart,
  onDragEnd,
  selectedBone,
  onSelectBone,
  showOutlines,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const excavatedBoneList = bones.filter((bone) => excavatedBones[bone.id]);
  
  const getInitialPosition = (index: number, total: number): Position => {
    const rows = Math.ceil(Math.sqrt(total));
    const cols = Math.ceil(total / rows);
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacing = 2.5;
    
    return {
      x: -8 + col * spacing,
      y: 1,
      z: -6 + row * spacing,
    };
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 20, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.6} color="#FFF8DC" />
      <pointLight position={[10, 5, -10]} intensity={0.4} color="#DEB887" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
      />

      <group position={[4, 0, 0]}>
        {bones.map((bone) => (
          <TargetSlot
            key={bone.id}
            bone={bone}
            isFilled={!!assembledBones[bone.id]?.correct}
            showOutline={showOutlines && selectedBone?.id === bone.id}
          />
        ))}
      </group>

      {excavatedBoneList.map((bone, index) => {
        const isAssembled = !!assembledBones[bone.id]?.correct;
        const assembledData = assembledBones[bone.id];

        return (
          <DraggableBone
            key={bone.id}
            bone={bone}
            initialPosition={getInitialPosition(index, excavatedBoneList.length)}
            isDragging={draggedBone?.id === bone.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isAssembled={isAssembled}
            assembledPosition={assembledData?.position}
            assembledRotation={assembledData?.rotation}
            isSelected={selectedBone?.id === bone.id}
            onSelect={onSelectBone}
          />
        );
      })}

      <gridHelper args={[30, 30, '#DEB887', '#F5DEB3']} position={[0, -0.01, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      <mesh position={[-5, 0.5, 5]}>
        <boxGeometry args={[8, 0.2, 5]} />
        <meshStandardMaterial color="#DEB887" roughness={0.7} />
      </mesh>
      
      <Text
        position={[-5, 0.8, 5]}
        fontSize={0.3}
        color="#3D2B1F"
        anchorX="center"
        anchorY="middle"
      >
        骨骼碎片区
      </Text>
    </>
  );
};

export default AssemblyScene;
