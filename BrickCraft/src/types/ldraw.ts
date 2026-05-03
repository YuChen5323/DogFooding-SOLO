/**
 * LDraw 颜色定义
 */
export interface LDrawColor {
  code: number;
  name: string;
  hex: string;
  alpha?: number;
  isTransparent?: boolean;
  isGlow?: boolean;
  isMetallic?: boolean;
}

/**
 * LDraw 几何体类型
 */
export type LDrawGeometryType = 
  | 'line'        // 1 号线条
  | 'triangle'    // 3 号三角形
  | 'quad'        // 4 号四边形
  | 'subfile';    // 1 号子文件引用

/**
 * LDraw 基础几何体
 */
export interface LDrawGeometry {
  type: LDrawGeometryType;
  color: number;
}

/**
 * LDraw 线条 (类型 2)
 */
export interface LDrawLine extends LDrawGeometry {
  type: 'line';
  p1: [number, number, number];
  p2: [number, number, number];
}

/**
 * LDraw 三角形 (类型 3)
 */
export interface LDrawTriangle extends LDrawGeometry {
  type: 'triangle';
  p1: [number, number, number];
  p2: [number, number, number];
  p3: [number, number, number];
}

/**
 * LDraw 四边形 (类型 4)
 */
export interface LDrawQuad extends LDrawGeometry {
  type: 'quad';
  p1: [number, number, number];
  p2: [number, number, number];
  p3: [number, number, number];
  p4: [number, number, number];
}

/**
 * LDraw 子文件引用 (类型 1)
 */
export interface LDrawSubfile extends LDrawGeometry {
  type: 'subfile';
  fileName: string;
  matrix: [
    number, number, number,
    number, number, number,
    number, number, number,
    number, number, number
  ]; // 3x4 变换矩阵 [a b c d e f g h i x y z]
}

/**
 * LDraw 零件数据
 */
export interface LDrawPart {
  id: string;          // 零件ID (如 3001)
  name: string;         // 零件名称
  fileName: string;     // 文件名
  description?: string;  // 描述
  category?: string;     // 分类
  year?: number;         // 发布年份
  geometries: LDrawGeometry[];  // 几何体数据
}

/**
 * LDraw 模型实例
 */
export interface LDrawModelInstance {
  id: string;
  partId: string;
  color: number;
  position: [number, number, number];
  rotation: [number, number, number]; // 欧拉角 (度)
  isPlaced: boolean;
}

/**
 * LDraw 模型
 */
export interface LDrawModel {
  id: string;
  name: string;
  instances: LDrawModelInstance[];
}
