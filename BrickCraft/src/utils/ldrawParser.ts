import {
  LDrawGeometry,
  LDrawLine,
  LDrawTriangle,
  LDrawQuad,
  LDrawSubfile,
  LDrawPart,
} from '../types/ldraw';

/**
 * LDraw 文件解析器
 * 解析 LDraw .dat 文件格式
 */
export class LDrawParser {
  /**
   * 解析 LDraw 文件内容
   * @param content LDraw 文件文本内容
   * @param fileName 文件名 (用于错误信息)
   * @returns 解析后的零件数据
   */
  static parse(content: string, fileName: string = 'unknown'): LDrawPart {
    const lines = content.split('\n');
    const geometries: LDrawGeometry[] = [];
    let name = fileName;
    let description = '';
    let category = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const parsed = this.parseLine(trimmedLine);
      if (!parsed) continue;

      if (parsed.type === 'comment') {
        // 解析元数据注释
        const meta = this.parseMetaComment(parsed.comment);
        if (meta.name) name = meta.name;
        if (meta.description) description = meta.description;
        if (meta.category) category = meta.category;
      } else if (parsed.type === 'geometry') {
        geometries.push(parsed.geometry);
      }
    }

    // 提取零件ID (从文件名)
    const partId = this.extractPartId(fileName);

    return {
      id: partId,
      name,
      fileName,
      description,
      category,
      geometries,
    };
  }

  /**
   * 解析单行 LDraw 命令
   * @param line 单行文本
   * @returns 解析结果
   */
  private static parseLine(
    line: string
  ):
    | { type: 'comment'; comment: string }
    | { type: 'geometry'; geometry: LDrawGeometry }
    | null {
    const firstChar = line.charAt(0);

    // 空行或纯空格
    if (!firstChar || firstChar === ' ') return null;

    // 注释或元数据 (类型 0)
    if (firstChar === '0') {
      const comment = line.substring(1).trim();
      return { type: 'comment', comment };
    }

    // 几何体命令
    const parts = line.split(/\s+/);
    const type = parseInt(parts[0]);

    switch (type) {
      case 1: // 子文件引用
        return this.parseSubfile(parts);
      case 2: // 线条
        return this.parseLine(parts);
      case 3: // 三角形
        return this.parseTriangle(parts);
      case 4: // 四边形
        return this.parseQuad(parts);
      case 5: // 可选线 (暂时忽略)
        return null;
      default:
        return null;
    }
  }

  /**
   * 解析类型 1: 子文件引用
   */
  private static parseSubfile(parts: string[]): { type: 'geometry'; geometry: LDrawSubfile } | null {
    if (parts.length < 15) return null;

    const color = parseInt(parts[1]);
    const matrix = [
      parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]),
      parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]),
      parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13]),
      parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]),
    ] as LDrawSubfile['matrix'];

    // 文件名可能包含空格，需要重新组合
    const fileName = parts.slice(14).join(' ');

    return {
      type: 'geometry',
      geometry: {
        type: 'subfile',
        color,
        fileName,
        matrix,
      },
    };
  }

  /**
   * 解析类型 2: 线条
   */
  private static parseLine(parts: string[]): { type: 'geometry'; geometry: LDrawLine } | null {
    if (parts.length < 9) return null;

    return {
      type: 'geometry',
      geometry: {
        type: 'line',
        color: parseInt(parts[1]),
        p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
        p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
      },
    };
  }

  /**
   * 解析类型 3: 三角形
   */
  private static parseTriangle(parts: string[]): { type: 'geometry'; geometry: LDrawTriangle } | null {
    if (parts.length < 12) return null;

    return {
      type: 'geometry',
      geometry: {
        type: 'triangle',
        color: parseInt(parts[1]),
        p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
        p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
        p3: [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])],
      },
    };
  }

  /**
   * 解析类型 4: 四边形
   */
  private static parseQuad(parts: string[]): { type: 'geometry'; geometry: LDrawQuad } | null {
    if (parts.length < 15) return null;

    return {
      type: 'geometry',
      geometry: {
        type: 'quad',
        color: parseInt(parts[1]),
        p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
        p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
        p3: [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])],
        p4: [parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13])],
      },
    };
  }

  /**
   * 解析元数据注释
   * LDraw 文件中的元数据格式:
   * - 0 Name: 零件名称
   * - 0 Author: 作者
   * - 0 !LDRAW_ORG: 分类信息
   */
  private static parseMetaComment(comment: string): {
    name?: string;
    description?: string;
    category?: string;
  } {
    const result: { name?: string; description?: string; category?: string } = {};

    // Name:
    if (comment.startsWith('Name:')) {
      result.name = comment.substring(5).trim();
    }
    // !LDRAW_ORG
    else if (comment.startsWith('!LDRAW_ORG')) {
      const parts = comment.split(/\s+/);
      if (parts.length >= 2) {
        result.category = parts[1];
      }
    }
    // 描述行 (首行注释通常是描述)
    else if (!comment.startsWith('!') && !comment.startsWith('Author:') && comment.length > 0) {
      if (!result.description) {
        result.description = comment;
      }
    }

    return result;
  }

  /**
   * 从文件名提取零件ID
   */
  private static extractPartId(fileName: string): string {
    // 移除路径和扩展名
    const baseName = fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
    // 移除 s_ 前缀 (子部分)
    return baseName.replace(/^s_/, '');
  }

  /**
   * 解析 LDraw 变换矩阵为 Three.js 兼容的矩阵
   * LDraw 矩阵格式: [a b c d e f g h i x y z]
   * 其中:
   *   a b c
   *   d e f
   *   g h i  是旋转缩放矩阵
   *   x y z  是平移向量
   */
  static parseMatrix(
    matrix: LDrawSubfile['matrix']
  ): {
    rotation: [number, number, number];
    position: [number, number, number];
    scale: number;
  } {
    const [a, b, c, d, e, f, g, h, i, x, y, z] = matrix;

    // 计算缩放因子 (LDraw 单位通常是 1:1)
    const scale = Math.sqrt(a * a + d * d + g * g);

    // 提取旋转矩阵 (移除缩放)
    const rotA = a / scale;
    const rotB = b / scale;
    const rotC = c / scale;
    const rotD = d / scale;
    const rotE = e / scale;
    const rotF = f / scale;
    const rotG = g / scale;
    const rotH = h / scale;
    const rotI = i / scale;

    // 从旋转矩阵提取欧拉角 (YZX 顺序，兼容 LDraw)
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

    return {
      rotation: [toDegrees(xAngle), toDegrees(yAngle), toDegrees(zAngle)],
      position: [x, y, z],
      scale,
    };
  }
}

