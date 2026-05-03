import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PhysicsEngine, { getPhysicsEngine, ColliderShape, PhysicsBodyType } from '../utils/physicsEngine';

/**
 * 物理体组件属性
 */
interface PhysicsBodyProps {
  id?: string;
  bodyType?: PhysicsBodyType;
  colliderShape?: ColliderShape;
  colliderDimensions?: number[];
  mass?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  linearVelocity?: [number, number, number];
  angularVelocity?: [number, number, number];
  children: React.ReactNode;
  onCollision?: (otherId: string) => void;
  onCollisionEnd?: (otherId: string) => void;
  onSleep?: () => void;
  onWake?: () => void;
}

/**
 * 物理体组件
 * 将 Three.js 对象与物理引擎关联
 */
export function PhysicsBody({
  id,
  bodyType = 'dynamic',
  colliderShape = 'cuboid',
  colliderDimensions,
  mass = 1.0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  linearVelocity,
  angularVelocity,
  children,
  onCollision,
  onCollisionEnd,
  onSleep,
  onWake,
}: PhysicsBodyProps) {
  const meshRef = useRef<THREE.Group | null>(null);
  const bodyIdRef = useRef<string | null>(null);
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);

  // 初始化物理引擎
  useEffect(() => {
    const physicsEngine = getPhysicsEngine();
    
    if (!physicsEngine['initialized']) {
      physicsEngine.initialize().then(() => {
        setEngine(physicsEngine);
      });
    } else {
      setEngine(physicsEngine);
    }

    return () => {
      // 清理工作由 PhysicsScene 处理
    };
  }, []);

  // 创建物理体
  useEffect(() => {
    if (!engine || !meshRef.current) return;

    // 计算边界盒以获取默认尺寸
    const box = new THREE.Box3().setFromObject(meshRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);

    const halfWidth = size.x / 2 || 0.5;
    const halfHeight = size.y / 2 || 0.5;
    const halfDepth = size.z / 2 || 0.5;

    // 使用提供的尺寸或计算得到的尺寸
    const dimensions = colliderDimensions || (
      colliderShape === 'cuboid' ? [halfWidth, halfHeight, halfDepth] :
      colliderShape === 'ball' ? [Math.max(halfWidth, halfHeight, halfDepth)] :
      [halfHeight, Math.max(halfWidth, halfDepth)]
    );

    // 创建物理体
    const bodyId = engine.createBody({
      id,
      bodyType,
      position,
      rotation: [
        (rotation[0] * Math.PI) / 180,
        (rotation[1] * Math.PI) / 180,
        (rotation[2] * Math.PI) / 180,
      ],
      linearVelocity,
      angularVelocity,
      canSleep: true,
      ccdEnabled: true,
    });

    // 添加碰撞器
    engine.addCollider(bodyId, {
      shape: colliderShape,
      dimensions,
      density: mass,
    });

    bodyIdRef.current = bodyId;

    return () => {
      if (bodyIdRef.current && engine) {
        engine.removeBody(bodyIdRef.current);
        bodyIdRef.current = null;
      }
    };
  }, [engine, id, bodyType, colliderShape, colliderDimensions, mass, position, rotation]);

  // 设置碰撞回调
  useEffect(() => {
    if (!engine || !bodyIdRef.current) return;

    const handleCollision = (body1Id: string, body2Id: string) => {
      if (bodyIdRef.current === body1Id && onCollision) {
        onCollision(body2Id);
      } else if (bodyIdRef.current === body2Id && onCollision) {
        onCollision(body1Id);
      }
    };

    const handleCollisionEnd = (body1Id: string, body2Id: string) => {
      if (bodyIdRef.current === body1Id && onCollisionEnd) {
        onCollisionEnd(body2Id);
      } else if (bodyIdRef.current === body2Id && onCollisionEnd) {
        onCollisionEnd(body1Id);
      }
    };

    const handleSleep = (bodyId: string) => {
      if (bodyIdRef.current === bodyId && onSleep) {
        onSleep();
      }
    };

    const handleWake = (bodyId: string) => {
      if (bodyIdRef.current === bodyId && onWake) {
        onWake();
      }
    };

    engine.setCallbacks({
      onCollision: handleCollision,
      onCollisionEnd: handleCollisionEnd,
      onBodySleep: handleSleep,
      onBodyWake: handleWake,
    });
  }, [engine, onCollision, onCollisionEnd, onSleep, onWake]);

  // 每帧同步位置
  useFrame((_, delta) => {
    if (!engine || !meshRef.current || !bodyIdRef.current) return;

    // 更新物理引擎
    engine.update(delta);

    // 同步渲染位置
    if (bodyType === 'dynamic' || bodyType === 'kinematic') {
      const pos = engine.getBodyPosition(bodyIdRef.current);
      const rot = engine.getBodyRotation(bodyIdRef.current);

      if (pos && rot) {
        meshRef.current.position.set(pos[0], pos[1], pos[2]);
        meshRef.current.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {children}
    </group>
  );
}

/**
 * 地面物理体
 */
interface PhysicsGroundProps {
  size?: [number, number];
  position?: [number, number, number];
}

export function PhysicsGround({
  size = [100, 100],
  position = [0, -0.5, 0],
}: PhysicsGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);
  const bodyIdRef = useRef<string | null>(null);

  useEffect(() => {
    const physicsEngine = getPhysicsEngine();
    
    if (!physicsEngine['initialized']) {
      physicsEngine.initialize().then(() => {
        setEngine(physicsEngine);
      });
    } else {
      setEngine(physicsEngine);
    }
  }, []);

  useEffect(() => {
    if (!engine) return;

    // 创建静态地面
    const bodyId = engine.createBody({
      id: 'ground',
      bodyType: 'static',
      position,
    });

    // 添加碰撞器 (薄长方体)
    engine.addCollider(bodyId, {
      shape: 'cuboid',
      dimensions: [size[0] / 2, 0.1, size[1] / 2],
    });

    bodyIdRef.current = bodyId;

    return () => {
      if (bodyIdRef.current && engine) {
        engine.removeBody(bodyIdRef.current);
        bodyIdRef.current = null;
      }
    };
  }, [engine, size, position]);

  return (
    <mesh ref={meshRef} position={position} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial 
        color="#e0e0e0" 
        transparent 
        opacity={0.3}
      />
    </mesh>
  );
}

/**
 * 物理场景容器
 */
interface PhysicsSceneProps {
  children: React.ReactNode;
  gravity?: [number, number, number];
}

export function PhysicsScene({
  children,
  gravity = [0, -9.81, 0],
}: PhysicsSceneProps) {
  const [engine, setEngine] = useState<PhysicsEngine | null>(null);

  useEffect(() => {
    const physicsEngine = getPhysicsEngine();
    
    const init = async () => {
      if (!physicsEngine['initialized']) {
        await physicsEngine.initialize();
      }
      physicsEngine.setGravity(gravity[0], gravity[1], gravity[2]);
      setEngine(physicsEngine);
    };

    init();

    return () => {
      // 不销毁引擎，因为可能还有其他组件在使用
    };
  }, [gravity]);

  return <>{children}</>;
}

export default PhysicsScene;
