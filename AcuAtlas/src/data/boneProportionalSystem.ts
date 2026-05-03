import { Point3D, BoneMeasurement } from '../types';

// ============================================
// 骨度分寸法参数化定位系统
// 
// 本系统实现了基于《灵枢·骨度》的传统骨度分寸法，
// 通过标准化的人体比例参数来精确定位穴位位置。
// 
// 骨度分寸法将人体各部位规定为一定的长度或宽度，
// 折作若干等分，每一等分称为1寸。
// ============================================

// 标准人体模型尺寸（单位：米，基于平均身高1.7米）
export const STANDARD_HEIGHT = 1.7; // 米

// 骨度分寸参考表
// 所有尺寸均基于标准人体比例
export const BONE_MEASUREMENTS: BoneMeasurement[] = [
  // 头面部
  {
    id: 'head_front_hairline_to_back',
    name: '前发际至后发际',
    location: '前发际正中至后发际正中',
    cun: 12,
    referencePoints: {
      start: { x: 0, y: 1.62, z: 0.08 },
      end: { x: 0, y: 1.62, z: -0.08 }
    }
  },
  {
    id: 'head_forehead',
    name: '前额两发角之间',
    location: '头维穴之间',
    cun: 9,
    referencePoints: {
      start: { x: -0.08, y: 1.65, z: 0.05 },
      end: { x: 0.08, y: 1.65, z: 0.05 }
    }
  },
  {
    id: 'head_occipital',
    name: '耳后两乳突之间',
    location: '完骨穴之间',
    cun: 9,
    referencePoints: {
      start: { x: -0.09, y: 1.58, z: -0.03 },
      end: { x: 0.09, y: 1.58, z: -0.03 }
    }
  },
  
  // 胸腹部
  {
    id: 'chest_sternum_to_umbilicus',
    name: '胸骨上窝至胸剑联合',
    location: '天突至歧骨',
    cun: 9,
    referencePoints: {
      start: { x: 0, y: 1.55, z: 0.05 },
      end: { x: 0, y: 1.25, z: 0.05 }
    }
  },
  {
    id: 'chest_umbilicus_to_pubis',
    name: '胸剑联合至脐中',
    location: '歧骨至脐中',
    cun: 8,
    referencePoints: {
      start: { x: 0, y: 1.25, z: 0.05 },
      end: { x: 0, y: 1.0, z: 0.05 }
    }
  },
  {
    id: 'chest_pubis',
    name: '脐中至耻骨联合上缘',
    location: '脐中至曲骨',
    cun: 5,
    referencePoints: {
      start: { x: 0, y: 1.0, z: 0.05 },
      end: { x: 0, y: 0.85, z: 0.02 }
    }
  },
  {
    id: 'chest_nipples',
    name: '两乳头之间',
    location: '两乳头中点距离',
    cun: 8,
    referencePoints: {
      start: { x: -0.1, y: 1.3, z: 0.06 },
      end: { x: 0.1, y: 1.3, z: 0.06 }
    }
  },
  
  // 背腰部
  {
    id: 'back_vertebrae',
    name: '肩胛骨内缘至后正中线',
    location: '脊柱至肩胛骨内缘',
    cun: 3,
    referencePoints: {
      start: { x: 0, y: 1.3, z: -0.05 },
      end: { x: -0.08, y: 1.3, z: -0.06 }
    }
  },
  {
    id: 'back_shoulders',
    name: '肩峰缘至后正中线',
    location: '肩峰至脊柱',
    cun: 8,
    referencePoints: {
      start: { x: -0.2, y: 1.45, z: 0 },
      end: { x: 0, y: 1.45, z: -0.05 }
    }
  },
  
  // 上肢部
  {
    id: 'upper_arm',
    name: '腋前纹头至肘横纹',
    location: '上臂长度',
    cun: 9,
    referencePoints: {
      start: { x: -0.18, y: 1.35, z: 0.02 },
      end: { x: -0.18, y: 1.0, z: 0.05 }
    }
  },
  {
    id: 'upper_forearm',
    name: '肘横纹至腕横纹',
    location: '前臂长度',
    cun: 12,
    referencePoints: {
      start: { x: -0.18, y: 1.0, z: 0.05 },
      end: { x: -0.18, y: 0.65, z: 0.08 }
    }
  },
  
  // 下肢部
  {
    id: 'lower_thigh_front',
    name: '耻骨联合上缘至股骨内上髁',
    location: '大腿内侧长度',
    cun: 18,
    referencePoints: {
      start: { x: -0.05, y: 0.85, z: 0.02 },
      end: { x: -0.08, y: 0.45, z: 0.02 }
    }
  },
  {
    id: 'lower_thigh_back',
    name: '股骨大转子至腘横纹',
    location: '大腿外侧长度',
    cun: 19,
    referencePoints: {
      start: { x: -0.15, y: 0.8, z: -0.08 },
      end: { x: -0.12, y: 0.35, z: -0.02 }
    }
  },
  {
    id: 'lower_leg_medial',
    name: '胫骨内侧髁下方至内踝尖',
    location: '小腿内侧长度',
    cun: 13,
    referencePoints: {
      start: { x: -0.08, y: 0.4, z: 0.01 },
      end: { x: -0.06, y: 0.08, z: 0.02 }
    }
  },
  {
    id: 'lower_leg_lateral',
    name: '腘横纹至外踝尖',
    location: '小腿外侧长度',
    cun: 16,
    referencePoints: {
      start: { x: -0.12, y: 0.35, z: -0.02 },
      end: { x: -0.08, y: 0.08, z: -0.02 }
    }
  }
];

