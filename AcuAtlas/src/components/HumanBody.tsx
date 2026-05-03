import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIVisualizationStore } from '../stores/uiVisualizationStore';

// 简化的人体模型组件
// 使用参数化几何体创建半透明的皮肤、肌肉和骨骼层

export function HumanBody() {
  const { 
    showSkin, 
    showMuscles, 
    showBones, 
    skinOpacity, 
    muscleOpacity, 
    boneOpacity 
  } = useUIVisualizationStore();

  // 身体比例参数
  const bodyParams = useMemo(() => ({
    headRadius: 0.12,
    neckHeight: 0.08,
    neckRadius: 0.06,
    torsoWidth: 0.25,
    torsoHeight: 0.45,
    torsoDepth: 0.15,
    shoulderWidth: 0.38,
    armLength: 0.35,
    armRadius: 0.045,
    forearmRadius: 0.04,
    handSize: 0.08,
    legLength: 0.4,
    legRadius: 0.055,
    calfRadius: 0.05,
    footLength: 0.12,
    footHeight: 0.06
  }), []);

  // 皮肤材质 - 半透明肤色
  const skinMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xFAD6A5,
    transparent: true,
    opacity: skinOpacity,
    roughness: 0.8,
    metalness: 0.0,
    transmission: 0.1,
    thickness: 0.5,
    side: THREE.DoubleSide
  }), [skinOpacity]);

  // 肌肉材质 - 红色半透明
  const muscleMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xE74C3C,
    transparent: true,
    opacity: muscleOpacity,
    roughness: 0.7,
    metalness: 0.0,
    transmission: 0.2,
    thickness: 0.3,
    side: THREE.DoubleSide
  }), [muscleOpacity]);

  // 骨骼材质 - 灰白色半透明
  const boneMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xECF0F1,
    transparent: true,
    opacity: boneOpacity,
    roughness: 0.9,
    metalness: 0.1,
    transmission: 0.1,
    thickness: 0.8,
    side: THREE.DoubleSide
  }), [boneOpacity]);

  // 头部
  const Head = ({ material }: { material: THREE.Material }) => (
    <group>
      {/* 头部球体 */}
      <mesh position={[0, 1.6, 0]} material={material} castShadow>
        <sphereGeometry args={[bodyParams.headRadius, 32, 32]} />
      </mesh>
      {/* 脸部稍微突出 */}
      <mesh position={[0, 1.58, bodyParams.headRadius * 0.6]} material={material}>
        <sphereGeometry args={[bodyParams.headRadius * 0.7, 32, 32]} />
      </mesh>
    </group>
  );

  // 颈部
  const Neck = ({ material }: { material: THREE.Material }) => (
    <mesh 
      position={[0, 1.6 - bodyParams.headRadius - bodyParams.neckHeight / 2, 0]} 
      material={material} 
      castShadow
    >
      <cylinderGeometry args={[bodyParams.neckRadius * 0.8, bodyParams.neckRadius, bodyParams.neckHeight, 16]} />
    </mesh>
  );

  // 躯干
  const Torso = ({ material }: { material: THREE.Material }) => (
    <group>
      {/* 胸部 */}
      <mesh position={[0, 1.35, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.torsoWidth / 2, bodyParams.torsoHeight * 0.6, 16, 32]} />
      </mesh>
      {/* 腹部 */}
      <mesh position={[0, 1.05, 0.02]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.torsoWidth / 2.5, bodyParams.torsoHeight * 0.4, 16, 32]} />
      </mesh>
    </group>
  );

  // 肩膀
  const Shoulder = ({ side, material }: { side: number; material: THREE.Material }) => (
    <mesh 
      position={[side * bodyParams.shoulderWidth / 2, 1.48, 0]} 
      material={material} 
      castShadow
    >
      <sphereGeometry args={[bodyParams.armRadius * 1.3, 16, 16]} />
    </mesh>
  );

  // 手臂（上臂+前臂+手）
  const Arm = ({ side, material }: { side: number; material: THREE.Material }) => (
    <group position={[side * bodyParams.shoulderWidth / 2, 1.48, 0]}>
      {/* 上臂 */}
      <mesh position={[0, -bodyParams.armLength / 2, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.armRadius, bodyParams.armLength - bodyParams.armRadius * 2, 16, 32]} />
      </mesh>
      {/* 肘部关节 */}
      <mesh position={[0, -bodyParams.armLength, 0]} material={material} castShadow>
        <sphereGeometry args={[bodyParams.armRadius * 1.1, 16, 16]} />
      </mesh>
      {/* 前臂 */}
      <mesh position={[0, -bodyParams.armLength - bodyParams.armLength / 2, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.forearmRadius, bodyParams.armLength - bodyParams.forearmRadius * 2, 16, 32]} />
      </mesh>
      {/* 手腕 */}
      <mesh position={[0, -bodyParams.armLength * 2, 0]} material={material} castShadow>
        <sphereGeometry args={[bodyParams.forearmRadius * 1.1, 16, 16]} />
      </mesh>
      {/* 手 */}
      <mesh position={[0, -bodyParams.armLength * 2 - bodyParams.handSize / 2, 0.02]} material={material} castShadow>
        <boxGeometry args={[bodyParams.handSize * 0.7, bodyParams.handSize, bodyParams.handSize * 0.3]} />
      </mesh>
    </group>
  );

  // 臀部
  const Hip = ({ material }: { material: THREE.Material }) => (
    <group>
      <mesh position={[0, 0.88, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.torsoWidth / 2.5, 0.1, 16, 32]} />
      </mesh>
    </group>
  );

  // 腿（大腿+小腿+脚）
  const Leg = ({ side, material }: { side: number; material: THREE.Material }) => (
    <group position={[side * 0.08, 0.88, 0]}>
      {/* 大腿 */}
      <mesh position={[0, -bodyParams.legLength / 2, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.legRadius, bodyParams.legLength - bodyParams.legRadius * 2, 16, 32]} />
      </mesh>
      {/* 膝盖 */}
      <mesh position={[0, -bodyParams.legLength, 0]} material={material} castShadow>
        <sphereGeometry args={[bodyParams.legRadius * 1.2, 16, 16]} />
      </mesh>
      {/* 小腿 */}
      <mesh position={[0, -bodyParams.legLength - bodyParams.legLength / 2, 0]} material={material} castShadow>
        <capsuleGeometry args={[bodyParams.calfRadius, bodyParams.legLength - bodyParams.calfRadius * 2, 16, 32]} />
      </mesh>
      {/* 脚踝 */}
      <mesh position={[0, -bodyParams.legLength * 2, 0]} material={material} castShadow>
        <sphereGeometry args={[bodyParams.calfRadius * 0.9, 16, 16]} />
      </mesh>
      {/* 脚 */}
      <mesh position={[0, -bodyParams.legLength * 2 - bodyParams.footHeight / 2, bodyParams.footLength / 4]} material={material} castShadow>
        <boxGeometry args={[bodyParams.footHeight, bodyParams.footHeight, bodyParams.footLength]} />
      </mesh>
    </group>
  );

  // 骨骼系统 - 简化的骨骼结构
  const Skeleton = () => (
    <group>
      {/* 头骨 */}
      <mesh position={[0, 1.6, 0]} material={boneMaterial} castShadow>
        <sphereGeometry args={[bodyParams.headRadius * 0.85, 24, 24]} />
      </mesh>
      
      {/* 脊柱 */}
      <mesh position={[0, 1.25, -0.02]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.6, 12]} />
      </mesh>
      
      {/* 锁骨 */}
      <mesh position={[0.15, 1.48, 0]} rotation={[0, 0, Math.PI / 6]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 8]} />
      </mesh>
      <mesh position={[-0.15, 1.48, 0]} rotation={[0, 0, -Math.PI / 6]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 8]} />
      </mesh>
      
      {/* 肩胛骨 */}
      <mesh position={[0.18, 1.35, -0.05]} material={boneMaterial} castShadow>
        <boxGeometry args={[0.02, 0.15, 0.1]} />
      </mesh>
      <mesh position={[-0.18, 1.35, -0.05]} material={boneMaterial} castShadow>
        <boxGeometry args={[0.02, 0.15, 0.1]} />
      </mesh>
      
      {/* 肱骨（上臂骨） */}
      <mesh position={[0.19, 1.15, 0]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.32, 8]} />
      </mesh>
      <mesh position={[-0.19, 1.15, 0]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.32, 8]} />
      </mesh>
      
      {/* 桡骨和尺骨（前臂骨） */}
      <mesh position={[0.19, 0.8, 0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.007, 0.008, 0.28, 8]} />
      </mesh>
      <mesh position={[0.17, 0.8, -0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.007, 0.008, 0.28, 8]} />
      </mesh>
      <mesh position={[-0.19, 0.8, 0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.007, 0.008, 0.28, 8]} />
      </mesh>
      <mesh position={[-0.17, 0.8, -0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.007, 0.008, 0.28, 8]} />
      </mesh>
      
      {/* 骨盆 */}
      <mesh position={[0, 0.88, -0.02]} material={boneMaterial} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.1]} />
      </mesh>
      
      {/* 股骨（大腿骨） */}
      <mesh position={[0.08, 0.6, 0]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.012, 0.015, 0.36, 8]} />
      </mesh>
      <mesh position={[-0.08, 0.6, 0]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.012, 0.015, 0.36, 8]} />
      </mesh>
      
      {/* 胫骨和腓骨（小腿骨） */}
      <mesh position={[0.08, 0.25, 0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.34, 8]} />
      </mesh>
      <mesh position={[0.095, 0.25, -0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.006, 0.007, 0.32, 8]} />
      </mesh>
      <mesh position={[-0.08, 0.25, 0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.34, 8]} />
      </mesh>
      <mesh position={[-0.095, 0.25, -0.01]} material={boneMaterial} castShadow>
        <cylinderGeometry args={[0.006, 0.007, 0.32, 8]} />
      </mesh>
      
      {/* 足骨 */}
      <mesh position={[0.08, 0.05, 0.03]} material={boneMaterial} castShadow>
        <boxGeometry args={[0.015, 0.02, 0.08]} />
      </mesh>
      <mesh position={[-0.08, 0.05, 0.03]} material={boneMaterial} castShadow>
        <boxGeometry args={[0.015, 0.02, 0.08]} />
      </mesh>
    </group>
  );

  // 呼吸动画
  useFrame(() => {
    // 可以在这里添加呼吸动画等效果
  });

  return (
    <group>
      {/* 皮肤层 */}
      {showSkin && (
        <group>
          <Head material={skinMaterial} />
          <Neck material={skinMaterial} />
          <Torso material={skinMaterial} />
          <Shoulder side={1} material={skinMaterial} />
          <Shoulder side={-1} material={skinMaterial} />
          <Arm side={1} material={skinMaterial} />
          <Arm side={-1} material={skinMaterial} />
          <Hip material={skinMaterial} />
          <Leg side={1} material={skinMaterial} />
          <Leg side={-1} material={skinMaterial} />
        </group>
      )}
      
      {/* 肌肉层 */}
      {showMuscles && (
        <group>
          {/* 头部肌肉 */}
          <mesh position={[0, 1.58, 0.02]} material={muscleMaterial} castShadow>
            <sphereGeometry args={[bodyParams.headRadius * 0.92, 24, 24]} />
          </mesh>
          
          {/* 胸肌 */}
          <mesh position={[0.08, 1.32, 0.08]} material={muscleMaterial} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
          </mesh>
          <mesh position={[-0.08, 1.32, 0.08]} material={muscleMaterial} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
          </mesh>
          
          {/* 斜方肌 */}
          <mesh position={[0, 1.45, -0.03]} material={muscleMaterial} castShadow>
            <boxGeometry args={[0.25, 0.08, 0.05]} />
          </mesh>
          
          {/* 手臂肌肉 */}
          {/* 二头肌 */}
          <mesh position={[0.19, 1.2, 0.05]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.02, 0.12, 12, 24]} />
          </mesh>
          <mesh position={[-0.19, 1.2, 0.05]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.02, 0.12, 12, 24]} />
          </mesh>
          
          {/* 三头肌 */}
          <mesh position={[0.19, 1.2, -0.05]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.018, 0.15, 12, 24]} />
          </mesh>
          <mesh position={[-0.19, 1.2, -0.05]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.018, 0.15, 12, 24]} />
          </mesh>
          
          {/* 前臂肌肉 */}
          <mesh position={[0.19, 0.85, 0]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.018, 0.18, 12, 24]} />
          </mesh>
          <mesh position={[-0.19, 0.85, 0]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.018, 0.18, 12, 24]} />
          </mesh>
          
          {/* 腹部肌肉 */}
          <mesh position={[0, 1.1, 0.06]} material={muscleMaterial} castShadow>
            <boxGeometry args={[0.12, 0.15, 0.03]} />
          </mesh>
          
          {/* 大腿肌肉 */}
          <mesh position={[0.08, 0.65, 0.03]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.025, 0.25, 12, 24]} />
          </mesh>
          <mesh position={[-0.08, 0.65, 0.03]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.025, 0.25, 12, 24]} />
          </mesh>
          
          {/* 小腿肌肉（腓肠肌） */}
          <mesh position={[0.08, 0.3, 0.02]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.02, 0.2, 12, 24]} />
          </mesh>
          <mesh position={[-0.08, 0.3, 0.02]} material={muscleMaterial} castShadow>
            <capsuleGeometry args={[0.02, 0.2, 12, 24]} />
          </mesh>
        </group>
      )}
      
      {/* 骨骼层 */}
      {showBones && <Skeleton />}
    </group>
  );
}
