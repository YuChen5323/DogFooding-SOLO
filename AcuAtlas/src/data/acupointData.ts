import localforage from 'localforage';
import { Acupoint, Meridian, MeridianType, Point3D, InsertionLayer } from '../types';
import { calculateAcupointPosition } from './boneProportionalSystem';

// ============================================
// 穴位数据模块
// 
// 包含：
// 1. 14条经络（十二正经+任督二脉）定义
// 2. 361个经穴和经外奇穴数据
// 3. LocalForage存储和初始化功能
// ============================================

// 经络颜色配置（根据五行属性）
export const MERIDIAN_COLORS: Record<MeridianType, string> = {
  LU: '#D1BBD7', // 手太阴肺经（金：白色系偏紫）
  LI: '#E7CEC7', // 手阳明大肠经（金：白色系偏粉）
  ST: '#FCF0CF', // 足阳明胃经（土：黄色系）
  SP: '#E6C489', // 足太阴脾经（土：黄色系偏深）
  HT: '#F8BDB5', // 手少阴心经（火：红色系）
  SI: '#F29492', // 手太阳小肠经（火：红色系偏深）
  BL: '#B3CDE3', // 足太阳膀胱经（水：黑色系偏蓝）
  KI: '#8DA0CB', // 足少阴肾经（水：蓝色系偏深）
  PC: '#FBB4AE', // 手厥阴心包经（君火：红色系）
  SJ: '#F4A582', // 手少阳三焦经（相火：橙色系）
  GB: '#B3E2CD', // 足少阳胆经（木：绿色系）
  LR: '#66C2A5', // 足厥阴肝经（木：绿色系偏深）
  CV: '#FDCDAC', // 任脉（阴脉之海：橙色系）
  DU: '#FFD92F'  // 督脉（阳脉之海：黄色系偏亮）
};

// ============================================
// 经络循行路线数据
// ============================================

function generateMeridianPath(meridian: MeridianType, isLeft: boolean = true): Point3D[] {
  const side = isLeft ? -1 : 1;
  const paths: Partial<Record<MeridianType, Point3D[]>> = {
    // 手太阴肺经 - 从中焦走手
    LU: [
      { x: side * 0.05, y: 1.2, z: 0.05 },
      { x: side * 0.15, y: 1.3, z: 0.03 },
      { x: side * 0.18, y: 1.0, z: 0.05 },
      { x: side * 0.18, y: 0.65, z: 0.08 },
      { x: side * 0.18, y: 0.55, z: 0.09 }
    ],
    // 手阳明大肠经 - 从手走头
    LI: [
      { x: side * 0.18, y: 0.55, z: 0.07 },
      { x: side * 0.18, y: 0.65, z: 0.08 },
      { x: side * 0.18, y: 1.0, z: 0.05 },
      { x: side * 0.2, y: 1.4, z: 0 },
      { x: side * 0.1, y: 1.6, z: 0.05 }
    ],
    // 足阳明胃经 - 从头走足
    ST: [
      { x: side * 0.08, y: 1.6, z: 0.08 },
      { x: side * 0.1, y: 1.55, z: 0.06 },
      { x: side * 0.12, y: 1.3, z: 0.06 },
      { x: side * 0.1, y: 1.0, z: 0.05 },
      { x: side * 0.1, y: 0.5, z: 0.02 },
      { x: side * 0.08, y: 0.08, z: 0.02 }
    ],
    // 足太阴脾经 - 从足走腹
    SP: [
      { x: side * 0.06, y: 0.08, z: 0.03 },
      { x: side * 0.08, y: 0.4, z: 0.01 },
      { x: side * 0.08, y: 0.8, z: 0.02 },
      { x: side * 0.05, y: 1.1, z: 0.05 },
      { x: 0, y: 1.25, z: 0.05 }
    ],
    // 手少阴心经 - 从心走手
    HT: [
      { x: 0, y: 1.3, z: 0.05 },
      { x: side * 0.05, y: 1.3, z: 0.05 },
      { x: side * 0.18, y: 1.0, z: 0.05 },
      { x: side * 0.18, y: 0.65, z: 0.08 },
      { x: side * 0.18, y: 0.55, z: 0.08 }
    ],
    // 手太阳小肠经 - 从手走头
    SI: [
      { x: side * 0.18, y: 0.55, z: 0.06 },
      { x: side * 0.18, y: 0.65, z: 0.06 },
      { x: side * 0.18, y: 1.0, z: 0.03 },
      { x: side * 0.15, y: 1.4, z: -0.03 },
      { x: side * 0.05, y: 1.6, z: -0.05 }
    ],
    // 足太阳膀胱经 - 从头走足（后侧）
    BL: [
      { x: side * 0.05, y: 1.6, z: 0 },
      { x: side * 0.08, y: 1.5, z: -0.05 },
      { x: side * 0.1, y: 1.2, z: -0.06 },
      { x: side * 0.1, y: 0.8, z: -0.05 },
      { x: side * 0.1, y: 0.35, z: -0.02 },
      { x: side * 0.08, y: 0.08, z: -0.03 }
    ],
    // 足少阴肾经 - 从足走腹
    KI: [
      { x: side * 0.06, y: 0.08, z: 0 },
      { x: side * 0.08, y: 0.4, z: 0 },
      { x: side * 0.06, y: 0.85, z: 0.02 },
      { x: side * 0.03, y: 1.1, z: 0.05 },
      { x: 0, y: 1.2, z: 0.05 }
    ],
    // 手厥阴心包经 - 从胸走手
    PC: [
      { x: 0, y: 1.25, z: 0.05 },
      { x: side * 0.05, y: 1.25, z: 0.05 },
      { x: side * 0.18, y: 1.0, z: 0.05 },
      { x: side * 0.18, y: 0.65, z: 0.08 },
      { x: side * 0.18, y: 0.55, z: 0.1 }
    ],
    // 手少阳三焦经 - 从手走头
    SJ: [
      { x: side * 0.18, y: 0.55, z: 0.06 },
      { x: side * 0.18, y: 0.65, z: 0.06 },
      { x: side * 0.18, y: 1.0, z: 0.03 },
      { x: side * 0.18, y: 1.4, z: -0.02 },
      { x: side * 0.08, y: 1.6, z: -0.03 }
    ],
    // 足少阳胆经 - 从头走足（外侧）
    GB: [
      { x: side * 0.08, y: 1.6, z: -0.01 },
      { x: side * 0.12, y: 1.5, z: -0.03 },
      { x: side * 0.15, y: 1.2, z: -0.02 },
      { x: side * 0.12, y: 0.8, z: -0.05 },
      { x: side * 0.1, y: 0.35, z: -0.03 },
      { x: side * 0.08, y: 0.08, z: -0.02 }
    ],
    // 足厥阴肝经 - 从足走腹
    LR: [
      { x: side * 0.06, y: 0.08, z: 0.04 },
      { x: side * 0.08, y: 0.4, z: 0.01 },
      { x: side * 0.08, y: 0.8, z: 0.02 },
      { x: side * 0.03, y: 1.15, z: 0.05 },
      { x: 0, y: 1.2, z: 0.05 }
    ],
    // 任脉 - 前正中线
    CV: [
      { x: 0, y: 0.85, z: 0.02 },
      { x: 0, y: 1.0, z: 0.05 },
      { x: 0, y: 1.25, z: 0.05 },
      { x: 0, y: 1.45, z: 0.06 },
      { x: 0, y: 1.62, z: 0.08 },
      { x: 0, y: 1.65, z: 0.09 }
    ],
    // 督脉 - 后正中线
    DU: [
      { x: 0, y: 0.9, z: -0.08 },
      { x: 0, y: 1.05, z: -0.06 },
      { x: 0, y: 1.25, z: -0.06 },
      { x: 0, y: 1.45, z: -0.05 },
      { x: 0, y: 1.62, z: -0.08 },
      { x: 0, y: 1.7, z: 0 }
    ]
  };
  
  return paths[meridian] || [];
}

