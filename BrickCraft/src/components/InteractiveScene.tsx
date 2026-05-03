import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from '../contexts/AppContext';
import { LDrawModelInstance } from '../types/ldraw';
import { PlacementPreview, PlacementStatus } from '../types/buildMode';
import PartMeshGenerator from '../utils/partMeshGenerator';
import { CommonParts } from '../utils/ldrawParser';
import { getLDrawColorHex } from '../utils/ldrawColors';
import './InteractiveScene.css';

// 零件网格组件
function PartMesh({ instance, isSelected, onClick }: { 
  instance: LDrawModelInstance; 
  isSelected: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const mesh = useMemo(() => {
    const m = PartMeshGenerator.generatePartMesh(
      CommonParts[instance.partId] || CommonParts['3001'],
      instance.color
    );
    m.userData.instanceId = instance.id;
    m.userData.partId = instance.partId;
    return m;
  }, [instance.id, instance.partId, instance.color]);

  useEffect(() => {
    if (!meshRef.current) return;
    
    // 设置位置 (转换为乐高单位)
    meshRef.current.position.set(
      instance.position[0],
      instance.position[1],
      instance.position[2]
    );
    meshRef.current.rotation.set(
      (instance.rotation[0] * Math.PI) / 180,
      (instance.rotation[1] * Math.PI) / 180,
      (instance.rotation[2] * Math.PI) / 180
    );

    // 高亮选中或悬停的零件
    meshRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          if (isSelected) {
            material.emissive.setHex(0xff0000);
            material.emissiveIntensity = 0.3;
          } else if (hovered) {
            material.emissive.setHex(0xffff00);
            material.emissiveIntensity = 0.2;
          } else {
            material.emissive.setHex(0x000000);
            material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [instance.position, instance.rotation, isSelected, hovered]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <primitive
      ref={meshRef}
      object={mesh}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      castShadow
      receiveShadow
    />
  );
}

// 放置预览组件
function PlacementGhost({ preview }: { preview: PlacementPreview }) {
  const meshRef = useRef<THREE.Group>(null);

  const mesh = useMemo(() => {
    const part = CommonParts[preview.partId] || CommonParts['3001'];
    const m = PartMeshGenerator.generatePartMesh(part, preview.color);
    
    // 应用透明材质
    m.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.transparent = true;
        material.opacity = 0.6;
        
        // 根据状态设置颜色
        if (preview.status === 'conflicting') {
          material.color.setHex(0xff0000);
        } else if (preview.status === 'valid' || preview.status === 'snapped') {
          material.color.setHex(0x00ff00);
        }
      }
    });
    
    return m;
  }, [preview.partId, preview.color, preview.status]);

  useEffect(() => {
    if (!meshRef.current) return;
    
    meshRef.current.position.set(
      preview.position[0],
      preview.position[1],
      preview.position[2]
    );
    meshRef.current.rotation.set(
      (preview.rotation[0] * Math.PI) / 180,
      (preview.rotation[1] * Math.PI) / 180,
      (preview.rotation[2] * Math.PI) / 180
    );
  }, [preview.position, preview.rotation]);

  return <primitive ref={meshRef} object={mesh} />;
}

// 射线投射控制器
function RaycasterController() {
  const { camera, raycaster, pointer } = useThree();
  const { state, selectPart, clearSelection, updatePlacement, confirmPlacement, cancelPlacement, setTool } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback((event: any) => {
    if (!state.selectedPartId || state.tool !== 'place') return;

    // 射线检测地面
    raycaster.setFromCamera(pointer, camera);
    
    // 检查与地面的交点
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      // 转换为乐高单位 (四舍五入)
      const position: [number, number, number] = [
        Math.round(intersection.x),
        Math.max(0, Math.round(intersection.y)),
        Math.round(intersection.z)
      ];

      updatePlacement(position, [0, 0, 0]);
    }
  }, [state.selectedPartId, state.tool, pointer, camera, raycaster, updatePlacement]);

  const handleClick = useCallback((event: any) => {
    // 点击场景空白区域
    if (event.object?.type === 'GridHelper' || !event.object) {
      if (state.tool === 'place' && state.placementPreview?.status === 'valid') {
        confirmPlacement();
      } else {
        clearSelection();
      }
    }
  }, [state.tool, state.placementPreview, confirmPlacement, clearSelection]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ESC 取消放置
    if (e.key === 'Escape') {
      cancelPlacement();
      setTool('select');
    }
    
    // Delete 删除选中的零件
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selection.selectedPartIds.length > 0) {
        // TODO: 实现删除
      }
    }
    
    // R 旋转预览
    if (e.key === 'r' || e.key === 'R') {
      if (state.placementPreview) {
        const newRotation: [number, number, number] = [
          state.placementPreview.rotation[0],
          (state.placementPreview.rotation[1] + 90) % 360,
          state.placementPreview.rotation[2]
        ];
        updatePlacement(state.placementPreview.position, newRotation);
      }
    }
  }, [cancelPlacement, setTool, state.selection.selectedPartIds, state.placementPreview, updatePlacement]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <group
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    />
  );
}

