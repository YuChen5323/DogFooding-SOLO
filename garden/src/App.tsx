import React, { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GardenScene } from './components/3d/SceneManager';
import { CameraController, LightingSystem, GroundPlane } from './components/3d/CameraController';
import { ControlPanel, ExportPanel, InfoPanel, TitleBar } from './components/ui/ControlPanel';
import { useGardenStore } from './store';
import { exportToGLB, downloadGLB, takeScreenshotAsync, downloadScreenshot } from './utils/export';

const Garden3D: React.FC = () => {
  const { globalParams } = useGardenStore();
  const gridSize = globalParams.gridSize;
  const totalSize = gridSize * 2;
  
  return (
    <>
      <CameraController gridSize={gridSize} />
      <LightingSystem />
      <GroundPlane size={totalSize + 20} />
      <GardenScene />
    </>
  );
};

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { globalParams } = useGardenStore();
  
  const handleExportGLB = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const renderer = canvas['__r3f']?.root?.fiber?.renderer;
    if (!renderer) {
      alert('无法获取渲染器实例');
      return;
    }
    
    const scene = canvas['__r3f']?.root?.fiber?.scene;
    if (!scene) {
      alert('无法获取场景实例');
      return;
    }
    
    try {
      const buffer = await exportToGLB(scene);
      downloadGLB(buffer, `garden_${Math.round(globalParams.seed)}.glb`);
    } catch (error) {
      console.error('GLB export error:', error);
      alert('导出失败，请查看控制台了解详情');
    }
  }, [globalParams.seed]);
  
  const handleExportScreenshot = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('无法找到Canvas元素');
      return;
    }
    
    try {
      const dataURL = await takeScreenshotAsync(canvas as HTMLCanvasElement, {
        format: 'image/png',
        quality: 1.0,
      });
      downloadScreenshot(dataURL, `garden_screenshot_${Date.now()}.png`);
    } catch (error) {
      console.error('Screenshot error:', error);
      alert('截图失败，请查看控制台了解详情');
    }
  }, []);
  
  return (
    <div className="w-full h-full relative overflow-hidden" ref={containerRef}>
      <div className="canvas-container">
        <Canvas
          shadows
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
          }}
          dpr={[1, 2]}
        >
          <Garden3D />
        </Canvas>
      </div>
      
      <div className="ui-layer">
        <TitleBar />
        <ControlPanel />
        <InfoPanel />
        <ExportPanel
          onExportGLB={handleExportGLB}
          onExportScreenshot={handleExportScreenshot}
        />
      </div>
    </div>
  );
};

export default App;