// ============================================
// 经络定义
// ============================================
export const MERIDIANS: Record<MeridianType, Meridian> = {
  LU: {
    type: 'LU',
    name: '手太阴肺经',
    pinyin: 'Shou Taiyin Fei Jing',
    color: MERIDIAN_COLORS.LU,
    category: 'yin',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('LU'),
    acupointOrder: ['LU1', 'LU5', 'LU7', 'LU9', 'LU10', 'LU11'],
    description: '十二经脉之一，属于肺，络大肠，与手阳明大肠经相表里。',
    mainFunctions: ['主气司呼吸', '主宣发肃降', '通调水道', '朝百脉主治节'],
    commonPathologies: ['咳嗽', '气喘', '胸部胀满', '咽喉肿痛', '外感风寒', '肩背痛']
  },
  LI: {
    type: 'LI',
    name: '手阳明大肠经',
    pinyin: 'Shou Yangming Dachang Jing',
    color: MERIDIAN_COLORS.LI,
    category: 'yang',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('LI'),
    acupointOrder: ['LI4', 'LI10', 'LI11', 'LI15', 'LI20'],
    description: '十二经脉之一，属于大肠，络肺，与手太阴肺经相表里。',
    mainFunctions: ['主传导糟粕', '主津', '调节肠胃功能'],
    commonPathologies: ['腹痛', '肠鸣', '泄泻', '便秘', '咽喉肿痛', '齿痛']
  },
  ST: {
    type: 'ST',
    name: '足阳明胃经',
    pinyin: 'Zu Yangming Wei Jing',
    color: MERIDIAN_COLORS.ST,
    category: 'yang',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('ST'),
    acupointOrder: ['ST2', 'ST6', 'ST7', 'ST8', 'ST34', 'ST36', 'ST37', 'ST39', 'ST40', 'ST41', 'ST44', 'ST45'],
    description: '十二经脉之一，属于胃，络脾，与足太阴脾经相表里。',
    mainFunctions: ['主受纳腐熟', '主通降', '为后天之本'],
    commonPathologies: ['胃痛', '腹胀', '呕吐', '噎膈', '泄泻', '癫狂', '热病']
  },
  SP: {
    type: 'SP',
    name: '足太阴脾经',
    pinyin: 'Zu Taiyin Pi Jing',
    color: MERIDIAN_COLORS.SP,
    category: 'yin',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('SP'),
    acupointOrder: ['SP4', 'SP6', 'SP9', 'SP10', 'SP15'],
    description: '十二经脉之一，属于脾，络胃，与足阳明胃经相表里。',
    mainFunctions: ['主运化', '主升清', '主统血', '为后天之本'],
    commonPathologies: ['胃脘痛', '腹胀', '呕吐', '嗳气', '黄疸', '身重无力']
  },
  HT: {
    type: 'HT',
    name: '手少阴心经',
    pinyin: 'Shou Shaoyin Xin Jing',
    color: MERIDIAN_COLORS.HT,
    category: 'yin',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('HT'),
    acupointOrder: ['HT3', 'HT5', 'HT6', 'HT7'],
    description: '十二经脉之一，属于心，络小肠，与手太阳小肠经相表里。',
    mainFunctions: ['主血脉', '主藏神', '为君主之官'],
    commonPathologies: ['心痛', '咽干', '口渴', '目黄', '胁痛', '上肢内侧痛', '掌中热']
  },
  SI: {
    type: 'SI',
    name: '手太阳小肠经',
    pinyin: 'Shou Taiyang Xiaochang Jing',
    color: MERIDIAN_COLORS.SI,
    category: 'yang',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('SI'),
    acupointOrder: ['SI3', 'SI4', 'SI5', 'SI6', 'SI11'],
    description: '十二经脉之一，属于小肠，络心，与手少阴心经相表里。',
    mainFunctions: ['主受盛化物', '主泌别清浊', '主液'],
    commonPathologies: ['少腹痛', '腰脊痛引睾丸', '耳聋', '目黄', '颊肿', '肩臂外侧后缘痛']
  },
  BL: {
    type: 'BL',
    name: '足太阳膀胱经',
    pinyin: 'Zu Taiyang Pangguang Jing',
    color: MERIDIAN_COLORS.BL,
    category: 'yang',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('BL'),
    acupointOrder: ['BL2', 'BL10', 'BL11', 'BL12', 'BL13', 'BL14', 'BL15', 'BL18', 'BL20', 'BL23', 'BL25', 'BL32', 'BL40', 'BL57', 'BL60', 'BL62', 'BL67'],
    description: '十二经脉之一，属于膀胱，络肾，与足少阴肾经相表里。',
    mainFunctions: ['主贮存和排泄尿液', '主一身之表', '与督脉相通'],
    commonPathologies: ['小便不通', '遗尿', '癫狂', '疟疾', '头痛', '目痛', '项强', '腰痛']
  },
  KI: {
    type: 'KI',
    name: '足少阴肾经',
    pinyin: 'Zu Shaoyin Shen Jing',
    color: MERIDIAN_COLORS.KI,
    category: 'yin',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('KI'),
    acupointOrder: ['KI1', 'KI3', 'KI6', 'KI7', 'KI9'],
    description: '十二经脉之一，属于肾，络膀胱，与足太阳膀胱经相表里。',
    mainFunctions: ['主藏精', '主水液', '主纳气', '为先天之本'],
    commonPathologies: ['咳血', '气喘', '舌干', '咽喉肿痛', '水肿', '大便秘结', '泄泻']
  },
  PC: {
    type: 'PC',
    name: '手厥阴心包经',
    pinyin: 'Shou Jueyin Xinbao Jing',
    color: MERIDIAN_COLORS.PC,
    category: 'yin',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('PC'),
    acupointOrder: ['PC3', 'PC5', 'PC6', 'PC7', 'PC8'],
    description: '十二经脉之一，属于心包，络三焦，与手少阳三焦经相表里。',
    mainFunctions: ['代心受邪', '主神明', '主血脉'],
    commonPathologies: ['心痛', '胸闷', '心悸', '心烦', '癫狂', '腋肿', '肘臂挛急', '掌心热']
  },
  SJ: {
    type: 'SJ',
    name: '手少阳三焦经',
    pinyin: 'Shou Shaoyang Sanjiao Jing',
    color: MERIDIAN_COLORS.SJ,
    category: 'yang',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('SJ'),
    acupointOrder: ['SJ2', 'SJ3', 'SJ4', 'SJ5', 'SJ6', 'SJ17', 'SJ21'],
    description: '十二经脉之一，属于三焦，络心包，与手厥阴心包经相表里。',
    mainFunctions: ['主通行元气', '主运行水液', '为孤腑'],
    commonPathologies: ['腹胀', '水肿', '遗尿', '小便不利', '耳鸣', '耳聋', '咽喉肿痛', '目赤肿痛']
  },
  GB: {
    type: 'GB',
    name: '足少阳胆经',
    pinyin: 'Zu Shaoyang Dan Jing',
    color: MERIDIAN_COLORS.GB,
    category: 'yang',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('GB'),
    acupointOrder: ['GB1', 'GB2', 'GB8', 'GB14', 'GB20', 'GB30', 'GB31', 'GB34', 'GB39', 'GB40', 'GB43'],
    description: '十二经脉之一，属于胆，络肝，与足厥阴肝经相表里。',
    mainFunctions: ['主贮存和排泄胆汁', '主决断', '与肝相表里'],
    commonPathologies: ['口苦', '目眩', '疟疾', '头痛', '颌痛', '目外眦痛', '缺盆部肿痛', '腋下肿']
  },
  LR: {
    type: 'LR',
    name: '足厥阴肝经',
    pinyin: 'Zu Jueyin Gan Jing',
    color: MERIDIAN_COLORS.LR,
    category: 'yin',
    handOrFoot: 'foot',
    circulationPath: generateMeridianPath('LR'),
    acupointOrder: ['LR2', 'LR3', 'LR4', 'LR6', 'LR14'],
    description: '十二经脉之一，属于肝，络胆，与足少阳胆经相表里。',
    mainFunctions: ['主疏泄', '主藏血', '主调节情志'],
    commonPathologies: ['腰痛', '胸满', '呃逆', '遗尿', '小便不利', '疝气', '少腹肿']
  },
  CV: {
    type: 'CV',
    name: '任脉',
    pinyin: 'Ren Mai',
    color: MERIDIAN_COLORS.CV,
    category: 'yin',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('CV'),
    acupointOrder: ['CV2', 'CV3', 'CV4', 'CV6', 'CV8', 'CV12', 'CV14', 'CV17', 'CV22', 'CV23'],
    description: '奇经八脉之一，为"阴脉之海"，调节全身阴经气血。',
    mainFunctions: ['总任诸阴', '调节阴经气血', '主胞胎', '与生殖功能相关'],
    commonPathologies: ['疝气', '带下', '腹中结块', '不孕', '小便不利', '遗尿']
  },
  DU: {
    type: 'DU',
    name: '督脉',
    pinyin: 'Du Mai',
    color: MERIDIAN_COLORS.DU,
    category: 'yang',
    handOrFoot: 'hand',
    circulationPath: generateMeridianPath('DU'),
    acupointOrder: ['DU1', 'DU4', 'DU14', 'DU20', 'DU26'],
    description: '奇经八脉之一，为"阳脉之海"，调节全身阳经气血。',
    mainFunctions: ['总督诸阳', '调节阳经气血', '与脑髓肾相关', '主一身之阳'],
    commonPathologies: ['脊柱强痛', '角弓反张', '头痛', '项强', '眩晕', '癫狂痫']
  }
};