// 场景内容
function SceneContent() {
  const { state, selectPart, clearSelection } = useAppContext();

  const handlePartClick = useCallback((instance: LDrawModelInstance) => {
    if (state.tool === 'select') {
      selectPart(instance.id);
    } else if (state.tool === 'delete') {
      // TODO: 删除零件
    }
  }, [state.tool, selectPart]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 8, 12]} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        minDistance={2} 
        maxDistance={50}
        target={[0, 0, 0]}
        makeDefault
      />
      
      {/* 环境光 */}
      <ambientLight intensity={0.6} />
      
      {/* 主方向光 */}
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* 补光 */}
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />
      
      {/* 环境 */}
      <Environment preset="city" />
      
      {/* 已放置的零件 */}
      {state.parts.map((part) => (
        <PartMesh
          key={part.id}
          instance={part}
          isSelected={state.selection.selectedPartIds.includes(part.id)}
          onClick={() => handlePartClick(part)}
        />
      ))}
      
      {/* 放置预览 */}
      {state.placementPreview && (
        <PlacementGhost preview={state.placementPreview} />
      )}
      
      {/* 射线投射控制器 */}
      <RaycasterController />
      
      {/* 网格地面 */}
      <Grid 
        position={[0, -0.01, 0]} 
        args={[40, 40]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#a5a5a5" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#595959" 
        fadeDistance={30} 
        fadeStrength={1} 
        followCamera={false} 
        infiniteGrid={false}
      />
    </>
  );
}

// 放置状态指示器
function PlacementIndicator() {
  const { state } = useAppContext();
  
  if (!state.placementPreview) {
    return (
      <div className="placement-indicator idle">
        {state.selectedPartId ? `选中零件: ${state.selectedPartId}` : '从零件库选择零件'}
      </div>
    );
  }

  const statusText: Record<PlacementStatus, string> = {
    idle: '准备放置',
    placing: '移动到目标位置',
    snapped: '已吸附',
    conflicting: '有碰撞！',
    valid: '点击确认放置 (R旋转)'
  };

  return (
    <div className={`placement-indicator ${state.placementPreview.status}`}>
      {statusText[state.placementPreview.status]}
      {state.placementPreview.snapInfo && (
        <span style={{ marginLeft: 8, fontSize: 12 }}>
          ({state.placementPreview.snapInfo.type})
        </span>
      )}
    </div>
  );
}

// 主场景组件
export default function InteractiveScene() {
  const { state, updatePlacement, confirmPlacement, cancelPlacement } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理拖放
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const partId = e.dataTransfer.getData('partId');
    const color = parseInt(e.dataTransfer.getData('color') || '14');

    if (partId) {
      // 开始放置
      // TODO: 将鼠标位置转换为3D位置
      const position: [number, number, number] = [0, 0, 0];
      const rotation: [number, number, number] = [0, 0, 0];
      
      updatePlacement(position, rotation);
    }
  }, [updatePlacement]);

  return (
    <div 
      ref={containerRef}
      className="scene-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Canvas 
        shadows 
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneContent />
      </Canvas>
      
      <PlacementIndicator />
      
      <div className="help-hint">
        提示: 按 R 旋转 | ESC 取消 | 点击放置
      </div>
    </div>
  );
}
