import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MuseumSceneProps {
  fossilName: string;
  species: string;
  period: string;
  description: string;
  finalScore: number;
  isRotating: boolean;
  rotationSpeed: number;
}

const MuseumScene: React.FC<MuseumSceneProps> = ({
  fossilName,
  species,
  period,
  description,
  finalScore,
  isRotating,
  rotationSpeed,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isRotating) {
      groupRef.current.rotation.y += rotationSpeed * 0.01;
    }

    const breathe = Math.sin(state.clock.getElapsedTime() * 1) * 0.02;
    if (groupRef.current.children[0]) {
      groupRef.current.children[0].position.y = 1.2 + breathe;
    }
  });

  const spotLightRef = useRef<THREE.SpotLight>(null);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <spotLight
        ref={spotLightRef}
        position={[0, 8, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#FFF8DC"
        castShadow
      />
      <pointLight position={[-5, 5, 5]} intensity={0.4} color="#DEB887" />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#DEB887" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1, 0]}
      />

      <group ref={groupRef}>
        <group position={[0, 1.2, 0]}>
          <group position={[0, 2.5, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial
                color="#8B7355"
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>
            <mesh position={[-0.2, -0.3, -0.6]} castShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="#3D2B1F" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0.2, -0.3, -0.6]} castShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="#3D2B1F" roughness={0.3} metalness={0.5} />
            </mesh>
            <group position={[0, -0.8, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.5, 0.4, 0.8]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
              {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[-0.4 + i * 0.16, -0.3, 0.2]} castShadow>
                  <coneGeometry args={[0.06, 0.25, 8]} />
                  <meshStandardMaterial color="#FFF8DC" roughness={0.2} metalness={0.1} />
                </mesh>
              ))}
            </group>
          </group>

          <group position={[0, 2, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.3, 0.6, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
          </group>

          <group position={[0, 0.8, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[1.2, 1.5, 2.2, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
            {[...Array(10)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(i * 0.6) * 1.2,
                  1,
                  Math.sin(i * 0.6) * 1.2,
                ]}
                rotation={[0, i * 0.6, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.08, 0.1, 1.8, 8]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            ))}
          </group>

          <group position={[-0.7, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.35, 0.4, 0.3, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
            <mesh position={[0, -1, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.35, 2, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
          </group>

          <group position={[0.7, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.35, 0.4, 0.3, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
            <mesh position={[0, -1, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.35, 2, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
          </group>

          <group position={[0, 0.5, -2.5]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.4, 0.2, 4, 12]} />
              <meshStandardMaterial color="#8B7355" roughness={0.8} />
            </mesh>
            <group position={[0, -2.2, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#8B7355" roughness={0.8} />
              </mesh>
            </group>
            <group position={[0, -2.5, 0]}>
              {[...Array(8)].map((_, i) => (
                <mesh
                  key={i}
                  position={[Math.cos(i * 0.8) * 0.3, 0, Math.sin(i * 0.8) * 0.3]}
                  rotation={[0, i * 0.8, -0.3]}
                  castShadow
                >
                  <coneGeometry args={[0.08, 0.4, 6]} />
                  <meshStandardMaterial color="#3D2B1F" roughness={0.5} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        <mesh ref={pedestalRef} position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3.5, 0.5, 32]} />
          <meshStandardMaterial
            color="#A67B5B"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.5, 4, 0.5, 32]} />
          <meshStandardMaterial
            color="#8B7355"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#6B4423" roughness={0.9} />
      </mesh>

      <mesh position={[0, 5, -10]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#5D4037" side={THREE.DoubleSide} />
      </mesh>

      {[-5, 5].map((x, i) => (
        <group key={`pillar-${i}`} position={[x, 3, -8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.6, 6, 16]} />
            <meshStandardMaterial color="#795548" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[1.5, 0.3, 1.5]} />
            <meshStandardMaterial color="#8B7355" roughness={0.8} />
          </mesh>
          <mesh position={[0, -3.2, 0]} receiveShadow>
            <boxGeometry args={[1.8, 0.4, 1.8]} />
            <meshStandardMaterial color="#6B4423" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <Text
        position={[0, 4.5, 0]}
        fontSize={0.6}
        color="#FFF8DC"
        anchorX="center"
        anchorY="middle"
      >
        {fossilName}
      </Text>
      <Text
        position={[0, 3.8, 0]}
        fontSize={0.3}
        color="#DEB887"
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
      >
        {species}
      </Text>

      <Html position={[0, -0.8, 3]} transform rotation={[0, 0, 0]}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%)',
            border: '3px solid #A67B5B',
            borderRadius: 8,
            padding: 16,
            minWidth: 280,
            maxWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#3D2B1F',
              marginBottom: 8,
              textAlign: 'center',
              borderBottom: '2px solid #A67B5B',
              paddingBottom: 8,
            }}
          >
            🏛️ {fossilName}
          </div>
          <div style={{ fontSize: 12, color: '#6B4423', marginBottom: 8 }}>
            <div style={{ marginBottom: 4 }}>
              <strong>学名:</strong> <em>{species}</em>
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>年代:</strong> {period}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#5D4037',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {description}
          </div>
          <div
            style={{
              borderTop: '1px solid #A67B5B',
              paddingTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 10, color: '#8B7355' }}>
              展览等级
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: finalScore >= 1000 ? '#FFD700' : finalScore >= 500 ? '#C0C0C0' : '#CD7F32',
              }}
            >
              {finalScore >= 1000 ? '⭐⭐⭐' : finalScore >= 500 ? '⭐⭐' : '⭐'}
            </div>
          </div>
        </div>
      </Html>

      {[
        [-3, 0, -6],
        [3, 0, -6],
        [-3, 0, 6],
        [3, 0, 6],
      ].map(([x, y, z], i) => (
        <group key={`light-${i}`} position={[x, y + 4, z]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.15, 0.5, 8]} />
            <meshStandardMaterial color="#3D2B1F" />
          </mesh>
          <pointLight intensity={0.5} color="#FFF8DC" distance={8} />
        </group>
      ))}
    </>
  );
};

export default MuseumScene;
