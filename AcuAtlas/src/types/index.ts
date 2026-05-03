// ============================================
// 经络穴位系统类型定义
// ============================================

// 经络类型（十二正经 + 任督二脉）
export type MeridianType = 
  | 'LU' // 手太阴肺经
  | 'LI' // 手阳明大肠经
  | 'ST' // 足阳明胃经
  | 'SP' // 足太阴脾经
  | 'HT' // 手少阴心经
  | 'SI' // 手太阳小肠经
  | 'BL' // 足太阳膀胱经
  | 'KI' // 足少阴肾经
  | 'PC' // 手厥阴心包经
  | 'SJ' // 手少阳三焦经
  | 'GB' // 足少阳胆经
  | 'LR' // 足厥阴肝经
  | 'CV' // 任脉
  | 'DU'; // 督脉

// 经外奇穴类别
export type ExtraPointCategory = 
  | 'head'    // 头颈部
  | 'chest'   // 胸腹部
  | 'back'    // 背腰部
  | 'upper'   // 上肢部
  | 'lower';  // 下肢部

// 进针层次
export type InsertionLayer = 
  | 'skin'    // 皮
  | 'flesh'   // 肉
  | 'vessel'  // 脉
  | 'tendon'  // 筋
  | 'bone';   // 骨

// 穴位定位方法
export type LocationMethod = 
  | 'bone_proportional'  // 骨度分寸法
  | 'anatomical_landmark' // 体表解剖标志定位法
  | 'finger_cun';         // 指寸法

// 三维坐标点
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// 骨度分寸定位参数
export interface BoneProportionalParams {
  referencePoint: string;  // 参照解剖标志点
  proportionalDistance: {  // 比例距离（相对于骨度分寸）
    direction: 'anterior' | 'posterior' | 'superior' | 'inferior' | 'medial' | 'lateral';
    cun: number;  // 寸数
  }[];
  boneMeasurement: {      // 骨度分寸参考
    segment: string;       // 骨段名称
    totalCun: number;      // 总寸数
  };
}

// 穴位基础信息
export interface AcupointBase {
  id: string;              // 唯一标识符
  name: string;            // 中文名称
  pinyin: string;          // 拼音名称
  code?: string;           // 国际标准代码
  alternativeNames?: string[]; // 别名
}

// 经络穴位（经穴）
export interface MeridianAcupoint extends AcupointBase {
  type: 'meridian';
  meridian: MeridianType;  // 所属经络
  meridianOrder: number;    // 在经络中的序号
  isFrontMu?: boolean;      // 是否募穴
  isBackShu?: boolean;      // 是否俞穴
  isYuanSource?: boolean;   // 是否原穴
  isLuoConnecting?: boolean; // 是否络穴
  isXiCleft?: boolean;      // 是否郄穴
  isHeSea?: boolean;        // 是否合穴
  isJingRiver?: boolean;    // 是否经穴
  isShuStream?: boolean;    // 是否输穴
  isYingSpring?: boolean;   // 是否荥穴
  isJingWell?: boolean;     // 是否井穴
  isEightConfluence?: boolean; // 是否八脉交会穴
  isInfluential?: boolean;   // 是否八会穴
}

// 经外奇穴
export interface ExtraAcupoint extends AcupointBase {
  type: 'extra';
  category: ExtraPointCategory; // 所属类别
  isDanger?: boolean;        // 是否危险穴位
}

// 穴位定位信息
interface AcupointLocation {
  description: string;     // 文字描述
  method: LocationMethod;  // 定位方法
  boneParams?: BoneProportionalParams; // 骨度分寸参数
}

// 穴位坐标信息
interface AcupointCoordinates {
  right?: Point3D;         // 右侧穴位坐标（双侧穴位）
  left?: Point3D;          // 左侧穴位坐标（双侧穴位）
  center?: Point3D;        // 中心坐标（任督二脉等单穴）
}

