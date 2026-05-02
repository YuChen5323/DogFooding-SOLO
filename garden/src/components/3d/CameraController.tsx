import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame, useThree as useThreeImpl } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGardenStore } from '../../store';
import type { CameraMode, Position3D } from '../../types';

interface CameraControllerProps {
  gridSize: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({ gridSize }) => {
  const { cameraState, setCameraState } = useGardenStore();
  const { camera, gl, viewport } = useThree();
  const controlsRef = useRef<any>(null);
  
  const gridHalfSize = (gridSize * 2) / 2;
  const isFirstPerson = cameraState.mode === 'firstperson';
  
  const velocityRef = useRef(new THREE.Vector3());
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, isLocked: false });
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isFirstPerson) {
      keysRef.current.add(e.code);
    }
  }, [isFirstPerson]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (mouseRef.current.isLocked) {
      eulerRef.current.y -= e.movementX * 0.002;
      eulerRef.current.x -= e.movementY * 0.002;
      eulerRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, eulerRef.current.x));
    }
  }, []);
  
  const handlePointerLockChange = useCallback(() => {
    mouseRef.current.isLocked = document.pointerLockElement === gl.domElement;
  }, [gl.domElement]);
  
  const handleCanvasClick = useCallback(() => {
    if (isFirstPerson && !mouseRef.current.isLocked) {
      gl.domElement.requestPointerLock?.();
    }
  }, [isFirstPerson, gl.domElement]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handlePointerLockChange]);
  
  useEffect(() => {
    if (controlsRef.current && !isFirstPerson) {
      const { position, target } = cameraState;
      controlsRef.current.target.set(target.x, target.y, target.z);
      controlsRef.current.update();
    }
  }, [cameraState, isFirstPerson]);
  
  useFrame((_, delta) => {
    if (isFirstPerson) {
      const speed = 8 * delta;
      const keys = keysRef.current;
      
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();
      
      const up = new THREE.Vector3(0, 1, 0);
      
      if (keys.has('KeyW') || keys.has('ArrowUp')) {
        camera.position.addScaledVector(forward, speed);
      }
      if (keys.has('KeyS') || keys.has('ArrowDown')) {
        camera.position.addScaledVector(forward, -speed);
      }
      if (keys.has('KeyA') || keys.has('ArrowLeft')) {
        camera.position.addScaledVector(right, -speed);
      }
      if (keys.has('KeyD') || keys.has('ArrowRight')) {
        camera.position.addScaledVector(right, speed);
      }
      if (keys.has('Space')) {
        camera.position.addScaledVector(up, speed);
      }
      if (keys.has('ShiftLeft') || keys.has('ShiftRight')) {
        camera.position.addScaledVector(up, -speed);
      }
      
      camera.position.x = Math.max(-gridHalfSize - 5, Math.min(gridHalfSize + 5, camera.position.x));
      camera.position.z = Math.max(-gridHalfSize - 5, Math.min(gridHalfSize + 5, camera.position.z));
      camera.position.y = Math.max(0.5, Math.min(50, camera.position.y));
      
      camera.quaternion.setFromEuler(eulerRef.current);
      
      setCameraState({
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        },
      });
    }
  });
  
  useEffect(() => {
    const { position, target, fov } = cameraState;
    
    if (!isFirstPerson) {
      if (controlsRef.current) {
        controlsRef.current.target.set(target.x, target.y, target.z);
      }
    } else {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      camera.position.set(position.x, position.y, position.z);
      eulerRef.current.set(0, 0, 0);
    }
  }, [cameraState.mode, isFirstPerson]);
  
  if (isFirstPerson) {
    return (
      <>
        <PerspectiveCamera
          makeDefault
          position={[cameraState.position.x, cameraState.position.y, cameraState.position.z]}
          fov={cameraState.fov}
        />
        <pointerLockControls
          ref={controlsRef}
          args={[camera, gl.domElement]}
        />
      </>
    );
  }
  
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[cameraState.position.x, cameraState.position.y, cameraState.position.z]}
        fov={cameraState.fov}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={gridHalfSize * 4}
        maxPolarAngle={Math.PI / 2.1}
        target={[cameraState.target.x, cameraState.target.y, cameraState.target.z]}
        enablePan={true}
        screenSpacePanning={false}
      />
    </>
  );
};

export const LightingSystem: React.FC = () => {
  const { lightSettings, globalParams } = useGardenStore();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  
  const sunPosition = lightSettings.sunPosition;
  const sunColor = new THREE.Color(lightSettings.sunColor);
  const ambientColor = new THREE.Color(lightSettings.ambientColor);
  const fogColor = new THREE.Color(lightSettings.fogColor);
  
  const { scene } = useThree();
  
  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, lightSettings.fogDensity);
  }, [scene, fogColor, lightSettings.fogDensity]);
  
  const isNight = globalParams.timeOfDay === 'night';
  
  return (
    <>
      <ambientLight
        ref={ambientRef}
        color={ambientColor}
        intensity={lightSettings.ambientIntensity}
      />
      
      <directionalLight
        ref={sunRef}
        color={sunColor}
        intensity={lightSettings.sunIntensity}
        position={[sunPosition.x, sunPosition.y, sunPosition.z]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      
      {isNight && (
        <>
          <pointLight
            position={[0, 15, 0]}
            color={0x8899aa}
            intensity={0.3}
            distance={100}
          />
          <hemisphereLight
            color={0x445566}
            groundColor={0x112233}
            intensity={0.1}
          />
        </>
      )}
      
      {!isNight && (
        <hemisphereLight
          color={0x88ccff}
          groundColor={0x446644}
          intensity={0.3}
        />
      )}
    </>
  );
};

export const GroundPlane: React.FC<{ size: number }> = ({ size }) => {
  const { globalParams } = useGardenStore();
  
  const groundColor = useCallback(() => {
    switch (globalParams.season) {
      case 'spring':
        return 0x7cb342;
      case 'summer':
        return 0x558b2f;
      case 'autumn':
        return 0x8b7355;
      case 'winter':
        return 0xc5c5c5;
      default:
        return 0x7cb342;
    }
  }, [globalParams.season]);
  
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={groundColor()}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
      
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[size + 50, size + 50]} />
        <meshStandardMaterial
          color={0x4a4a4a}
          roughness={1}
          metalness={0.0}
        />
      </mesh>
    </>
  );
};
