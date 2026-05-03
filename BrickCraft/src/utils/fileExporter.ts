import { LDrawModelInstance } from '../types/ldraw';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import PartMeshGenerator from './partMeshGenerator';
import { CommonParts } from './ldrawParser';

/**
 * LDR文件导出器
 * 导出为LDraw标准格式
 */
export class LDRExporter {
  /**
   * 导出为LDR格式字符串
   */
  static export(parts: LDrawModelInstance[], name: string = 'BrickCraft Model'): string {
    const lines: string[] = [];
    
    // 文件头
    lines.push(`0 ${name}`);
    lines.push('0 Name: model.ldr');
    lines.push('0 Author: BrickCraft');
    lines.push('0 !LDRAW_ORG Model');
    lines.push('0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt');
    lines.push('');
    lines.push('0 BFC CERTIFY CCW');
    lines.push('');
    
    // 零件列表
    parts.forEach((part, index) => {
      // 转换为LDraw坐标系
      // LDraw: Y向下, Z向前
      // Three.js: Y向上, Z向后
      
      // 位置转换
      const x = part.position[0];
      const y = -part.position[1]; // Y取反
      const z = -part.position[2]; // Z取反
      
      // 旋转转换 (简化版本 - 只处理Y轴旋转)
      // 完整的矩阵转换需要更复杂的计算
      
      // 基本旋转矩阵 (单位矩阵)
      let matrix = '1 0 0 0 1 0 0 0 1';
      
      // 如果有旋转，计算变换矩阵
      if (part.rotation[0] !== 0 || part.rotation[1] !== 0 || part.rotation[2] !== 0) {
        const euler = new THREE.Euler(
          (part.rotation[0] * Math.PI) / 180,
          (part.rotation[1] * Math.PI) / 180,
          (part.rotation[2] * Math.PI) / 180,
          'XYZ'
        );
        const mat = new THREE.Matrix4().makeRotationFromEuler(euler);
        const m = new THREE.Matrix4();
        m.extractRotation(mat);
        const elements = m.elements;
        
        // LDraw矩阵格式: a b c d e f g h i
        // 对应: a b c
        //       d e f
        //       g h i
        matrix = `${elements[0].toFixed(6)} ${elements[4].toFixed(6)} ${elements[8].toFixed(6)} ` +
                 `${elements[1].toFixed(6)} ${elements[5].toFixed(6)} ${elements[9].toFixed(6)} ` +
                 `${elements[2].toFixed(6)} ${elements[6].toFixed(6)} ${elements[10].toFixed(6)}`;
      }
      
      // 注释
      lines.push(`0 // 零件 ${index + 1}: ${part.partId}`);
      
      // 类型1: 零件引用
      // 格式: 1 <颜色> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <文件名>
      const fileName = `${part.partId}.dat`;
      lines.push(`1 ${part.color} ${x} ${y} ${z} ${matrix} ${fileName}`);
      lines.push('');
    });
    
    // 文件尾
    lines.push('');
    lines.push('0');
    
    return lines.join('\n');
  }

  /**
   * 下载LDR文件
   */
  static download(parts: LDrawModelInstance[], filename: string = 'model.ldr'): void {
    const content = this.export(parts);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * glTF文件导出器
 */
export class GLTFExport {
  private exporter: GLTFExporter;

  constructor() {
    this.exporter = new GLTFExporter();
  }

  /**
   * 从零件实例创建Three.js场景
   */
  private createSceneFromParts(parts: LDrawModelInstance[]): THREE.Scene {
    const scene = new THREE.Scene();
    scene.name = 'BrickCraft Model';
    
    // 添加每个零件
    parts.forEach((part) => {
      const partData = CommonParts[part.partId];
      if (!partData) {
        console.warn(`Part not found: ${part.partId}`);
        return;
      }
      
      // 生成网格
      const mesh = PartMeshGenerator.generatePartMesh(partData, part.color);
      
      // 设置位置
      mesh.position.set(
        part.position[0],
        part.position[1],
        part.position[2]
      );
      
      // 设置旋转
      mesh.rotation.set(
        (part.rotation[0] * Math.PI) / 180,
        (part.rotation[1] * Math.PI) / 180,
        (part.rotation[2] * Math.PI) / 180
      );
      
      scene.add(mesh);
    });
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    return scene;
  }

  /**
   * 导出为glTF格式 (JSON)
   */
  exportGLTF(parts: LDrawModelInstance[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const scene = this.createSceneFromParts(parts);
      
      this.exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            // GLB格式
            resolve(result);
          } else {
            // glTF JSON格式
            resolve(JSON.stringify(result, null, 2));
          }
        },
        (error) => {
          reject(error);
        },
        {
          trs: false,
          onlyVisible: true,
          binary: false,
          maxTextureSize: 4096,
        }
      );
    });
  }

  /**
   * 导出为GLB格式 (二进制)
   */
  exportGLB(parts: LDrawModelInstance[]): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const scene = this.createSceneFromParts(parts);
      
      this.exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Expected ArrayBuffer for GLB export'));
          }
        },
        (error) => {
          reject(error);
        },
        {
          trs: false,
          onlyVisible: true,
          binary: true,
          maxTextureSize: 4096,
        }
      );
    });
  }

  /**
   * 下载glTF文件
   */
  async downloadGLTF(parts: LDrawModelInstance[], filename: string = 'model.gltf'): Promise<void> {
    const gltf = await this.exportGLTF(parts);
    const blob = new Blob([gltf], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * 下载GLB文件
   */
  async downloadGLB(parts: LDrawModelInstance[], filename: string = 'model.glb'): Promise<void> {
    const glb = await this.exportGLB(parts);
    const blob = new Blob([glb], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * 便捷导出函数
 */
export function exportToLDR(parts: LDrawModelInstance[], filename?: string): void {
  LDRExporter.download(parts, filename);
}

export async function exportToGLTF(parts: LDrawModelInstance[], filename?: string): Promise<void> {
  const exporter = new GLTFExport();
  await exporter.downloadGLTF(parts, filename);
}

export async function exportToGLB(parts: LDrawModelInstance[], filename?: string): Promise<void> {
  const exporter = new GLTFExport();
  await exporter.downloadGLB(parts, filename);
}

export { GLTFExport };
export default LDRExporter;
