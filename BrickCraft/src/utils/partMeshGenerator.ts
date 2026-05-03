import * as THREE from 'three';
import {
  LDrawPart,
  LDrawGeometry,
  LDrawTriangle,
  LDrawQuad,
  LDrawSubfile,
  LDrawModelInstance,
} from '../types/ldraw';
import { getLDrawColorHex, isTransparentColor, isGlowColor, isMetallicColor } from './ldrawColors';
import { CommonParts } from './ldrawParser';

/**
 * 零件网格生成器
 * 将 LDraw 零件数据转换为 Three.js 可渲染的网格
 */
export class PartMeshGenerator {
  /**
   * LDraw 单位到 Three.js 单位的缩放因子
   * LDraw 使用 20 LDU = 1 乐高单位 (8mm)
   */
  private static readonly LDU_SCALE = 1 / 20;

  /**
   * 生成单个零件的 Three.js 网格
   * @param part LDraw 零件数据
   * @param color 颜色代码 (默认 15 白色)
   * @param partLibrary 零件库 (用于解析子文件引用)
   * @returns Three.js Group 包含所有几何体
   */
  static generatePartMesh(
    part: LDrawPart,
    color: number = 15,
    partLibrary: Record<string, LDrawPart> = CommonParts
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = part.id;

    // 按颜色分组几何体
    const geometryGroups: Map<number, { positions: number[]; normals: number[]; indices: number[] }> = new Map();

    // 处理所有几何体
    for (const geometry of part.geometries) {
      if (geometry.type === 'triangle') {
        this.addTriangleToGroup(geometryGroups, geometry as LDrawTriangle, color);
      } else if (geometry.type === 'quad') {
        this.addQuadToGroup(geometryGroups, geometry as LDrawQuad, color);
      } else if (geometry.type === 'subfile') {
        // 处理子文件引用
        const subfile = geometry as LDrawSubfile;
        const subPart = partLibrary[subfile.fileName] || partLibrary[this.normalizePartId(subfile.fileName)];
        
        if (subPart) {
          // 解析变换矩阵
          const transform = this.parseLDrawMatrix(subfile.matrix);
          
          // 递归生成子零件网格
          const subColor = subfile.color === 16 ? color : subfile.color;
          const subMesh = this.generatePartMesh(subPart, subColor, partLibrary);
          
          // 应用变换
          subMesh.position.copy(transform.position);
          subMesh.rotation.set(
            (transform.rotation.x * Math.PI) / 180,
            (transform.rotation.y * Math.PI) / 180,
            (transform.rotation.z * Math.PI) / 180
          );
          subMesh.scale.setScalar(transform.scale);
          
          group.add(subMesh);
        }
      }
    }

    // 为每个颜色创建网格
    for (const [colorCode, geometryData] of geometryGroups.entries()) {
      if (geometryData.positions.length === 0) continue;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.positions, 3));
      
