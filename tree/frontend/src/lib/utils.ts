import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TimberGrade = '一等材' | '二等材' | '三等材' | '四等材' | '五等材' | '六等材' | '七等材' | '八等材'

export interface CaiFenSpec {
  grade: TimberGrade
  caiHeight: number
  caiWidth: number
  fen: number
  description: string
  typicalBuilding: string
}

export const CAI_FEN_TABLE: Record<TimberGrade, CaiFenSpec> = {
  '一等材': {
    grade: '一等材',
    caiHeight: 9,
    caiWidth: 6,
    fen: 0.6,
    description: '材高9寸，厚6寸',
    typicalBuilding: '殿身9间至11间'
  },
  '二等材': {
    grade: '二等材',
    caiHeight: 8.25,
    caiWidth: 5.5,
    fen: 0.55,
    description: '材高8.25寸，厚5.5寸',
    typicalBuilding: '殿身5间至7间'
  },
  '三等材': {
    grade: '三等材',
    caiHeight: 7.5,
    caiWidth: 5,
    fen: 0.5,
    description: '材高7.5寸，厚5寸',
    typicalBuilding: '殿身3间至5间，厅堂7间'
  },
  '四等材': {
    grade: '四等材',
    caiHeight: 7.2,
    caiWidth: 4.8,
    fen: 0.48,
    description: '材高7.2寸，厚4.8寸',
    typicalBuilding: '殿身3间，厅堂5间'
  },
  '五等材': {
    grade: '五等材',
    caiHeight: 6.6,
    caiWidth: 4.4,
    fen: 0.44,
    description: '材高6.6寸，厚4.4寸',
    typicalBuilding: '殿身小3间，厅堂3间'
  },
  '六等材': {
    grade: '六等材',
    caiHeight: 6,
    caiWidth: 4,
    fen: 0.4,
    description: '材高6寸，厚4寸',
    typicalBuilding: '亭榭及小厅堂'
  },
  '七等材': {
    grade: '七等材',
    caiHeight: 5.25,
    caiWidth: 3.5,
    fen: 0.35,
    description: '材高5.25寸，厚3.5寸',
    typicalBuilding: '小亭榭及碑亭'
  },
  '八等材': {
    grade: '八等材',
    caiHeight: 4.5,
    caiWidth: 3,
    fen: 0.3,
    description: '材高4.5寸，厚3寸',
    typicalBuilding: '藻井及小构件'
  }
}

export function calculateCaiFenSize(grade: TimberGrade, fenCount: number): number {
  const spec = CAI_FEN_TABLE[grade]
  return spec.fen * fenCount
}

export function getCaiHeight(grade: TimberGrade): number {
  return CAI_FEN_TABLE[grade].caiHeight
}

export function getCaiWidth(grade: TimberGrade): number {
  return CAI_FEN_TABLE[grade].caiWidth
}

export function getZhiHeight(grade: TimberGrade): number {
  return getCaiHeight(grade) / 3 * 2
}

export function getZuocaiHeight(grade: TimberGrade): number {
  return getCaiHeight(grade) + getZhiHeight(grade)
}

export interface ComponentType {
  id: string
  name: string
  chineseName: string
  description: string
  category: 'column' | 'beam' | 'bracket' | 'other'
}

export const COMPONENT_TYPES: ComponentType[] = [
  {
    id: 'zhu',
    name: 'Column',
    chineseName: '柱',
    description: '垂直承重构件，支撑梁架',
    category: 'column'
  },
  {
    id: 'liang',
    name: 'Beam',
    chineseName: '梁',
    description: '水平承重构件，承受屋面荷载',
    category: 'beam'
  },
  {
    id: 'lin',
    name: 'Purlin',
    chineseName: '檩',
    description: '沿开间方向的水平构件',
    category: 'beam'
  },
  {
    id: 'fang',
    name: 'Fang',
    chineseName: '枋',
    description: '连接构件，增强结构整体性',
    category: 'beam'
  },
  {
    id: 'dou',
    name: 'Dou',
    chineseName: '斗',
    description: '斗拱的基座构件',
    category: 'bracket'
  },
  {
    id: 'gong',
    name: 'Gong',
    chineseName: '拱',
    description: '斗拱的水平悬挑构件',
    category: 'bracket'
  },
  {
    id: 'ang',
    name: 'Ang',
    chineseName: '昂',
    description: '斗拱的斜向悬挑构件',
    category: 'bracket'
  }
]

export interface MortiseType {
  id: string
  name: string
  chineseName: string
  description: string
}

export const MORTISE_TYPES: MortiseType[] = [
  {
    id: 'ban-sun',
    name: 'Half Tenon',
    chineseName: '半榫',
    description: '榫头长度不及卯眼深度'
  },
  {
    id: 'tou-sun',
    name: 'Through Tenon',
    chineseName: '透榫',
    description: '榫头贯穿卯眼'
  },
  {
    id: 'da-yao',
    name: 'Dovetail',
    chineseName: '大腰',
    description: '燕尾榫，用于拉结'
  },
  {
    id: 'zhuan-jiao',
    name: 'Miter Joint',
    chineseName: '转角',
    description: '45度角接榫'
  }
]
