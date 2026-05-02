import React, { useState, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BoneFragment, Position, Rotation } from '../types';

interface JointLimit {
  name: string;
  position: Position;
  minRotation: Rotation;
  maxRotation: Rotation;
  currentRotation: Rotation;
}

interface MuscleVolume {
  name: string;
  position: Position;
  rotation: Rotation;
  scale: Position;
  color: string;
  opacity: number;
}

interface AssemblyBone {
  bone: BoneFragment;
  position: Position;
  rotation: Rotation;
  correct: boolean;
}

type AnimationType = 'idle' | 'walk' | 'attack' | 'roar';

interface ReconstructionSceneProps {
  assembledBones: AssemblyBone[];
  animationType: AnimationType;
  isPlaying: boolean;
  animationSpeed: number;
  showMuscles: boolean;
  showJoints: boolean;
}

const getBoneGeometry = (type: string) => {
  switch (type) {
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

const BoneMesh: React.FC<{
  position: Position;
  rotation: Rotation;
  type: string;
  animationOffset?: number;
  animationType: AnimationType;
  isPlaying: boolean;
  animationSpeed: number;
}> = ({
  position,
  rotation,
  type,
  animationOffset = 0,
  animationType,
  isPlaying,
  animationSpeed,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!isPlaying || !groupRef.current) return;

    const time = state.clock.getElapsedTime() * animationSpeed;
    const offsetTime = time + animationOffset;

    switch (animationType) {
      case 'walk':
        const walkY = Math.sin(time * 5) * 0.05;
        groupRef.current.position.y = position.y + walkY;
        
        if (type === 'femur' || type === 'tibia') {
          const legRotation = Math.sin(offsetTime * 5) * 0.3;
          groupRef.current.rotation.x = rotation.x + legRotation;
        }
        break;
      case 'attack':
        const attackPhase = Math.sin(offsetTime * 4) * 0.5;
        if (type === 'skull') {
          groupRef.current.rotation.x = rotation.x + attackPhase * 0.3;
          groupRef.current.position.y = position.y + Math.abs(attackPhase) * 0.2;
        }
        if (type === 'jaw') {
          const jawOpen = Math.max(0, Math.sin(time * 6)) * 0.5;
          groupRef.current.rotation.x = rotation.x - jawOpen;
        }
        break;
      case 'roar':
        const roarPhase = Math.sin(time * 2) * 0.5;
        groupRef.current.position.y = position.y + Math.abs(roarPhase) * 0.1;
        if (type === 'jaw') {
          const jawOpen = Math.max(0, Math.sin(time * 3)) * 0.6;
          groupRef.current.rotation.x = rotation.x - jawOpen;
        }
        break;
      case 'idle':
      default:
        const breathe = Math.sin(time * 2 + animationOffset) * 0.02;
        groupRef.current.position.y = position.y + breathe;
        break;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        {getBoneGeometry(type)}
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

const MuscleMesh: React.FC<{
  muscle: MuscleVolume;
  animationOffset: number;
  animationType: AnimationType;
  isPlaying: boolean;
  animationSpeed: number;
}> = ({ muscle, animationOffset, animationType, isPlaying, animationSpeed }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!isPlaying || !meshRef.current) return;

    const time = state.clock.getElapsedTime() * animationSpeed;
    const offsetTime = time + animationOffset;

    let flex = 1;
    switch (animationType) {
      case 'walk':
        flex = 1 + Math.sin(offsetTime * 5) * 0.05;
        break;
      case 'attack':
        flex = 1 + Math.max(0, Math.sin(time * 4)) * 0.15;
        break;
      default:
        flex = 1 + Math.sin(time * 2 + animationOffset) * 0.02;
        break;
    }

    meshRef.current.scale.set(
      muscle.scale.x * flex,
      muscle.scale.y / flex,
      muscle.scale.z * flex
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={[muscle.position.x, muscle.position.y, muscle.position.z]}
      rotation={[muscle.rotation.x, muscle.rotation.y, muscle.rotation.z]}
      castShadow
    >
      <capsuleGeometry args={[0.3, 1.5, 8, 16]} />
      <meshStandardMaterial
        color={muscle.color}
        transparent
        opacity={muscle.opacity}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
};

const JointIndicator: React.FC<{
  joint: JointLimit;
}> = ({ joint }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = time * 0.5;
  });

  return (
    <group
      ref={groupRef}
      position={[joint.position.x, joint.position.y, joint.position.z]}
    >
      <mesh>
        <ringGeometry args={[0.2, 0.3, 32]} />
        <meshBasicMaterial color="#C4A35A" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.3, 32]} />
        <meshBasicMaterial color="#DEB887" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const ReconstructionScene: React.FC<ReconstructionSceneProps> = ({
  assembledBones,
  animationType,
  isPlaying,
  animationSpeed,
  showMuscles,
  showJoints,
}) => {
  const { camera } = useThree();

  React.useEffect(() => {
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 1.5, 0);
  }, [camera]);

  const muscles: MuscleVolume[] = useMemo(
    () => [
      {
        name: '颈肌',
        position: { x: 0, y: 2.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.8, y: 0.8, z: 0.8 },
        color: '#CD853F',
        opacity: 0.6,
      },
      {
        name: '胸肌',
        position: { x: -0.8, y: 1.8, z: 0 },
        rotation: { x: 0, y: 0, z: 0.1 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#DEB887',
        opacity: 0.6,
      },
      {
        name: '胸肌',
        position: { x: 0.8, y: 1.8, z: 0 },
        rotation: { x: 0, y: 0, z: -0.1 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#DEB887',
        opacity: 0.6,
      },
      {
        name: '腹肌',
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1, z: 0.8 },
        color: '#D2B48C',
        opacity: 0.6,
      },
      {
        name: '腿部肌肉',
        position: { x: -0.6, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.8, y: 1.2, z: 0.8 },
        color: '#CD853F',
        opacity: 0.6,
      },
      {
        name: '腿部肌肉',
        position: { x: 0.6, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.8, y: 1.2, z: 0.8 },
        color: '#CD853F',
        opacity: 0.6,
      },
      {
        name: '尾部肌肉',
        position: { x: 0, y: 0.8, z: -1.5 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.6, y: 0.6, z: 1.5 },
        color: '#DEB887',
        opacity: 0.6,
      },
    ],
    []
  );

  const joints: JointLimit[] = useMemo(
    () => [
      {
        name: '颈关节',
        position: { x: 0, y: 2.8, z: 0 },
        minRotation: { x: -0.5, y: -0.3, z: -0.2 },
        maxRotation: { x: 0.5, y: 0.3, z: 0.2 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
      {
        name: '肩关节',
        position: { x: -1, y: 2, z: 0 },
        minRotation: { x: -1, y: -0.5, z: -0.3 },
        maxRotation: { x: 1, y: 0.5, z: 0.3 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
      {
        name: '肩关节',
        position: { x: 1, y: 2, z: 0 },
        minRotation: { x: -1, y: -0.5, z: -0.3 },
        maxRotation: { x: 1, y: 0.5, z: 0.3 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
      {
        name: '髋关节',
        position: { x: -0.5, y: 1, z: 0 },
        minRotation: { x: -0.8, y: -0.2, z: -0.1 },
        maxRotation: { x: 0.8, y: 0.2, z: 0.1 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
      {
        name: '髋关节',
        position: { x: 0.5, y: 1, z: 0 },
        minRotation: { x: -0.8, y: -0.2, z: -0.1 },
        maxRotation: { x: 0.8, y: 0.2, z: 0.1 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
      {
        name: '尾关节',
        position: { x: 0, y: 1, z: -1 },
        minRotation: { x: -0.3, y: -0.5, z: -0.1 },
        maxRotation: { x: 0.3, y: 0.5, z: 0.1 },
        currentRotation: { x: 0, y: 0, z: 0 },
      },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-8, 8, -8]} intensity={0.5} color="#FFF8DC" />
      <pointLight position={[8, 5, -8]} intensity={0.4} color="#DEB887" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        target={[0, 1.5, 0]}
      />

      <group position={[0, 0, 0]}>
        {assembledBones.map((ab, index) => (
          <BoneMesh
            key={ab.bone.id}
            position={ab.position}
            rotation={ab.rotation}
            type={ab.bone.type}
            animationOffset={index * 0.2}
            animationType={animationType}
            isPlaying={isPlaying}
            animationSpeed={animationSpeed}
          />
        ))}

        {assembledBones.length === 0 && (
          <>
            <group position={[0, 3.5, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[0, 2.8, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.3, 0.6, 0.3]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[0, 1.5, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.8, 1, 2, 12]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[-0.5, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.25, 1.5, 12]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[0.5, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.25, 1.5, 12]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[0, 1, -2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.25, 0.1, 2.5, 12]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
          </>
        )}

        {showMuscles &&
          muscles.map((muscle, index) => (
            <MuscleMesh
              key={`muscle-${index}`}
              muscle={muscle}
              animationOffset={index * 0.1}
              animationType={animationType}
              isPlaying={isPlaying}
              animationSpeed={animationSpeed}
            />
          ))}

        {showJoints &&
          joints.map((joint, index) => (
            <JointIndicator key={`joint-${index}`} joint={joint} />
          ))}
      </group>

      <gridHelper args={[15, 15, '#DEB887', '#F5DEB3']} position={[0, -0.01, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      <Text
        position={[0, 5, 0]}
        fontSize={0.4}
        color="#3D2B1F"
        anchorX="center"
        anchorY="middle"
      >
        {animationType === 'idle' && '站立姿态'}
        {animationType === 'walk' && '行走动画'}
        {animationType === 'attack' && '捕食攻击'}
        {animationType === 'roar' && '吼叫姿态'}
      </Text>
    </>
  );
};

export default ReconstructionScene;