      if (geometryData.normals.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(geometryData.normals, 3));
      } else {
        geometry.computeVertexNormals();
      }

      if (geometryData.indices.length > 0) {
        geometry.setIndex(geometryData.indices);
      }

      // 创建材质
      const material = this.createMaterial(colorCode);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      group.add(mesh);
    }

    // 应用 LDraw 单位缩放
    group.scale.setScalar(this.LDU_SCALE);

    return group;
  }

  /**
   * 生成模型实例的网格
   */
  static generateInstanceMesh(
    instance: LDrawModelInstance,
    partLibrary: Record<string, LDrawPart> = CommonParts
  ): THREE.Group {
    const part = partLibrary[instance.partId];
    if (!part) {
      console.warn(`Part not found: ${instance.partId}`);
      return new THREE.Group();
    }

    const mesh = this.generatePartMesh(part, instance.color, partLibrary);
    mesh.name = instance.id;
    
    // 应用位置和旋转
    mesh.position.set(
      instance.position[0] * this.LDU_SCALE,
      instance.position[1] * this.LDU_SCALE,
      instance.position[2] * this.LDU_SCALE
    );
    
    mesh.rotation.set(
      (instance.rotation[0] * Math.PI) / 180,
      (instance.rotation[1] * Math.PI) / 180,
      (instance.rotation[2] * Math.PI) / 180
    );

    return mesh;
  }

  /**
   * 为颜色创建 Three.js 材质
   */
  private static createMaterial(colorCode: number): THREE.Material {
    const colorHex = getLDrawColorHex(colorCode);
    const isTransparent = isTransparentColor(colorCode);
    const isGlow = isGlowColor(colorCode);
    const isMetallic = isMetallicColor(colorCode);

    if (isTransparent) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.8,
        transmission: 0.5,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 0.3,
      });
    }

    if (isGlow) {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0,
      });
    }

    if (isMetallic) {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.3,
        metalness: 0.8,
      });
    }

    // 默认材质 (乐高风格)
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.7,
      metalness: 0.1,
      flatShading: false,
    });
  }

  /**
   * 添加三角形到几何体组
   */
  private static addTriangleToGroup(
    groups: Map<number, { positions: number[]; normals: number[]; indices: number[] }>,
    triangle: LDrawTriangle,
    defaultColor: number
  ): void {
    const colorCode = triangle.color === 16 ? defaultColor : triangle.color;
    
    let group = groups.get(colorCode);
    if (!group) {
      group = { positions: [], normals: [], indices: [] };
      groups.set(colorCode, group);
    }

    const baseIndex = group.positions.length / 3;

    // 添加顶点 (LDraw 使用右手坐标系，Y 轴向下，需要转换)
    // LDraw: Y 向下, Z 向前
    // Three.js: Y 向上, Z 向后
    const convertPoint = (p: [number, number, number]): [number, number, number] => [
      p[0],  // X 不变
      -p[1], // Y 取反 (LDraw Y 向下)
      -p[2]  // Z 取反 (LDraw Z 向前)
    ];

    const p1 = convertPoint(triangle.p1);
    const p2 = convertPoint(triangle.p2);
    const p3 = convertPoint(triangle.p3);

    // 添加顶点
    group.positions.push(...p1, ...p2, ...p3);

    // 计算法向量
    const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const v3 = new THREE.Vector3(p3[0], p3[1], p3[2]);

    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    group.normals.push(
      normal.x, normal.y, normal.z,
      normal.x, normal.y, normal.z,
      normal.x, normal.y, normal.z
    );

    // 添加索引
    group.indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
  }

  /**
   * 添加四边形到几何体组 (拆分为两个三角形)
   */
  private static addQuadToGroup(
    groups: Map<number, { positions: number[]; normals: number[]; indices: number[] }>,
    quad: LDrawQuad,
    defaultColor: number
  ): void {
    const colorCode = quad.color === 16 ? defaultColor : quad.color;
    
    let group = groups.get(colorCode);
    if (!group) {
      group = { positions: [], normals: [], indices: [] };
      groups.set(colorCode, group);
    }

    const baseIndex = group.positions.length / 3;

    // 转换坐标系
    const convertPoint = (p: [number, number, number]): [number, number, number] => [
      p[0],
      -p[1],
      -p[2]
    ];

    const p1 = convertPoint(quad.p1);
    const p2 = convertPoint(quad.p2);
    const p3 = convertPoint(quad.p3);
    const p4 = convertPoint(quad.p4);

    // 添加顶点
    group.positions.push(...p1, ...p2, ...p3, ...p4);

    // 计算法向量 (使用前三个点)
    const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const v3 = new THREE.Vector3(p3[0], p3[1], p3[2]);

    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    // 为四个顶点添加相同的法向量
    for (let i = 0; i < 4; i++) {
      group.normals.push(normal.x, normal.y, normal.z);
    }

    // 拆分为两个三角形: 0-1-2 和 0-2-3
    group.indices.push(
      baseIndex, baseIndex + 1, baseIndex + 2,
      baseIndex, baseIndex + 2, baseIndex + 3
    );
  }

  /**
   * 解析 LDraw 变换矩阵
   * 矩阵格式: [a b c d e f g h i x y z]
   * 其中:
   *   a b c
   *   d e f
   *   g h i  是旋转缩放矩阵
   *   x y z  是平移向量
   */
  private static parseLDrawMatrix(matrix: number[]): {
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    scale: number;
  } {
    const [a, b, c, d, e, f, g, h, i, x, y, z] = matrix;

    // 计算缩放因子
    const scale = Math.sqrt(a * a + d * d + g * g);

    // 归一化旋转矩阵
    const rotA = a / scale;
    const rotB = b / scale;
    const rotC = c / scale;
    const rotD = d / scale;
    const rotE = e / scale;
    const rotF = f / scale;
    const rotG = g / scale;
    const rotH = h / scale;
    const rotI = i / scale;

    // 从旋转矩阵提取欧拉角 (YZX 顺序)
    const sy = Math.sqrt(rotA * rotA + rotD * rotD);
    const singular = sy < 1e-6;

    let xAngle: number, yAngle: number, zAngle: number;
    if (!singular) {
      xAngle = Math.atan2(rotH, rotI);
      yAngle = Math.atan2(-rotG, sy);
      zAngle = Math.atan2(rotD, rotA);
    } else {
      xAngle = Math.atan2(-rotF, rotE);
      yAngle = Math.atan2(-rotG, sy);
      zAngle = 0;
    }

    // 转换为角度
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;

    // 转换位置坐标系 (LDraw Y 向下, Z 向前)
    return {
      rotation: {
        x: toDegrees(xAngle),
        y: toDegrees(yAngle),
        z: toDegrees(zAngle)
      },
      position: {
        x: x,
        y: -y, // Y 取反
        z: -z  // Z 取反
      },
      scale
    };
  }

  /**
   * 规范化零件ID
   */
  private static normalizePartId(fileName: string): string {
    // 移除路径和扩展名
    return fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
  }

  /**
   * 计算零件的边界盒
   */
  static computeBoundingBox(part: LDrawPart): THREE.Box3 {
    const group = this.generatePartMesh(part);
    const box = new THREE.Box3().setFromObject(group);
    return box;
  }

  /**
   * 获取零件的尺寸 (乐高单位)
   */
  static getPartDimensions(part: LDrawPart): {
    width: number;
    height: number;
    depth: number;
  } {
    const box = this.computeBoundingBox(part);
    const size = new THREE.Vector3();
    box.getSize(size);

    return {
      width: size.x,
      height: size.y,
      depth: size.z
    };
  }
}

export default PartMeshGenerator;
