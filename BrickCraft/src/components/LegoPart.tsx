import { useMemo } from 'react';
import * as THREE from 'three';
import { LDrawPart } from '../types/ldraw';
import PartMeshGenerator from '../utils/partMeshGenerator';
import { CommonParts } from '../utils/ldrawParser';

interface LegoPartProps {
  partId: string;
  color?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * 乐高零件组件
 * 在 Three.js 场景中渲染单个乐高零件
 */
export default function LegoPart({
  partId,
  color = 15, // 默认白色
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onPointerOver,
  onPointerOut,
  castShadow = true,
  receiveShadow = true,
}: LegoPartProps) {
  // 生成零件网格
  const mesh = useMemo(() => {
    const part = CommonParts[partId];
    if (!part) {
      console.warn(`Part not found: ${partId}`);
      return new THREE.Group();
    }
    
    const group = PartMeshGenerator.generatePartMesh(part, color);
    
    // 应用阴影设置
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    
    return group;
  }, [partId, color, castShadow, receiveShadow]);

  // 处理事件
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    onPointerOver?.();
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    onPointerOut?.();
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <primitive
      object={mesh}
      position={position}
      rotation={[
        (rotation[0] * Math.PI) / 180,
        (rotation[1] * Math.PI) / 180,
        (rotation[2] * Math.PI) / 180,
      ]}
      scale={scale}
      onPointerOver={onPointerOver ? handlePointerOver : undefined}
      onPointerOut={onPointerOut ? handlePointerOut : undefined}
      onClick={onClick ? handleClick : undefined}
    />
  );
}

/**
 * 零件集合组件
 * 渲染多个乐高零件
 */
interface LegoPartCollectionProps {
  parts: Array<{
    id: string;
    partId: string;
    color?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
  }>;
  onPartClick?: (partId: string) => void;
}

export function LegoPartCollection({ parts, onPartClick }: LegoPartCollectionProps) {
  return (
    <>
      {parts.map((part) => (
        <LegoPart
          key={part.id}
          partId={part.partId}
          color={part.color || 15}
          position={part.position || [0, 0, 0]}
          rotation={part.rotation || [0, 0, 0]}
          onClick={onPartClick ? () => onPartClick(part.id) : undefined}
        />
      ))}
    </>
  );
}