/**
 * 简化的 LDraw 零件生成器
 * 用于快速生成常用乐高零件的简单几何体
 * 当没有实际的 .dat 文件时使用
 */
export class SimplePartGenerator {
  /**
   * 生成基础砖块 (2x4 砖块)
   */
  static generateBrick2x4(): LDrawGeometry[] {
    const geometries: LDrawGeometry[] = [];
    const width = 2;
    const depth = 4;
    const height = 1;

    // 生成简单的长方体面 (作为四边形)
    const w = width * 20; // LDraw 单位
    const d = depth * 20;
    const h = height * 24;

    // 顶面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, h, -d / 2],
      p2: [w / 2, h, -d / 2],
      p3: [w / 2, h, d / 2],
      p4: [-w / 2, h, d / 2],
    });

    // 底面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [-w / 2, 0, d / 2],
      p3: [w / 2, 0, d / 2],
      p4: [w / 2, 0, -d / 2],
    });

    // 前面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, d / 2],
      p2: [-w / 2, h, d / 2],
      p3: [w / 2, h, d / 2],
      p4: [w / 2, 0, d / 2],
    });

    // 后面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [w / 2, 0, -d / 2],
      p3: [w / 2, h, -d / 2],
      p4: [-w / 2, h, -d / 2],
    });

    // 左面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [-w / 2, h, -d / 2],
      p3: [-w / 2, h, d / 2],
      p4: [-w / 2, 0, d / 2],
    });

    // 右面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [w / 2, 0, -d / 2],
      p2: [w / 2, 0, d / 2],
      p3: [w / 2, h, d / 2],
      p4: [w / 2, h, -d / 2],
    });

    return geometries;
  }

  /**
   * 生成基础板 (2x4 薄板)
   */
  static generatePlate2x4(): LDrawGeometry[] {
    const geometries: LDrawGeometry[] = [];
    const width = 2;
    const depth = 4;
    const height = 0.333; // 板的高度是砖的 1/3

    const w = width * 20;
    const d = depth * 20;
    const h = height * 24;

    // 顶面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, h, -d / 2],
      p2: [w / 2, h, -d / 2],
      p3: [w / 2, h, d / 2],
      p4: [-w / 2, h, d / 2],
    });

    // 底面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [-w / 2, 0, d / 2],
      p3: [w / 2, 0, d / 2],
      p4: [w / 2, 0, -d / 2],
    });

    // 前面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, d / 2],
      p2: [-w / 2, h, d / 2],
      p3: [w / 2, h, d / 2],
      p4: [w / 2, 0, d / 2],
    });

    // 后面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [w / 2, 0, -d / 2],
      p3: [w / 2, h, -d / 2],
      p4: [-w / 2, h, -d / 2],
    });

    // 左面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [-w / 2, 0, -d / 2],
      p2: [-w / 2, h, -d / 2],
      p3: [-w / 2, h, d / 2],
      p4: [-w / 2, 0, d / 2],
    });

    // 右面
    geometries.push({
      type: 'quad',
      color: 16,
      p1: [w / 2, 0, -d / 2],
      p2: [w / 2, 0, d / 2],
      p3: [w / 2, h, d / 2],
      p4: [w / 2, h, -d / 2],
    });

    return geometries;
  }
}

/**
 * 常用零件定义
 */
export const CommonParts: Record<string, LDrawPart> = {
  '3001': {
    id: '3001',
    name: 'Brick 2x4',
    fileName: '3001.dat',
    description: '2x4 标准砖块',
    category: 'Brick',
    geometries: SimplePartGenerator.generateBrick2x4(),
  },
  '3020': {
    id: '3020',
    name: 'Plate 2x4',
    fileName: '3020.dat',
    description: '2x4 薄板',
    category: 'Plate',
    geometries: SimplePartGenerator.generatePlate2x4(),
  },
  '3003': {
    id: '3003',
    name: 'Brick 2x2',
    fileName: '3003.dat',
    description: '2x2 标准砖块',
    category: 'Brick',
    geometries: SimplePartGenerator.generateBrick2x4(), // 暂时复用
  },
  '3022': {
    id: '3022',
    name: 'Plate 2x2',
    fileName: '3022.dat',
    description: '2x2 薄板',
    category: 'Plate',
    geometries: SimplePartGenerator.generatePlate2x4(), // 暂时复用
  },
};

export default LDrawParser;