// 标准人体解剖标志点（用于骨度分寸定位）
export const ANATOMICAL_LANDMARKS: Record<string, Point3D> = {
  // 头部
  'vertex': { x: 0, y: 1.7, z: 0 },           // 头顶（百会位置）
  'glabella': { x: 0, y: 1.65, z: 0.09 },     // 眉间
  'front_hairline': { x: 0, y: 1.62, z: 0.08 }, // 前发际正中
  'back_hairline': { x: 0, y: 1.62, z: -0.08 }, // 后发际正中
  'nasion': { x: 0, y: 1.62, z: 0.1 },        // 鼻根
  'acromion': { x: 0.18, y: 1.45, z: 0 },     // 肩峰（右）
  'acromion_left': { x: -0.18, y: 1.45, z: 0 }, // 肩峰（左）
  
  // 躯干前面
  'suprasternal_notch': { x: 0, y: 1.55, z: 0.05 }, // 胸骨上窝
  'sternal_angle': { x: 0, y: 1.45, z: 0.06 },      // 胸骨角
  'xiphoid_process': { x: 0, y: 1.25, z: 0.05 },    // 剑突
  'umbilicus': { x: 0, y: 1.0, z: 0.05 },            // 脐中
  'pubic_symphysis': { x: 0, y: 0.85, z: 0.02 },     // 耻骨联合
  
  // 躯干后面
  'c7_spinous': { x: 0, y: 1.45, z: -0.05 },         // 第7颈椎棘突
  't3_spinous': { x: 0, y: 1.35, z: -0.06 },         // 第3胸椎棘突
  't7_spinous': { x: 0, y: 1.25, z: -0.06 },         // 第7胸椎棘突
  'l4_spinous': { x: 0, y: 1.05, z: -0.06 },         // 第4腰椎棘突
  'sacrum': { x: 0, y: 0.9, z: -0.08 },               // 骶骨
  
  // 上肢（右侧）
  'axilla_right': { x: 0.18, y: 1.35, z: 0.02 },     // 腋窝
  'elbow_crease_right': { x: 0.18, y: 1.0, z: 0.05 }, // 肘横纹
  'wrist_crease_right': { x: 0.18, y: 0.65, z: 0.08 }, // 腕横纹
  'thenar_right': { x: 0.18, y: 0.6, z: 0.09 },       // 大鱼际
  'hypothenar_right': { x: 0.18, y: 0.6, z: 0.07 },   // 小鱼际
  'middle_finger_tip_right': { x: 0.18, y: 0.5, z: 0.1 }, // 中指尖
  
  // 上肢（左侧）
  'axilla_left': { x: -0.18, y: 1.35, z: 0.02 },
  'elbow_crease_left': { x: -0.18, y: 1.0, z: 0.05 },
  'wrist_crease_left': { x: -0.18, y: 0.65, z: 0.08 },
  
  // 下肢（右侧）
  'femoral_head_right': { x: 0.12, y: 0.85, z: 0 },   // 股骨头
  'greater_trochanter_right': { x: 0.15, y: 0.8, z: -0.08 }, // 大转子
  'medial_epicondyle_right': { x: 0.08, y: 0.45, z: 0.02 }, // 股骨内上髁
  'popliteal_crease_right': { x: 0.12, y: 0.35, z: -0.02 }, // 腘横纹
  'medial_malleolus_right': { x: 0.06, y: 0.08, z: 0.02 },  // 内踝尖
  'lateral_malleolus_right': { x: 0.08, y: 0.08, z: -0.02 }, // 外踝尖
  'metatarsal_1_right': { x: 0.06, y: 0.02, z: 0.05 },      // 第1跖趾关节
  'metatarsal_5_right': { x: 0.08, y: 0.02, z: -0.01 },     // 第5跖趾关节
  
  // 下肢（左侧）
  'femoral_head_left': { x: -0.12, y: 0.85, z: 0 },
  'greater_trochanter_left': { x: -0.15, y: 0.8, z: -0.08 },
  'medial_epicondyle_left': { x: -0.08, y: 0.45, z: 0.02 },
  'popliteal_crease_left': { x: -0.12, y: 0.35, z: -0.02 },
  'medial_malleolus_left': { x: -0.06, y: 0.08, z: 0.02 },
  'lateral_malleolus_left': { x: -0.08, y: 0.08, z: -0.02 }
};