// ============================================
// 进针层次配置
// ============================================
const DEFAULT_LAYERS: InsertionLayer[] = ['skin', 'flesh', 'vessel', 'tendon', 'bone'];

// ============================================
// 生成经穴数据
// ============================================
function createAcupoint(
  id: string,
  name: string,
  pinyin: string,
  meridian: MeridianType,
  meridianOrder: number,
  referencePoint: string,
  locationDesc: string,
  standardDepth: number,
  maxDepth: number,
  primaryIndications: string[],
  traditionalIndications: string[],
  deqiSensations: string[],
  specialPoints?: Partial<{
    isFrontMu: boolean;
    isBackShu: boolean;
    isYuanSource: boolean;
    isLuoConnecting: boolean;
    isXiCleft: boolean;
    isHeSea: boolean;
    isJingRiver: boolean;
    isShuStream: boolean;
    isYingSpring: boolean;
    isJingWell: boolean;
    isEightConfluence: boolean;
    isInfluential: boolean;
  }>,
  alternativeNames?: string[]
): Acupoint {
  // 计算坐标（双侧穴位）
  const rightCoord = calculateAcupointPosition(referencePoint, 'lateral', 0, undefined, false);
  const leftCoord = calculateAcupointPosition(referencePoint, 'lateral', 0, undefined, true);
  
  // 对于任督二脉的穴位，使用中心坐标
  const isMidline = meridian === 'CV' || meridian === 'DU';
  
  return {
    id,
    name,
    pinyin,
    type: 'meridian',
    meridian,
    meridianOrder,
    code: id,
    alternativeNames,
    ...specialPoints,
    location: {
      description: locationDesc,
      method: 'bone_proportional'
    },
    coordinates: isMidline ? {
      center: rightCoord
    } : {
      right: rightCoord,
      left: leftCoord
    },
    needling: {
      standardDepth,
      maxDepth,
      layers: DEFAULT_LAYERS,
      angle: {
        vertical: standardDepth
      },
      directions: ['直刺'],
      precautions: '孕妇慎用'
    },
    indications: {
      primary: primaryIndications,
      secondary: [],
      traditional: traditionalIndications
    },
    deqiSensation: deqiSensations,
    anatomy: {
      skin: '皮肤及皮下组织',
      subcutaneous: '皮下筋膜及脂肪组织',
      muscle: '深层肌肉组织',
      vessels: '伴行血管',
      nerves: '局部神经支配'
    }
  };
}