// 进针信息
interface AcupointNeedling {
  standardDepth: number;   // 标准进针深度（单位：mm）
  maxDepth: number;        // 最大安全深度
  layers: InsertionLayer[]; // 进针层次顺序
  angle: {                  // 进针角度
    vertical?: number;      // 垂直深度
    oblique?: number;       // 斜刺
    horizontal?: number;    // 平刺
  };
  directions: string[];     // 进针方向描述
  precautions?: string;     // 注意事项
}

// 主治病症
interface AcupointIndications {
  primary: string[];       // 主要主治
  secondary: string[];     // 次要主治
  traditional: string[];   // 传统主治描述
}

// 配伍信息
interface AcupointCombination {
  with: string;            // 配伍穴位ID
  indication: string;      // 主治病症
  method: string;          // 配伍方法
}

// 解剖层次
interface AcupointAnatomy {
  skin: string;            // 皮肤层次
  subcutaneous: string;    // 皮下组织
  muscle: string;          // 肌肉层次
  vessels: string;         // 血管
  nerves: string;          // 神经
}

// 完整穴位信息
export type Acupoint = (MeridianAcupoint | ExtraAcupoint) & {
  location: AcupointLocation;
  coordinates: AcupointCoordinates;
  needling: AcupointNeedling;
  indications: AcupointIndications;
  combinations?: AcupointCombination[];
  deqiSensation: string[];
  anatomy: AcupointAnatomy;
};

// 经络信息
export interface Meridian {
  type: MeridianType;
  name: string;               // 中文名称
  pinyin: string;             // 拼音名称
  color: string;              // 显示颜色
  category: 'yin' | 'yang';   // 阴阳属性
  handOrFoot: 'hand' | 'foot'; // 手足属性
  circulationPath: Point3D[]; // 循行路线（三维坐标点序列）
  acupointOrder: string[];    // 穴位顺序ID列表
  description: string;         // 经络描述
  mainFunctions: string[];     // 主要功能
  commonPathologies: string[]; // 常见病症
}

// 骨度分寸参考
export interface BoneMeasurement {
  id: string;
  name: string;               // 部位名称
  location: string;           // 起止点描述
  cun: number;                // 骨度分寸（寸）
  referencePoints: {
    start: Point3D;           // 起点坐标
    end: Point3D;             // 终点坐标
  };
  notes?: string;             // 备注
}

// 进针状态
export interface NeedleState {
  acupointId: string;         // 目标穴位ID
  currentDepth: number;       // 当前深度（mm）
  maxDepth: number;           // 最大深度
  currentLayer: InsertionLayer; // 当前层次
  layers: {
    layer: InsertionLayer;
    startDepth: number;
    endDepth: number;
    entered: boolean;
  }[];
  hasDeqi: boolean;           // 是否得气
  deqiStrength: number;       // 得气强度（0-1）
  isCorrectAngle: boolean;    // 角度是否正确
}

// UI可视化状态
export interface VisualizationState {
  showSkin: boolean;          // 显示皮肤层
  showMuscles: boolean;       // 显示肌肉层
  showBones: boolean;         // 显示骨骼层
  showMeridians: boolean;     // 显示经络
  showAcupoints: boolean;     // 显示穴位
  skinOpacity: number;        // 皮肤透明度（0-1）
  muscleOpacity: number;      // 肌肉透明度
  boneOpacity: number;        // 骨骼透明度
  selectedMeridian?: MeridianType; // 当前选中的经络
  anatomicalView: 'front' | 'back' | 'left' | 'right' | 'top' | 'perspective';
}

// 练习模式
export type PracticeMode = 
  | 'learning'    // 学习模式
  | 'acupoint_selection' // 取穴练习
  | 'needling_practice' // 进针练习
  | 'quiz';      // 测验模式

// 练习记录
export interface PracticeRecord {
  id: string;
  timestamp: number;
  mode: PracticeMode;
  acupointId?: string;
  score: number;
  correct: boolean;
  details?: {
    depthAccuracy?: number;
    angleAccuracy?: number;
    deqiDetected?: boolean;
  };
}

// LocalForage 数据结构
export interface AcuAtlasData {
  acupoints: Record<string, Acupoint>;
  meridians: Record<MeridianType, Meridian>;
  boneMeasurements: BoneMeasurement[];
  practiceRecords: PracticeRecord[];
}