/**
 * 基于骨度分寸法计算穴位坐标
 * @param referencePoint 参照解剖标志点名称
 * @param direction 方向
 * @param cunDistance 距离（寸）
 * @param boneSegment 骨度分寸参考骨段
 * @param isLeftSide 是否为左侧（用于对称穴位）
 */
export function calculateAcupointPosition(
  referencePoint: string,
  direction: 'anterior' | 'posterior' | 'superior' | 'inferior' | 'medial' | 'lateral',
  cunDistance: number,
  boneSegment?: string,
  isLeftSide: boolean = false
): Point3D {
  // 获取参照点坐标
  let refPoint = ANATOMICAL_LANDMARKS[referencePoint];
  if (!refPoint) {
    console.warn(`Unknown reference point: ${referencePoint}`);
    refPoint = { x: 0, y: 0, z: 0 };
  }
  
  // 如果是左侧且参照点有对应左侧点，使用左侧参照点
  if (isLeftSide && ANATOMICAL_LANDMARKS[`${referencePoint}_left`]) {
    refPoint = ANATOMICAL_LANDMARKS[`${referencePoint}_left`];
  }
  
  // 计算寸到米的转换系数
  // 基于不同的骨段使用不同的转换系数
  let cunToMeter = 0.016; // 默认约1.6厘米/寸
  
  // 根据骨段调整转换系数
  if (boneSegment) {
    const measurement = BONE_MEASUREMENTS.find(m => m.id === boneSegment);
    if (measurement) {
      const distance = Math.sqrt(
        Math.pow(measurement.referencePoints.end.x - measurement.referencePoints.start.x, 2) +
        Math.pow(measurement.referencePoints.end.y - measurement.referencePoints.start.y, 2) +
        Math.pow(measurement.referencePoints.end.z - measurement.referencePoints.start.z, 2)
      );
      cunToMeter = distance / measurement.cun;
    }
  }
  
  const offset = cunDistance * cunToMeter;
  
  // 根据方向计算新坐标
  const result = { ...refPoint };
  
  switch (direction) {
    case 'anterior': // 向前（Z增加方向，朝向观看者）
      result.z += offset;
      break;
    case 'posterior': // 向后（Z减少方向，远离观看者）
      result.z -= offset;
      break;
    case 'superior': // 向上（Y增加方向）
      result.y += offset;
      break;
    case 'inferior': // 向下（Y减少方向）
      result.y -= offset;
      break;
    case 'medial': // 向内侧（X向0靠近）
      result.x += (isLeftSide ? 1 : -1) * offset;
      break;
    case 'lateral': // 向外侧（X远离0）
      result.x += (isLeftSide ? -1 : 1) * offset;
      break;
  }
  
  return result;
}

