import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Meridian, MeridianType } from '../types';
import { MERIDIANS, MERIDIAN_COLORS } from '../data/acupointData';
import { useUIVisualizationStore } from '../stores/uiVisualizationStore';

// 经络线条组件
function MeridianLine({ 
  meridian, 
  isHighlighted 
}: { 
  meridian: Meridian; 
  isHighlighted: boolean;
}) {
  const lineGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const animationOffset = useRef(Math.random() * 100);
  
  // 创建线条对象
  const lineObject = useMemo(() => {
    const points = meridian.circulationPath.map(
      p => new THREE.Vector3(p.x, p.y, p.z)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: MERIDIAN_COLORS[meridian.type as MeridianType] || 0x3498DB,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.6,
      linewidth: 1
    });
    return new THREE.Line(geometry, material);
  }, [meridian, isHighlighted]);
  
  // 创建发光线条对象
  const glowLineObject = useMemo(() => {
    if (!isHighlighted) return null;
    const points = meridian.circulationPath.map(
      p => new THREE.Vector3(p.x, p.y, p.z)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: MERIDIAN_COLORS[meridian.type as MeridianType] || 0x3498DB,
      transparent: true,
      opacity: 0.3,
      linewidth: 2
    });
    return new THREE.Line(geometry, material);
  }, [meridian, isHighlighted]);
  
  // 动画效果
  useFrame((state) => {
    // 粒子流动动画
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      const time = state.clock.elapsedTime + animationOffset.current;
      
      for (let i = 0; i < positions.count; i++) {
        const progress = ((i / positions.count) + time * 0.3) % 1;
        const pathIndex = Math.floor(progress * (meridian.circulationPath.length - 1));
        const nextIndex = Math.min(pathIndex + 1, meridian.circulationPath.length - 1);
        const localProgress = (progress * (meridian.circulationPath.length - 1)) % 1;
        
        const current = meridian.circulationPath[pathIndex];
        const next = meridian.circulationPath[nextIndex];
        
        positions.setXYZ(
          i,
          current.x + (next.x - current.x) * localProgress,
          current.y + (next.y - current.y) * localProgress,
          current.z + (next.z - current.z) * localProgress
        );
      }
      
      positions.needsUpdate = true;
      
      // 闪烁效果
      (particlesRef.current.material as THREE.PointsMaterial).opacity = 
        0.5 + Math.sin(time * 2) * 0.3;
    }
    
    // 线条脉冲效果
    if (lineObject && isHighlighted) {
      (lineObject.material as THREE.LineBasicMaterial).opacity = 
        0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  
  // 创建粒子几何体
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3); // 30个粒子
    
    for (let i = 0; i < 30; i++) {
      const index = Math.floor(Math.random() * meridian.circulationPath.length);
      const point = meridian.circulationPath[index];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [meridian.circulationPath]);
  
  // 粒子颜色
  const particleColor = useMemo(() => {
    return new THREE.Color(MERIDIAN_COLORS[meridian.type as MeridianType] || 0x3498DB);
  }, [meridian.type]);
  
  return (
    <group ref={lineGroupRef}>
      {/* 主线条 */}
      <primitive object={lineObject} />
      
      {/* 发光线条 */}
      {glowLineObject && <primitive object={glowLineObject} />}
      
      {/* 流动粒子 */}
      <points ref={particlesRef}>
        <bufferGeometry attach="geometry" {...particleGeometry} />
        <pointsMaterial
          attach="material"
          color={particleColor}
          size={0.008}
          transparent
          opacity={0.7}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}

export function MeridianSystem() {
  const { selectedMeridian } = useUIVisualizationStore();
  
  return (
    <group>
      {Object.values(MERIDIANS).map((meridian) => {
        const isHighlighted = selectedMeridian === meridian.type;
        
        // 如果有选中的经络，只显示该经络
        if (selectedMeridian && !isHighlighted) {
          return null;
        }
        
        return (
          <group key={meridian.type}>
            {/* 左侧经络 */}
            <MeridianLine
              meridian={meridian}
              isHighlighted={isHighlighted}
            />
            
            {/* 对于对称经络（除了任督二脉），显示右侧镜像 */}
            {meridian.type !== 'CV' && meridian.type !== 'DU' && (
              <group>
                {/* 创建右侧镜像版本 */}
                <MirroredMeridian
                  meridian={meridian}
                  isHighlighted={isHighlighted}
                />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

// 镜像经络组件
function MirroredMeridian({ 
  meridian, 
  isHighlighted 
}: { 
  meridian: Meridian; 
  isHighlighted: boolean;
}) {
  const mirroredPath = useMemo(() => {
    return meridian.circulationPath.map(p => ({
      ...p,
      x: -p.x // X轴镜像
    }));
  }, [meridian.circulationPath]);
  
  const mirroredMeridian: Meridian = {
    ...meridian,
    circulationPath: mirroredPath
  };
  
  return <MeridianLine meridian={mirroredMeridian} isHighlighted={isHighlighted} />;
}