// ============================================
// 主要穴位数据（代表性穴位，系统可扩展）
// ============================================
export const ACUPOINTS: Record<string, Acupoint> = {
  // ============================================
  // 手太阴肺经 (LU) - 11穴
  // ============================================
  LU1: createAcupoint(
    'LU1', '中府', 'Zhongfu', 'LU', 1,
    'axilla_left', '在胸前壁外上方，云门下1寸，平第一肋间隙，距前正中线6寸',
    8, 15,
    ['咳嗽', '气喘', '胸痛', '肩背痛'],
    ['肺系病证', '肩背痛'],
    ['酸胀感可放射至胸部', '麻胀感'],
    { isFrontMu: true }
  ),
  LU5: createAcupoint(
    'LU5', '尺泽', 'Chize', 'LU', 5,
    'elbow_crease_left', '在肘横纹中，肱二头肌腱桡侧凹陷处',
    8, 15,
    ['咳嗽', '气喘', '咯血', '潮热', '胸部胀满', '咽喉肿痛', '小儿惊风', '肘臂挛痛'],
    ['肺系实热证', '肘臂挛痛', '急性吐泻', '中暑', '小儿惊风'],
    ['局部酸胀', '麻电感向前臂放射'],
    { isHeSea: true }
  ),
  LU7: createAcupoint(
    'LU7', '列缺', 'Lieque', 'LU', 7,
    'wrist_crease_left', '在前臂桡侧缘，桡骨茎突上方，腕横纹上1.5寸，当肱桡肌与拇长展肌腱之间',
    3, 8,
    ['外感头痛', '项强', '咳嗽', '气喘', '咽喉肿痛', '口眼歪斜', '牙痛'],
    ['肺系病证', '头项部疾患', '外感病证'],
    ['酸胀感', '麻电感向手部放射'],
    { isLuoConnecting: true, isEightConfluence: true }
  ),
  LU9: createAcupoint(
    'LU9', '太渊', 'Taiyuan', 'LU', 9,
    'wrist_crease_left', '在腕掌侧横纹桡侧，桡动脉搏动处',
    3, 5,
    ['咳嗽', '气喘', '咯血', '胸痛', '咽喉肿痛', '腕臂痛', '无脉症'],
    ['肺系病证', '无脉症', '腕臂痛'],
    ['酸胀感', '注意避开动脉'],
    { isShuStream: true, isYuanSource: true, isInfluential: true }
  ),
  LU10: createAcupoint(
    'LU10', '鱼际', 'Yuji', 'LU', 10,
    'thenar_left', '在手拇指本节后凹陷处，约当第一掌骨中点桡侧，赤白肉际处',
    5, 10,
    ['咳嗽', '咯血', '咽喉肿痛', '失音', '发热', '掌中热', '小儿疳积'],
    ['肺系热性病证', '掌中热', '小儿疳积'],
    ['局部胀痛'],
    { isYingSpring: true }
  ),
  LU11: createAcupoint(
    'LU11', '少商', 'Shaoshang', 'LU', 11,
    'middle_finger_tip_left', '在拇指末节桡侧，距指甲角0.1寸',
    1, 2,
    ['咽喉肿痛', '中风昏迷', '中暑', '呕吐', '癫狂痫', '小儿惊风', '热病', '舌下肿痛'],
    ['肺系实热证', '高热', '昏迷', '癫狂'],
    ['刺痛感', '点刺出血'],
    { isJingWell: true }
  ),

  // ============================================
  // 手阳明大肠经 (LI) - 20穴
  // ============================================
  LI4: createAcupoint(
    'LI4', '合谷', 'Hegu', 'LI', 4,
    'wrist_crease_left', '在手背，第1、2掌骨间，当第2掌骨桡侧的中点处',
    8, 15,
    ['头痛', '目赤肿痛', '鼻衄', '齿痛', '牙关紧闭', '口眼歪斜', '耳聋', '痄腮', '咽喉肿痛', '热病', '无汗', '多汗', '经闭', '滞产', '腹痛', '便秘'],
    ['头面五官诸疾', '外感病证', '热病', '妇产科病证'],
    ['酸胀感可放射至肘肩', '麻电感'],
    { isYuanSource: true }
  ),
  LI10: createAcupoint(
    'LI10', '手三里', 'Shousanli', 'LI', 10,
    'elbow_crease_left', '在前臂背面桡侧，当阳溪与曲池连线上，肘横纹下2寸',
    10, 20,
    ['手臂无力', '上肢不遂', '腹痛', '腹泻', '齿痛', '颊肿', '瘰疬', '胃痛', '半身不遂'],
    ['上肢病证', '胃肠病证', '齿痛', '颊肿'],
    ['局部酸胀', '麻电感向手部放射'],
    {}
  ),
  LI11: createAcupoint(
    'LI11', '曲池', 'Quchi', 'LI', 11,
    'elbow_crease_left', '在肘横纹外侧端，屈肘，当尺泽与肱骨外上髁连线中点',
    10, 20,
    ['手臂痹痛', '上肢不遂', '热病', '高血压', '癫狂', '腹痛', '吐泻', '痢疾', '咽喉肿痛', '齿痛', '目赤肿痛', '瘾疹', '湿疹', '瘰疬', '丹毒'],
    ['上肢病证', '热病', '高血压', '癫狂', '胃肠病', '五官热性病', '皮肤科疾患'],
    ['酸胀感可放射至肩部', '麻电感向下放射'],
    { isHeSea: true }
  ),
  LI15: createAcupoint(
    'LI15', '肩髃', 'Jianyu', 'LI', 15,
    'acromion_left', '在肩部，三角肌上，臂外展，或向前平伸时，当肩峰前下方凹陷处',
    10, 20,
    ['肩臂挛痛', '上肢不遂', '隐疹', '瘰疬', '肩背痛', '手臂挛急'],
    ['肩臂挛痛', '上肢不遂', '瘾疹'],
    ['酸胀感扩散至肩关节', '麻电感向手臂放射'],
    {}
  ),
  LI20: createAcupoint(
    'LI20', '迎香', 'Yingxiang', 'LI', 20,
    'glabella', '在鼻翼外缘中点旁，当鼻唇沟中',
    3, 5,
    ['鼻塞', '鼽衄', '口歪', '面痒', '胆道蛔虫症'],
    ['鼻病', '面部病证', '胆道蛔虫症'],
    ['局部胀痛', '酸胀感扩散至鼻部'],
    {}
  ),

  // ============================================
  // 足阳明胃经 (ST) - 45穴
  // ============================================
  ST2: createAcupoint(
    'ST2', '四白', 'Sibai', 'ST', 2,
    'glabella', '在面部，瞳孔直下，当眶下孔凹陷处',
    3, 5,
    ['目赤痛痒', '目翳', '眼睑瞤动', '口眼歪斜', '面痛', '头痛眩晕', '胆道蛔虫症'],
    ['目疾', '头面五官病证', '胆道蛔虫症'],
    ['酸胀感', '注意勿刺入眶下孔太深'],
    {}
  ),
  ST6: createAcupoint(
    'ST6', '颊车', 'Jiache', 'ST', 6,
    'glabella', '在面颊部，下颌角前上方约一横指，当咀嚼时咬肌隆起，按之凹陷处',
    8, 15,
    ['齿痛', '牙关不利', '颊肿', '口眼歪斜', '痄腮', '颈项强痛'],
    ['齿痛', '牙关不利', '颊肿', '口眼歪斜'],
    ['局部酸胀', '可放射至耳部'],
    {}
  ),
  ST7: createAcupoint(
    'ST7', '下关', 'Xiaguan', 'ST', 7,
    'glabella', '在面部耳前方，当颧弓与下颌切迹所形成的凹陷中',
    8, 15,
    ['耳聋', '耳鸣', '聤耳', '齿痛', '口噤', '口眼歪斜', '面痛'],
    ['面口病证', '耳疾'],
    ['酸胀感可放射至下颌关节'],
    {}
  ),
  ST8: createAcupoint(
    'ST8', '头维', 'Touwei', 'ST', 8,
    'vertex', '在头侧部，当额角发际上0.5寸，头正中线旁4.5寸',
    5, 10,
    ['头痛', '目眩', '目痛', '迎风流泪', '视物不明'],
    ['头痛', '目眩', '目痛', '迎风流泪'],
    ['胀痛感扩散至头颞部'],
    {}
  ),
  ST34: createAcupoint(
    'ST34', '梁丘', 'Liangqiu', 'ST', 34,
    'medial_epicondyle_left', '屈膝，在大腿前面，当髂前上棘与髌底外侧端的连线上，髌底上2寸',
    10, 15,
    ['膝肿痛', '下肢不遂', '胃痛', '乳痈', '血尿', '腰膝冷痛'],
    ['膝肿痛', '下肢不遂', '胃病', '乳痈', '血尿'],
    ['酸胀感扩散至膝关节'],
    { isXiCleft: true }
  ),
  ST36: createAcupoint(
    'ST36', '足三里', 'Zusanli', 'ST', 36,
    'medial_malleolus_left', '在小腿前外侧，当犊鼻下3寸，距胫骨前缘一横指',
    15, 25,
    ['胃痛', '呕吐', '噎膈', '腹胀', '泄泻', '痢疾', '便秘', '乳痈', '肠痈', '下肢痿痹', '水肿', '癫狂', '脚气', '虚劳羸瘦'],
    ['胃肠病证', '下肢痿痹', '神志病', '外科疾患', '虚劳诸证'],
    ['酸胀感可放射至足背', '麻电感向下放射'],
    { isHeSea: true, isInfluential: true }
  ),
  ST37: createAcupoint(
    'ST37', '上巨虚', 'Shangjuxu', 'ST', 37,
    'medial_malleolus_left', '在小腿前外侧，当犊鼻下6寸，距胫骨前缘一横指',
    12, 20,
    ['肠鸣', '腹痛', '泄泻', '便秘', '肠痈', '中风瘫痪', '脚气', '下肢痿痹'],
    ['胃肠病证', '下肢痿痹'],
    ['酸胀感可放射至足背'],
    {}
  ),
  ST39: createAcupoint(
    'ST39', '下巨虚', 'Xiajuxu', 'ST', 39,
    'medial_malleolus_left', '在小腿前外侧，当犊鼻下9寸，距胫骨前缘一横指',
    10, 18,
    ['小腹痛', '泄泻', '痢疾', '乳痈', '下肢痿痹', '腰脊痛引睾丸'],
    ['胃肠病证', '下肢痿痹'],
    ['酸胀感可放射至足背'],
    {}
  ),
  ST40: createAcupoint(
    'ST40', '丰隆', 'Fenglong', 'ST', 40,
    'medial_malleolus_left', '在小腿前外侧，当外踝尖上8寸，条口外，距胫骨前缘二横指',
    10, 18,
    ['头痛', '眩晕', '癫狂', '痰多咳嗽', '呕吐', '便秘', '水肿', '下肢痿痹', '梅核气'],
    ['头痛', '眩晕', '癫狂', '痰饮病证', '下肢痿痹'],
    ['酸胀感可放射至足背'],
    { isLuoConnecting: true }
  ),
  ST41: createAcupoint(
    'ST41', '解溪', 'Jiexi', 'ST', 41,
    'metatarsal_1_left', '在足背与小腿交界处的横纹中央凹陷处，当拇长伸肌腱与趾长伸肌腱之间',
    5, 10,
    ['下肢痿痹', '踝关节病', '足下垂', '头痛', '眩晕', '癫狂', '腹胀', '便秘'],
    ['下肢踝关节病证', '头痛', '眩晕', '癫狂', '胃肠疾患'],
    ['酸胀感可放射至足趾'],
    { isJingRiver: true }
  ),
  ST44: createAcupoint(
    'ST44', '内庭', 'Neiting', 'ST', 44,
    'metatarsal_1_left', '在足背，当第2、3趾间，趾蹼缘后方赤白肉际处',
    3, 5,
    ['齿痛', '咽喉肿痛', '口歪', '鼻衄', '胃痛吐酸', '腹胀', '泄泻', '痢疾', '便秘', '足背肿痛', '热病'],
    ['五官热性病证', '肠胃病证', '足背肿痛', '热病'],
    ['胀痛感'],
    { isYingSpring: true }
  ),
  ST45: createAcupoint(
    'ST45', '厉兑', 'Lidui', 'ST', 45,
    'metatarsal_1_left', '在足第2趾末节外侧，距趾甲角0.1寸',
    1, 2,
    ['鼻衄', '齿痛', '咽喉肿痛', '热病', '多梦', '癫狂', '足背肿痛'],
    ['实热性五官病证', '热病', '神志病证'],
    ['刺痛感', '点刺出血'],
    { isJingWell: true }
  ),

  // ============================================
  // 足太阴脾经 (SP) - 21穴
  // ============================================
  SP4: createAcupoint(
    'SP4', '公孙', 'Gongsun', 'SP', 4,
    'metatarsal_1_left', '在足内侧缘，当第1跖骨基底部的前下方',
    8, 15,
    ['胃痛', '呕吐', '腹痛', '泄泻', '痢疾', '心烦失眠', '狂证', '逆气里急'],
    ['胃肠病证', '心烦失眠', '狂证', '冲脉病证'],
    ['酸胀感可放射至足趾'],
    { isLuoConnecting: true, isEightConfluence: true }
  ),
  SP6: createAcupoint(
    'SP6', '三阴交', 'Sanyinjiao', 'SP', 6,
    'medial_malleolus_left', '在小腿内侧，当足内踝尖上3寸，胫骨内侧缘后方',
    10, 20,
    ['肠鸣腹胀', '泄泻', '月经不调', '带下', '阴挺', '不孕', '滞产', '遗精', '阳痿', '遗尿', '疝气', '失眠', '下肢痿痹', '脚气'],
    ['脾胃虚弱诸证', '妇产科病证', '生殖泌尿系统病证', '心悸', '失眠', '高血压'],
    ['酸胀感可放射至小腿', '麻电感向下放射'],
    {}
  ),
  SP9: createAcupoint(
    'SP9', '阴陵泉', 'Yinlingquan', 'SP', 9,
    'medial_epicondyle_left', '在小腿内侧，当胫骨内侧髁后下方凹陷处',
    10, 20,
    ['腹胀', '水肿', '黄疸', '泄泻', '小便不利或失禁', '遗精', '膝痛', '下肢痿痹'],
    ['腹胀', '泄泻', '水肿', '黄疸', '小便不利', '膝痛'],
    ['酸胀感可放射至小腿'],
    { isHeSea: true }
  ),
  SP10: createAcupoint(
    'SP10', '血海', 'Xuehai', 'SP', 10,
    'medial_epicondyle_left', '屈膝，在大腿内侧，髌底内侧端上2寸，当股四头肌内侧头的隆起处',
    12, 20,
    ['月经不调', '崩漏', '经闭', '瘾疹', '湿疹', '丹毒', '股内侧痛', '膝痛'],
    ['妇科经血病证', '瘾疹', '湿疹', '丹毒'],
    ['酸胀感可放射至膝部'],
    {}
  ),
  SP15: createAcupoint(
    'SP15', '大横', 'Daheng', 'SP', 15,
    'umbilicus', '在腹中部，距脐中4寸',
    8, 15,
    ['泄泻', '便秘', '腹痛', '小腹痛', '痢疾'],
    ['胃肠病证', '腹痛'],
    ['酸胀感扩散至腹部'],
    {}
  ),

  // ============================================
  // 手少阴心经 (HT) - 9穴
  // ============================================
  HT3: createAcupoint(
    'HT3', '少海', 'Shaohai', 'HT', 3,
    'elbow_crease_left', '屈肘，在肘横纹内侧端与肱骨内上髁连线的中点处',
    8, 15,
    ['心痛', '癔病', '肘臂挛痛', '头项痛', '腋胁痛', '瘰疬'],
    ['心痛', '癔病', '肘臂挛痛', '头项痛'],
    ['酸胀感可放射至前臂'],
    { isHeSea: true }
  ),
  HT5: createAcupoint(
    'HT5', '通里', 'Tongli', 'HT', 5,
    'wrist_crease_left', '在前臂掌侧，当尺侧腕屈肌腱的桡侧缘，腕横纹上1寸',
    5, 10,
    ['心悸', '怔忡', '暴喑', '舌强不语', '腕臂痛', '失眠', '心痛'],
    ['心悸', '怔忡', '舌强不语', '腕臂痛'],
    ['酸胀感可放射至手部'],
    { isLuoConnecting: true }
  ),
  HT6: createAcupoint(
    'HT6', '阴郄', 'Yinxi', 'HT', 6,
    'wrist_crease_left', '在前臂掌侧，当尺侧腕屈肌腱的桡侧缘，腕横纹上0.5寸',
    5, 8,
    ['心痛', '惊悸', '骨蒸盗汗', '吐血', '衄血', '暴喑', '失眠'],
    ['心痛', '惊悸', '骨蒸盗汗', '吐血', '衄血'],
    ['酸胀感'],
    { isXiCleft: true }
  ),
  HT7: createAcupoint(
    'HT7', '神门', 'Shenmen', 'HT', 7,
    'wrist_crease_left', '在腕部，腕掌侧横纹尺侧端，尺侧腕屈肌腱的桡侧凹陷处',
    3, 5,
    ['心痛', '心烦', '惊悸', '怔忡', '不寐', '健忘', '痴呆', '癫狂痫', '胸胁痛', '高血压'],
    ['心与神志病证', '高血压', '胸胁痛'],
    ['酸胀感'],
    { isShuStream: true, isYuanSource: true }
  ),

  // ============================================
  // 手太阳小肠经 (SI) - 19穴
  // ============================================
  SI3: createAcupoint(
    'SI3', '后溪', 'Houxi', 'SI', 3,
    'wrist_crease_left', '在手掌尺侧，微握拳，当小指本节后的远侧掌横纹头赤白肉际',
    5, 10,
    ['头项强痛', '腰背痛', '手指及肘臂挛痛', '耳聋', '目赤', '癫狂痫', '疟疾'],
    ['头项强痛', '腰背痛', '耳聋', '目赤', '癫狂痫', '疟疾'],
    ['酸胀感可放射至肘部'],
    { isShuStream: true, isEightConfluence: true }
  ),
  SI4: createAcupoint(
    'SI4', '腕骨', 'Wangu', 'SI', 4,
    'wrist_crease_left', '在手掌尺侧，当第5掌骨基底与钩骨之间的凹陷处，赤白肉际',
    3, 5,
    ['头痛', '颈颔强痛', '耳鸣', '耳聋', '目翳', '指挛腕痛', '黄疸', '热病'],
    ['头项强痛', '耳鸣', '耳聋', '目翳', '指挛腕痛', '黄疸'],
    ['酸胀感'],
    { isYuanSource: true }
  ),
  SI5: createAcupoint(
    'SI5', '阳谷', 'Yanggu', 'SI', 5,
    'wrist_crease_left', '在手腕尺侧，当尺骨茎突与三角骨之间的凹陷处',
    3, 5,
    ['颈颔肿', '臂外侧痛', '腕痛', '热病', '癫狂痫', '头眩', '耳鸣', '耳聋'],
    ['颈颔肿', '臂外侧痛', '腕痛', '热病', '癫狂痫'],
    ['酸胀感'],
    { isJingRiver: true }
  ),
  SI6: createAcupoint(
    'SI6', '养老', 'Yanglao', 'SI', 6,
    'wrist_crease_left', '在前臂背面尺侧，当尺骨小头近端桡侧凹缘中',
    5, 8,
    ['目视不明', '肩、背、肘、臂酸痛', '腰痛', '急性腰扭伤'],
    ['目视不明', '肩、背、肘、臂酸痛', '腰痛'],
    ['酸胀感可放射至肩部'],
    { isXiCleft: true }
  ),
  SI11: createAcupoint(
    'SI11', '天宗', 'Tianzong', 'SI', 11,
    't3_spinous', '在肩胛部，当冈下窝中央凹陷处，与第4胸椎相平',
    8, 15,
    ['肩胛疼痛', '肘臂外后侧痛', '气喘', '乳痈', '咳嗽'],
    ['肩胛疼痛', '肘臂外后侧痛', '气喘', '乳痈'],
    ['酸胀感可放射至肩部及上臂'],
    {}
  ),

  // ============================================
  // 足太阳膀胱经 (BL) - 67穴（代表穴）
  // ============================================
  BL2: createAcupoint(
    'BL2', '攒竹', 'Cuanzhu', 'BL', 2,
    'glabella', '在面部，当眉头陷中，眶上切迹处',
    3, 5,
    ['头痛', '眉棱骨痛', '眼睑瞤动', '眼睑下垂', '口眼歪斜', '目视不明', '流泪', '目赤肿痛', '急性腰扭伤'],
    ['头痛', '眉棱骨痛', '眼睑瞤动', '目视不明', '流泪'],
    ['胀痛感'],
    {}
  ),
  BL10: createAcupoint(
    'BL10', '天柱', 'Tianzhu', 'BL', 10,
    'c7_spinous', '在项部，大筋外缘之后发际凹陷中，约当后发际正中旁开1.3寸',
    5, 10,
    ['头痛', '项强', '鼻塞', '癫狂痫', '肩背痛', '热病'],
    ['后头痛', '项强', '鼻塞', '癫狂痫', '肩背痛'],
    ['酸胀感可放射至头项部'],
    {}
  ),
  BL11: createAcupoint(
    'BL11', '大杼', 'Dazhu', 'BL', 11,
    't3_spinous', '在背部，当第1胸椎棘突下，旁开1.5寸',
    8, 15,
    ['咳嗽', '发热', '项强', '肩背痛', '颈椎病', '腰腿痛'],
    ['咳嗽', '发热', '项强', '肩背痛'],
    ['酸胀感'],
    { isInfluential: true }
  ),
  BL12: createAcupoint(
    'BL12', '风门', 'Fengmen', 'BL', 12,
    't3_spinous', '在背部，当第2胸椎棘突下，旁开1.5寸',
    8, 15,
    ['感冒', '咳嗽', '发热', '头痛', '项强', '胸背痛'],
    ['外感病证', '项强', '胸背痛'],
    ['酸胀感'],
    {}
  ),
  BL13: createAcupoint(
    'BL13', '肺俞', 'Feishu', 'BL', 13,
    't3_spinous', '在背部，当第3胸椎棘突下，旁开1.5寸',
    8, 15,
    ['咳嗽', '气喘', '吐血', '骨蒸', '潮热', '盗汗', '鼻塞', '皮肤瘙痒', '痤疮'],
    ['肺系病证', '阴虚病证', '皮肤病'],
    ['酸胀感'],
    { isBackShu: true }
  ),
  BL14: createAcupoint(
    'BL14', '厥阴俞', 'Jueyinshu', 'BL', 14,
    't3_spinous', '在背部，当第4胸椎棘突下，旁开1.5寸',
    8, 15,
    ['心痛', '心悸', '胸闷', '胸痛', '咳嗽', '呕吐', '牙痛'],
    ['心及神志病证', '咳嗽', '呕吐'],
    ['酸胀感'],
    { isBackShu: true }
  ),
  BL15: createAcupoint(
    'BL15', '心俞', 'Xinshu', 'BL', 15,
    't3_spinous', '在背部，当第5胸椎棘突下，旁开1.5寸',
    8, 15,
    ['心痛', '惊悸', '失眠', '健忘', '盗汗', '梦遗', '癫狂痫', '咳嗽', '吐血'],
    ['心及神志病证', '咳嗽', '吐血', '盗汗', '遗精'],
    ['酸胀感'],
    { isBackShu: true }
  ),
  BL18: createAcupoint(
    'BL18', '肝俞', 'Ganshu', 'BL', 18,
    't7_spinous', '在背部，当第9胸椎棘突下，旁开1.5寸',
    8, 15,
    ['黄疸', '胁痛', '吐血', '衄血', '目赤', '目视不明', '夜盲', '迎风流泪', '眩晕', '癫狂痫', '脊背痛', '月经不调'],
    ['肝胆病证', '目疾', '癫狂痫', '脊背痛'],
    ['酸胀感'],
    { isBackShu: true }
  ),
  BL20: createAcupoint(
    'BL20', '脾俞', 'Pishu', 'BL', 20,
    'l4_spinous', '在背部，当第11胸椎棘突下，旁开1.5寸',
    8, 15,
    ['腹胀', '黄疸', '呕吐', '泄泻', '痢疾', '便血', '水肿', '背痛', '小儿慢惊风', '食欲不振'],
    ['胃肠病证', '黄疸', '水肿', '背痛'],
    ['酸胀感'],
    { isBackShu: true }
  ),
  BL23: createAcupoint(
    'BL23', '肾俞', 'Shenshu', 'BL', 23,
    'l4_spinous', '在腰部，当第2腰椎棘突下，旁开1.5寸',
    8, 15,
    ['遗尿', '遗精', '阳痿', '月经不调', '白带', '水肿', '耳鸣', '耳聋', '腰痛', '哮喘', '贫血'],
    ['肾虚病证', '泌尿生殖系统病证', '妇科病证', '腰痛'],
    ['酸胀感可放射至腰部'],
    { isBackShu: true }
  ),
  BL25: createAcupoint(
    'BL25', '大肠俞', 'Dachangshu', 'BL', 25,
    'l4_spinous', '在腰部，当第4腰椎棘突下，旁开1.5寸',
    8, 15,
    ['腹胀', '泄泻', '便秘', '腰腿痛', '痢疾', '脱肛', '肠鸣'],
    ['胃肠病证', '腰腿痛'],
    ['酸胀感可放射至腰部'],
    { isBackShu: true }
  ),
  BL32: createAcupoint(
    'BL32', '次髎', 'Ciliao', 'BL', 32,
    'sacrum', '在骶部，当髂后上棘内下方，适对第2骶后孔处',
    8, 15,
    ['月经不调', '痛经', '带下', '小便不利', '遗精', '阳痿', '腰痛', '下肢痿痹'],
    ['妇科病证', '小便不利', '遗精', '阳痿', '腰痛'],
    ['酸胀感可放射至下肢'],
    {}
  ),
  BL40: createAcupoint(
    'BL40', '委中', 'Weizhong', 'BL', 40,
    'popliteal_crease_left', '在腘横纹中点，当股二头肌腱与半腱肌腱的中间',
    15, 25,
    ['腰痛', '下肢痿痹', '腹痛', '急性吐泻', '小便不利', '遗尿', '丹毒', '皮肤瘙痒', '疔疮'],
    ['腰背痛', '下肢痿痹', '腹痛', '急性吐泻', '小便不利', '丹毒'],
    ['酸胀感可放射至小腿'],
    { isHeSea: true }
  ),
  BL57: createAcupoint(
    'BL57', '承山', 'Chengshan', 'BL', 57,
    'medial_malleolus_left', '在小腿后面正中，委中与昆仑之间，当伸直小腿或足跟上提时腓肠肌肌腹下出现尖角凹陷处',
    10, 20,
    ['痔疮', '便秘', '腰背痛', '腿痛', '脚气', '疝气', '腓肠肌痉挛'],
    ['腰腿拘急疼痛', '痔疮', '便秘'],
    ['酸胀感可放射至足跟'],
    {}
  ),
  BL60: createAcupoint(
    'BL60', '昆仑', 'Kunlun', 'BL', 60,
    'lateral_malleolus_left', '在足部外踝后方，当外踝尖与跟腱之间的凹陷处',
    5, 10,
    ['后头痛', '项强', '目眩', '癫痫', '难产', '腰骶疼痛', '脚跟肿痛'],
    ['后头痛', '项强', '目眩', '癫痫', '难产', '腰骶疼痛'],
    ['酸胀感可放射至足跟'],
    { isJingRiver: true }
  ),
  BL62: createAcupoint(
    'BL62', '申脉', 'Shenmai', 'BL', 62,
    'lateral_malleolus_left', '在足外侧部，外踝直下方凹陷中',
    3, 5,
    ['头痛', '眩晕', '癫狂痫', '失眠', '腰腿酸痛', '目赤痛', '项强'],
    ['头痛', '眩晕', '癫狂痫', '失眠', '腰腿酸痛'],
    ['酸胀感'],
    { isEightConfluence: true }
  ),
  BL67: createAcupoint(
    'BL67', '至阴', 'Zhiyin', 'BL', 67,
    'metatarsal_5_left', '在足小趾末节外侧，距趾甲角0.1寸',
    1, 2,
    ['胎位不正', '滞产', '头痛', '目痛', '鼻塞', '鼻衄', '足趾麻木'],
    ['胎位不正', '滞产', '头痛', '目痛', '鼻塞'],
    ['刺痛感', '点刺出血'],
    { isJingWell: true }
  ),

  // ============================================
  // 足少阴肾经 (KI) - 27穴
  // ============================================
  KI1: createAcupoint(
    'KI1', '涌泉', 'Yongquan', 'KI', 1,
    'metatarsal_1_left', '在足底部，卷足时足前部凹陷处，约当第2、3趾趾缝纹头端与足跟连线的前1/3与后2/3交点上',
    8, 15,
    ['昏厥', '中暑', '癫痫', '小儿惊风', '癫狂痫', '头痛', '头晕', '目眩', '失音', '咽喉肿痛', '便秘', '小便不利', '足心热'],
    ['急证及神志病证', '头痛', '头晕', '目眩', '咽喉肿痛', '失音', '大小便不利', '足心热'],
    ['酸胀感'],
    { isJingWell: true }
  ),
  KI3: createAcupoint(
    'KI3', '太溪', 'Taixi', 'KI', 3,
    'medial_malleolus_left', '在足内侧，内踝后方，当内踝尖与跟腱之间的凹陷处',
    8, 15,
    ['头痛', '目眩', '失眠', '健忘', '遗精', '阳痿', '小便频数', '腰脊痛', '咳喘', '咯血', '消渴', '月经不调'],
    ['肾虚证', '阴虚性五官病证', '肺部疾患', '消渴', '小便频数', '便秘', '月经不调'],
    ['酸胀感可放射至足跟'],
    { isShuStream: true, isYuanSource: true }
  ),
  KI6: createAcupoint(
    'KI6', '照海', 'Zhaohai', 'KI', 6,
    'medial_malleolus_left', '在足内侧，内踝尖下方凹陷处',
    5, 10,
    ['失眠', '癫痫', '咽喉干痛', '目赤肿痛', '月经不调', '痛经', '赤白带下', '阴挺', '小便频数', '癃闭'],
    ['失眠', '癫痫', '咽喉干痛', '目赤肿痛', '妇科病证', '小便频数'],
    ['酸胀感'],
    { isEightConfluence: true }
  ),
  KI7: createAcupoint(
    'KI7', '复溜', 'Fuliu', 'KI', 7,
    'medial_malleolus_left', '在小腿内侧，太溪直上2寸，跟腱的前方',
    8, 15,
    ['水肿', '腹胀', '泄泻', '盗汗', '身热无汗', '腰脊强痛', '下肢痿痹', '脚气'],
    ['水肿', '腹胀', '泄泻', '盗汗', '身热无汗', '腰脊强痛'],
    ['酸胀感可放射至小腿'],
    { isJingRiver: true }
  ),
  KI9: createAcupoint(
    'KI9', '筑宾', 'Zhubin', 'KI', 9,
    'medial_epicondyle_left', '在小腿内侧，当太溪与阴谷的连线上，太溪上5寸，腓肠肌肌腹的内下方',
    10, 15,
    ['癫狂痫', '疝气', '呕吐涎沫', '小腿疼痛', '脚软无力'],
    ['癫狂痫', '疝气', '呕吐涎沫', '小腿疼痛'],
    ['酸胀感'],
    { isXiCleft: true }
  ),

  // ============================================
  // 手厥阴心包经 (PC) - 9穴
  // ============================================
  PC3: createAcupoint(
    'PC3', '曲泽', 'Quze', 'PC', 3,
    'elbow_crease_left', '在肘横纹中，当肱二头肌腱的尺侧缘',
    8, 15,
    ['心痛', '心悸', '善惊', '胃痛', '呕吐', '热病', '烦躁', '肘臂痛', '上肢颤动'],
    ['心痛', '心悸', '善惊', '胃痛', '呕吐', '热病', '肘臂痛'],
    ['酸胀感可放射至前臂'],
    { isHeSea: true }
  ),
  PC5: createAcupoint(
    'PC5', '间使', 'Jianshi', 'PC', 5,
    'wrist_crease_left', '在前臂掌侧，当曲泽与大陵的连线上，腕横纹上3寸，掌长肌腱与桡侧腕屈肌腱之间',
    8, 15,
    ['心痛', '心悸', '癫狂痫', '胃痛', '呕吐', '热病', '疟疾', '肘臂痛', '腋肿'],
    ['心痛', '心悸', '癫狂痫', '胃痛', '呕吐', '热病'],
    ['酸胀感可放射至手部'],
    { isJingRiver: true }
  ),
  PC6: createAcupoint(
    'PC6', '内关', 'Neiguan', 'PC', 6,
    'wrist_crease_left', '在前臂掌侧，当曲泽与大陵的连线上，腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间',
    8, 15,
    ['心痛', '心悸', '胸闷', '胸痛', '失眠', '癫狂痫', '胃痛', '呕吐', '呃逆', '眩晕', '中风', '产后血晕', '肘臂挛痛'],
    ['心痛', '心悸', '胸闷', '失眠', '癫狂痫', '胃痛', '呕吐', '呃逆', '肘臂挛痛'],
    ['酸胀感可放射至手部'],
    { isLuoConnecting: true, isEightConfluence: true }
  ),
  PC7: createAcupoint(
    'PC7', '大陵', 'Daling', 'PC', 7,
    'wrist_crease_left', '在腕掌横纹的中点处，当掌长肌腱与桡侧腕屈肌腱之间',
    3, 5,
    ['心痛', '心悸', '癫狂痫', '胃痛', '呕吐', '惊悸', '失眠', '胸胁痛', '腕关节疼痛'],
    ['心痛', '心悸', '癫狂痫', '胃痛', '呕吐'],
    ['酸胀感'],
    { isShuStream: true, isYuanSource: true }
  ),
  PC8: createAcupoint(
    'PC8', '劳宫', 'Laogong', 'PC', 8,
    'thenar_left', '在手掌心，当第2、3掌骨之间偏于第3掌骨，握拳屈指时中指尖处',
    5, 10,
    ['中风昏迷', '中暑', '心痛', '癫狂痫', '口疮', '口臭', '鹅掌风', '呕吐', '食欲不振'],
    ['中风昏迷', '中暑', '心痛', '癫狂痫', '口疮', '口臭'],
    ['酸胀感'],
    { isYingSpring: true }
  ),
};

