import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InsertionLayer, Point3D } from '../types';
import { useAcupointStore } from '../stores/acupointStore';
import { ACUPOINTS } from '../data/acupointData';

const LAYER_NAMES: Record<InsertionLayer, string> = {
  skin: '皮',
  flesh: '肉',
  vessel: '脉',
  tendon: '筋',
  bone: '骨'
};

const LAYER_COLORS: Record<InsertionLayer, string> = {
  skin: '#FAD6A5',
  flesh: '#E74C3C',
  vessel: '#C0392B',
  tendon: '#95A5A6',
  bone: '#ECF0F1'
};

function AcupunctureNeedle({ 
  startPoint, 
  direction, 
  depth,
  isActive
}: { 
  startPoint: Point3D; 
  direction: THREE.Vector3;
  depth: number;
  isActive: boolean;
}) {
  const needleGroupRef = useRef<THREE.Group>(null);
  const [needleDepth, setNeedleDepth] = useState(0);
  
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setNeedleDepth(prev => {
          const target = depth * 0.001;
          const step = 0.0005;
          if (prev < target) {
            return Math.min(prev + step, target);
          }
          return target;
        });
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [depth, isActive]);
  
  const needleLength = 0.05;
  const needleRadius = 0.0005;
  const handleLength = 0.015;
  
  return (
    <group ref={needleGroupRef} position={[startPoint.x, startPoint.y, startPoint.z]}>
      <mesh 
        position={[
          direction.x * (needleLength / 2 - needleDepth / 2),
          direction.y * (needleLength / 2 - needleDepth / 2),
          direction.z * (needleLength / 2 - needleDepth / 2)
        ]}
      >
        <cylinderGeometry args={[needleRadius, needleRadius, needleLength - needleDepth, 8]} />
        <meshStandardMaterial
          color={0xC0C0C0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <mesh
        position={[
          direction.x * (needleLength - needleDepth),
          direction.y * (needleLength - needleDepth),
          direction.z * (needleLength - needleDepth)
        ]}
      >
        <coneGeometry args={[needleRadius * 1.5, needleRadius * 4, 8]} />
        <meshStandardMaterial
          color={0xD4D4D4}
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[needleRadius * 2, needleRadius * 2, handleLength, 8]} />
        <meshStandardMaterial
          color={0xFFD700}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[needleRadius * 2.2, needleRadius * 2.2, handleLength, 6]} />
        <meshStandardMaterial
          color={0xE67E22}
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {needleDepth > 0 && (
        <mesh position={[
          direction.x * (needleLength - needleDepth),
          direction.y * (needleLength - needleDepth),
          direction.z * (needleLength - needleDepth)
        ]}>
          <ringGeometry args={[needleRadius * 3, needleRadius * 5, 16]} />
          <meshBasicMaterial
            color={0xE74C3C}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function InsertionLayerIndicator() {
  const { needleState } = useAcupointStore();
  
  if (!needleState) return null;
  
  const depthPercentage = (needleState.currentDepth / needleState.maxDepth) * 100;
  
  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(248, 245, 240, 0.95)',
        borderRadius: '12px',
        padding: '16px 24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}
    >
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '12px',
        fontWeight: '600',
        color: '#4a4845'
      }}>
        进针深度: {needleState.currentDepth.toFixed(1)}mm / {needleState.maxDepth}mm
      </div>
      
      <div style={{
        width: '200px',
        height: '8px',
        background: '#e8e0d5',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div 
          style={{
            width: `${depthPercentage}%`,
            height: '100%',
            background: needleState.hasDeqi ? '#27AE60' : '#E74C3C',
            borderRadius: '4px',
            transition: 'width 0.1s ease'
          }}
        />
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {needleState.layers.map((layer) => (
          <div key={layer.layer} style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: `2px solid ${LAYER_COLORS[layer.layer]}`,
                background: layer.entered ? LAYER_COLORS[layer.layer] : 'transparent',
                margin: '0 auto 4px',
                transition: 'all 0.3s ease',
                boxShadow: layer.entered ? `0 0 8px ${LAYER_COLORS[layer.layer]}` : 'none'
              }}
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#8b8680',
              fontWeight: layer.entered ? '600' : '400'
            }}>
              {LAYER_NAMES[layer.layer]}
            </div>
          </div>
        ))}
      </div>
      
      {needleState.hasDeqi && (
        <div style={{
          marginTop: '12px',
          padding: '8px 16px',
          background: 'rgba(39, 174, 96, 0.2)',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#27AE60',
          fontWeight: '600',
          animation: 'pulse 1s infinite'
        }}>
          ✨ 得气！强度: {(needleState.deqiStrength * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}

export function NeedleSimulation() {
  const { camera } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [needlePosition, setNeedlePosition] = useState<Point3D | null>(null);
  const [needleDirection, setNeedleDirection] = useState(new THREE.Vector3(0, 0, -1));
  const [needleDepth, setNeedleDepth] = useState(0);
  const [isNeedleActive, setIsNeedleActive] = useState(false);
  
  const { 
    isInsertionMode, 
    startNeedleInsertion,
    updateNeedleDepth,
    resetNeedleState,
    needleState
  } = useAcupointStore();
  
  const handlePointerMove = useCallback((event: any) => {
    if (!isInsertionMode) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    mouseRef.current.set(x, y);
  }, [isInsertionMode]);
  
  const handleClick = useCallback((event: any) => {
    if (!isInsertionMode) return;
    
    handlePointerMove(event);
    
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    const acupoints = Object.values(ACUPOINTS);
    
    let nearestAcupoint: typeof acupoints[0] | null = null;
    let nearestDistance = Infinity;
    
    for (const acupoint of acupoints) {
      const positions = [
        acupoint.coordinates.left,
        acupoint.coordinates.right,
        acupoint.coordinates.center
      ].filter(Boolean) as Point3D[];
      
      for (const pos of positions) {
        const pointVector = new THREE.Vector3(pos.x, pos.y, pos.z);
        const distance = raycasterRef.current.ray.distanceToPoint(pointVector);
        
        if (distance < 0.05 && distance < nearestDistance) {
          nearestDistance = distance;
          nearestAcupoint = acupoint;
        }
      }
    }
    
    if (nearestAcupoint && !isNeedleActive) {
      const positions = [
        nearestAcupoint.coordinates.left,
        nearestAcupoint.coordinates.right,
        nearestAcupoint.coordinates.center
      ].filter(Boolean) as Point3D[];
      
      if (positions.length > 0) {
        const pos = positions[0];
        setNeedlePosition(pos);
        
        const direction = new THREE.Vector3(
          -Math.sign(pos.x) * 0.1,
          0,
          pos.z > 0 ? -0.3 : 0.3
        ).normalize();
        
        setNeedleDirection(direction);
        setIsNeedleActive(true);
        
        startNeedleInsertion((nearestAcupoint as any).id);
        
        let depth = 0;
        const maxDepth = nearestAcupoint.needling.maxDepth;
        const interval = setInterval(() => {
          depth += 0.5;
          if (depth >= maxDepth) {
            clearInterval(interval);
          }
          setNeedleDepth(depth);
          updateNeedleDepth(depth);
        }, 100);
      }
    }
  }, [isInsertionMode, camera, isNeedleActive, startNeedleInsertion, updateNeedleDepth]);
  
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas && isInsertionMode) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('mousemove', handlePointerMove);
      
      return () => {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('mousemove', handlePointerMove);
      };
    }
  }, [isInsertionMode, handleClick, handlePointerMove]);
  
  useEffect(() => {
    if (!isInsertionMode) {
      setIsNeedleActive(false);
      setNeedlePosition(null);
      setNeedleDepth(0);
    }
  }, [isInsertionMode]);
  
  return (
    <>
      {isNeedleActive && needlePosition && (
        <AcupunctureNeedle
          startPoint={needlePosition}
          direction={needleDirection}
          depth={needleDepth}
          isActive={isNeedleActive}
        />
      )}
      
      {isInsertionMode && needleState && <InsertionLayerIndicator />}
      
      {isInsertionMode && !isNeedleActive && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(231, 76, 60, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: '600',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          🔴 针刺练习模式 - 点击穴位进行进针练习
        </div>
      )}
      
      {isInsertionMode && (
        <button
          onClick={() => {
            resetNeedleState();
            setIsNeedleActive(false);
            setNeedlePosition(null);
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(248, 245, 240, 0.95)',
            border: '1px solid #e8e0d5',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#4a4845',
            fontWeight: '600',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8e0d5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(248, 245, 240, 0.95)';
          }}
        >
          ✕ 退出练习模式
        </button>
      )}
    </>
  );
}
