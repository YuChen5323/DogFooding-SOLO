import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ExportGLBOptions {
  binary?: boolean;
  onlyVisible?: boolean;
  trs?: boolean;
  maxTextureSize?: number;
}

const defaultGLBOptions: ExportGLBOptions = {
  binary: true,
  onlyVisible: true,
  trs: false,
  maxTextureSize: 4096,
};

export async function exportToGLB(
  scene: THREE.Scene,
  options: ExportGLBOptions = {}
): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  const mergedOptions = { ...defaultGLBOptions, ...options };
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          const jsonString = JSON.stringify(result, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        }
      },
      (error) => {
        reject(error);
      },
      {
        binary: mergedOptions.binary,
        onlyVisible: mergedOptions.onlyVisible,
        trs: mergedOptions.trs,
        maxTextureSize: mergedOptions.maxTextureSize,
        animations: [],
        embedImages: true,
      }
    );
  });
}

export function downloadGLB(
  buffer: ArrayBuffer,
  filename: string = 'garden.glb'
): void {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  preserveDrawingBuffer?: boolean;
  format?: 'image/png' | 'image/jpeg';
  quality?: number;
}

const defaultScreenshotOptions: ScreenshotOptions = {
  width: 1920,
  height: 1080,
  preserveDrawingBuffer: true,
  format: 'image/png',
  quality: 1.0,
};

export async function takeScreenshot(
  renderer: THREE.WebGLRenderer,
  options: ScreenshotOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultScreenshotOptions, ...options };
  
  const { width, height } = renderer.getSize(new THREE.Vector2());
  
  if (mergedOptions.width && mergedOptions.height) {
    renderer.setSize(mergedOptions.width, mergedOptions.height, false);
  }
  
  const dataURL = renderer.domElement.toDataURL(
    mergedOptions.format,
    mergedOptions.quality
  );
  
  renderer.setSize(width, height, false);
  
  return dataURL;
}

export function downloadScreenshot(
  dataURL: string,
  filename: string = 'screenshot.png'
): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function takeScreenshotAsync(
  canvas: HTMLCanvasElement,
  options: ScreenshotOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultScreenshotOptions, ...options };
  
  return new Promise((resolve, reject) => {
    try {
      const dataURL = canvas.toDataURL(
        mergedOptions.format,
        mergedOptions.quality
      );
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
}

export function sceneToJSON(scene: THREE.Scene): string {
  const json = {
    metadata: {
      version: 4.5,
      type: 'Object',
      generator: 'GardenExporter',
    },
    object: scene.toJSON(),
  };
  return JSON.stringify(json, null, 2);
}

export function downloadJSON(
  json: string,
  filename: string = 'garden.json'
): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export interface LayeredScreenshotOptions {
  layers: ('terrain' | 'architecture' | 'vegetation' | 'water' | 'rocks')[];
  width?: number;
  height?: number;
  format?: 'image/png' | 'image/jpeg';
}

export function createLayerMask(layers: string[]): number {
  let mask = 0;
  
  const layerMap: Record<string, number> = {
    terrain: 1 << 0,
    architecture: 1 << 1,
    vegetation: 1 << 2,
    water: 1 << 3,
    rocks: 1 << 4,
  };
  
  for (const layer of layers) {
    if (layerMap[layer]) {
      mask |= layerMap[layer];
    }
  }
  
  return mask || 0xffffffff;
}

export function assignLayerToObject(
  object: THREE.Object3D,
  layer: 'terrain' | 'architecture' | 'vegetation' | 'water' | 'rocks'
): void {
  const layerMap: Record<string, number> = {
    terrain: 0,
    architecture: 1,
    vegetation: 2,
    water: 3,
    rocks: 4,
  };
  
  const layerNumber = layerMap[layer] ?? 0;
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.layers.set(layerNumber);
    }
  });
}