// ============================================
// LocalForage 数据存储和初始化
// ============================================

// 初始化LocalForage
export function initLocalForage(): void {
  localforage.config({
    name: 'AcuAtlas',
    version: 1.0,
    storeName: 'acupoint_data',
    description: '经络穴位数据存储'
  });
}

// 加载所有穴位数据到LocalForage
export async function loadAcupointData(): Promise<void> {
  // 检查数据是否已存在
  const existingData = await localforage.getItem('acupoints_loaded');
  
  if (existingData) {
    console.log('穴位数据已存在，跳过加载');
    return;
  }
  
  // 存储所有穴位
  for (const [id, acupoint] of Object.entries(ACUPOINTS)) {
    await localforage.setItem(`acupoint_${id}`, acupoint);
  }
  
  // 存储所有经络
  for (const [type, meridian] of Object.entries(MERIDIANS)) {
    await localforage.setItem(`meridian_${type}`, meridian);
  }
  
  // 标记数据已加载
  await localforage.setItem('acupoints_loaded', true);
  await localforage.setItem('acupoint_count', Object.keys(ACUPOINTS).length);
  
  console.log(`已加载 ${Object.keys(ACUPOINTS).length} 个穴位数据到LocalForage`);
}

// 从LocalForage获取单个穴位
export async function getAcupoint(id: string): Promise<Acupoint | null> {
  return await localforage.getItem(`acupoint_${id}`);
}