/**
 * 计算多个骨度分寸位移的组合
 * 用于复杂穴位定位
 */
export function calculateCombinedPosition(
  referencePoint: string,
  displacements: {
    direction: 'anterior' | 'posterior' | 'superior' | 'inferior' | 'medial' | 'lateral';
    cun: number;
    boneSegment?: string;
  }[],
  isLeftSide: boolean = false
): Point3D {
  let point: Point3D = calculateAcupointPosition(
    referencePoint,
    displacements[0]?.direction || 'anterior',
    0,
    displacements[0]?.boneSegment,
    isLeftSide
  );
  
  for (const disp of displacements) {
    const offsetPoint = calculateAcupointPosition(
      referencePoint,
      disp.direction,
      disp.cun,
      disp.boneSegment,
      isLeftSide
    );
    
    // 计算相对于参照点的偏移量
    const dx = offsetPoint.x - point.x;
    const dy = offsetPoint.y - point.y;
    const dz = offsetPoint.z - point.z;
    
    // 应用偏移
    point.x += dx;
    point.y += dy;
    point.z += dz;
    
    // 更新参照点为当前点，用于下一次计算
    point = { ...point };
  }
  
  return point;
}

/**
 * 指寸法转换
 * @param fingerType 指寸类型
 * @param isPatient 是否以患者指寸为准（简化模型中使用标准值）
 */
export function fingerCunToMeter(
  fingerType: 'thumb' | 'middle' | 'four_finger',
  _isPatient: boolean = true
): number {
  // 指寸法标准值（单位：米）
  const FINGER_CUN: Record<string, number> = {
    'thumb': 0.02,      // 拇指同身寸：约2cm
    'middle': 0.022,    // 中指同身寸：约2.2cm
    'four_finger': 0.06 // 一夫法（四指并拢）：约6cm
  };
  
  return FINGER_CUN[fingerType] || 0.02;
}

/**
 * 获取特定骨段的每寸长度
 * @param boneMeasurementId 骨度分寸ID
 */
export function getCunPerMeter(boneMeasurementId: string): number {
  const measurement = BONE_MEASUREMENTS.find(m => m.id === boneMeasurementId);
  if (!measurement) {
    return 0.016; // 默认值
  }
  
  const distance = Math.sqrt(
    Math.pow(measurement.referencePoints.end.x - measurement.referencePoints.start.x, 2) +
    Math.pow(measurement.referencePoints.end.y - measurement.referencePoints.start.y, 2) +
    Math.pow(measurement.referencePoints.end.z - measurement.referencePoints.start.z, 2)
  );
  
  return distance / measurement.cun;
}

// 导出骨度分寸系统
export const boneProportionalSystem = {
  measurements: BONE_MEASUREMENTS,
  landmarks: ANATOMICAL_LANDMARKS,
  calculatePosition: calculateAcupointPosition,
  calculateCombinedPosition,
  fingerCunToMeter,
  getCunPerMeter
};
