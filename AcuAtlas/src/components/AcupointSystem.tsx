import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Acupoint, Point3D } from '../types';
import { useAcupointStore } from '../stores/acupointStore';
import { useUIVisualizationStore } from '../stores/uiVisualizationStore';
import { ACUPOINTS } from '../data/acupointData';

// 穴位标记组件
function AcupointMarker({ 
  acupoint, 
  position, 
  isSelected,
  onClick 
}: { 
  acupoint: Acupoint; 
  position: Point3D; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const { isInsertionMode } = useAcupointStore();
  
  // 脉冲动画
  useFrame((state) => {
    if (meshRef.current) {
      const scale = isSelected 
        ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1 
        : 1;
      meshRef.current.scale.setScalar(scale);
    }
    
    if (glowRef.current && isSelected) {
      const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });
  
  // 根据是否有特殊属性确定颜色
  const getColor = () => {
    if (isSelected) return 0xE74C3C; // 选中时红色
    
    // 特定穴位颜色
    if ('isYuanSource' in acupoint && acupoint.isYuanSource) return 0xFFD700; // 原穴金色
    if ('isLuoConnecting' in acupoint && acupoint.isLuoConnecting) return 0x9B59B6; // 络穴紫色
    if ('isXiCleft' in acupoint && acupoint.isXiCleft) return 0xE67E22; // 郄穴橙色
    if ('isHeSea' in acupoint && acupoint.isHeSea) return 0x3498DB; // 合穴蓝色
    if ('isJingRiver' in acupoint && acupoint.isJingRiver) return 0x1ABC9C; // 经穴青色
    if ('isShuStream' in acupoint && acupoint.isShuStream) return 0x2ECC71; // 输穴绿色
    if ('isYingSpring' in acupoint && acupoint.isYingSpring) return 0xF39C12; // 荥穴黄色
    if ('isJingWell' in acupoint && acupoint.isJingWell) return 0xE74C3C; // 井穴红色
    
    return 0xE74C3C; // 默认红色
  };
  
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 发光效果 */}
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshBasicMaterial
            color={0xE74C3C}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* 穴位球体 */}
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = isInsertionMode ? 'crosshair' : 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'grab';
        }}
      >
        <sphereGeometry args={[0.006, 16, 16]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* 外环装饰 */}
      <mesh>
        <ringGeometry args={[0.008, 0.01, 16]} />
        <meshBasicMaterial
          color={0xD4AF37}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function AcupointSystem() {
  const { 
    acupoints, 
    selectedAcupoint, 
    setSelectedAcupoint,
    loadAcupoints
  } = useAcupointStore();
  
  const { selectedMeridian } = useUIVisualizationStore();
  
  // 加载穴位数据
  useEffect(() => {
    loadAcupoints();
  }, [loadAcupoints]);
  
  // 过滤显示的穴位
  const filteredAcupoints = useMemo(() => {
    let points = acupoints;
    
    if (points.length === 0) {
      points = Object.values(ACUPOINTS);
    }
    
    if (selectedMeridian) {
      return points.filter(ap => 
        (ap as any).type === 'meridian' && (ap as any).meridian === selectedMeridian
      );
    }
    
    return points;
  }, [acupoints, selectedMeridian]);
  
  const handleAcupointClick = (acupoint: Acupoint) => {
    setSelectedAcupoint(acupoint);
  };
  
  return (
    <group>
      {filteredAcupoints.map((acupoint) => {
        const positions: { pos: Point3D; key: string }[] = [];
        
        if (acupoint.coordinates.left) {
          positions.push({ pos: acupoint.coordinates.left, key: `${(acupoint as any).id}_left` });
        }
        
        if (acupoint.coordinates.right) {
          positions.push({ pos: acupoint.coordinates.right, key: `${(acupoint as any).id}_right` });
        }
        
        if (acupoint.coordinates.center) {
          positions.push({ pos: acupoint.coordinates.center, key: `${(acupoint as any).id}_center` });
        }
        
        if (positions.length === 0) {
          const baseY = 1.5;
          const offset = ((acupoint as any).meridianOrder || 0) * 0.05;
          const side = (acupoint as any).id.includes('left') ? -1 : 1;
          
          positions.push({
            pos: { 
              x: side * 0.15, 
              y: Math.max(0.1, baseY - offset), 
              z: 0.05 
            },
            key: (acupoint as any).id
          });
        }
        
        const isSelected = (selectedAcupoint as any)?.id === (acupoint as any).id;
        
        return positions.map(({ pos, key }) => (
          <AcupointMarker
            key={key}
            acupoint={acupoint}
            position={pos}
            isSelected={isSelected}
            onClick={() => handleAcupointClick(acupoint)}
          />
        ));
      })}
    </group>
  );
}