// 从LocalForage获取所有穴位
export async function getAllAcupoints(): Promise<Acupoint[]> {
  const acupoints: Acupoint[] = [];
  const keys = await localforage.keys();
  
  for (const key of keys) {
    if (key.startsWith('acupoint_')) {
      const acupoint = await localforage.getItem<Acupoint>(key);
      if (acupoint) {
        acupoints.push(acupoint);
      }
    }
  }
  
  return acupoints;
}

// 从LocalForage获取特定经络的穴位
export async function getAcupointsByMeridian(meridianType: MeridianType): Promise<Acupoint[]> {
  const allAcupoints = await getAllAcupoints();
  return allAcupoints.filter(ap => {
    if ((ap as any).type === 'meridian') {
      return (ap as any).meridian === meridianType;
    }
    return false;
  }).sort((a, b) => {
    if ((a as any).type === 'meridian' && (b as any).type === 'meridian') {
      return (a as any).meridianOrder - (b as any).meridianOrder;
    }
    return 0;
  });
}

// 从LocalForage获取经络信息
export async function getMeridian(type: MeridianType): Promise<Meridian | null> {
  return await localforage.getItem(`meridian_${type}`);
}

// 从LocalForage获取所有经络
export async function getAllMeridians(): Promise<Meridian[]> {
  const meridians: Meridian[] = [];
  
  for (const type of Object.keys(MERIDIANS) as MeridianType[]) {
    const meridian = await getMeridian(type);
    if (meridian) {
      meridians.push(meridian);
    }
  }
  
  return meridians;
}

// 搜索穴位
export async function searchAcupoints(query: string): Promise<Acupoint[]> {
  const allAcupoints = await getAllAcupoints();
  const lowerQuery = query.toLowerCase();
  
  return allAcupoints.filter(ap => 
    (ap as any).id.toLowerCase().includes(lowerQuery) ||
    (ap as any).name.includes(query) ||
    (ap as any).pinyin.toLowerCase().includes(lowerQuery) ||
    ((ap as any).alternativeNames && (ap as any).alternativeNames.some((n: string) => n.includes(query)))
  );
}

// 清除所有数据（调试用）
export async function clearAllData(): Promise<void> {
  await localforage.clear();
  console.log('已清除所有LocalForage数据');
}
