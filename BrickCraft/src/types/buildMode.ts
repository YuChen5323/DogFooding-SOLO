/**
 * 搭建模式类型
 */
export type BuildModeType = 'precision' | 'free';

/**
 * 放置状态
 */
export type PlacementStatus = 'idle' | 'placing' | 'snapped' | 'conflicting' | 'valid';

/**
 * 吸附类型
 */
export type SnapType = 
  | 'grid'           // 吸附到网格
  | 'stud'           // 吸附到凸点
  | 'tube'           // 吸附到管孔
  | 'edge'           // 吸附到边缘
  | 'face'           // 吸附到面
  | 'none';          // 不吸附

/**
 * 吸附信息
 */
export interface SnapInfo {
  type: SnapType;
  targetPartId?: string;      // 目标零件ID
  targetPosition: [number, number, number];  // 吸附位置
  targetRotation: [number, number, number];  // 吸附旋转 (度)
  snapOffset: [number, number, number];       // 吸附偏移
  distance: number;           // 到吸附点的距离
}

/**
 * 放置预览
 */
export interface PlacementPreview {
  partId: string;            // 零件ID
  color: number;             // 颜色代码
  position: [number, number, number];  // 当前位置
  rotation: [number, number, number];  // 当前旋转 (度)
  status: PlacementStatus;   // 放置状态
  snapInfo?: SnapInfo;       // 吸附信息
  isColliding: boolean;      // 是否碰撞
  isStable: boolean;         // 是否稳定
}

/**
 * 选择模式
 */
export type SelectionMode = 'single' | 'multiple' | 'none';

/**
 * 选择信息
 */
export interface SelectionInfo {
  selectedPartIds: string[];     // 选中的零件ID列表
  lastSelectedPartId?: string;   // 最后选中的零件ID
  selectionMode: SelectionMode;   // 选择模式
}

/**
 * 拖动操作信息
 */
export interface DragOperation {
  isDragging: boolean;
  draggedPartIds: string[];      // 被拖动的零件ID
  dragStartPosition: [number, number, number];  // 拖动开始位置
  dragStartRotation: [number, number, number];  // 拖动开始旋转
  currentOffset: [number, number, number];       // 当前偏移
}

/**
 * 搭建历史记录
 */
export interface BuildHistoryEntry {
  id: string;
  type: 'add' | 'remove' | 'move' | 'rotate' | 'modify';
  timestamp: number;
  description: string;
  affectedPartIds: string[];
  // 撤销/重做所需的数据
  beforeState?: any;
  afterState?: any;
}

/**
 * 网格配置
 */
export interface GridConfig {
  enabled: boolean;
  size: [number, number, number];  // 网格大小 (X, Y, Z)
  snapDistance: number;             // 吸附距离
  snapRotation: boolean;            // 是否吸附旋转
  rotationStep: number;             // 旋转步长 (度)
}

/**
 * 吸附配置
 */
export interface SnapConfig {
  enabled: boolean;
  snapDistance: number;        // 吸附距离
  snapToGrid: boolean;         // 是否吸附到网格
  snapToParts: boolean;        // 是否吸附到其他零件
  snapToStuds: boolean;        // 是否吸附到凸点
  snapToTubes: boolean;        // 是否吸附到管孔
  snapToEdges: boolean;        // 是否吸附到边缘
  snapToFaces: boolean;        // 是否吸附到面
}

/**
 * 碰撞检测配置
 */
export interface CollisionConfig {
  enabled: boolean;
  preventOverlap: boolean;     // 防止重叠
  highlightConflicts: boolean;  // 高亮冲突
  collisionMargin: number;      // 碰撞边距
}

/**
 * 搭建模式配置
 */
export interface BuildModeConfig {
  mode: BuildModeType;          // 当前模式
  grid: GridConfig;             // 网格配置
  snap: SnapConfig;             // 吸附配置
  collision: CollisionConfig;   // 碰撞配置
  showPreview: boolean;         // 显示预览
  showGhost: boolean;           // 显示虚影
  ghostOpacity: number;         // 虚影透明度
}

/**
 * 默认搭建模式配置
 */
export const DEFAULT_BUILD_MODE_CONFIG: BuildModeConfig = {
  mode: 'precision',
  grid: {
    enabled: true,
    size: [1, 1, 1],
    snapDistance: 0.25,
    snapRotation: true,
    rotationStep: 90,
  },
  snap: {
    enabled: true,
    snapDistance: 0.3,
    snapToGrid: true,
    snapToParts: true,
    snapToStuds: true,
    snapToTubes: true,
    snapToEdges: false,
    snapToFaces: true,
  },
  collision: {
    enabled: true,
    preventOverlap: true,
    highlightConflicts: true,
    collisionMargin: 0.01,
  },
  showPreview: true,
  showGhost: true,
  ghostOpacity: 0.5,
};

/**
 * 精确模式配置
 */
export const PRECISION_MODE_CONFIG: BuildModeConfig = {
  ...DEFAULT_BUILD_MODE_CONFIG,
  mode: 'precision',
  grid: {
    ...DEFAULT_BUILD_MODE_CONFIG.grid,
    enabled: true,
    snapDistance: 0.25,
  },
  snap: {
    ...DEFAULT_BUILD_MODE_CONFIG.snap,
    enabled: true,
    snapDistance: 0.3,
  },
  collision: {
    ...DEFAULT_BUILD_MODE_CONFIG.collision,
    enabled: true,
    preventOverlap: true,
  },
};

/**
 * 自由模式配置
 */
export const FREE_MODE_CONFIG: BuildModeConfig = {
  ...DEFAULT_BUILD_MODE_CONFIG,
  mode: 'free',
  grid: {
    ...DEFAULT_BUILD_MODE_CONFIG.grid,
    enabled: false,
    snapDistance: 0.5,
  },
  snap: {
    ...DEFAULT_BUILD_MODE_CONFIG.snap,
    enabled: false,
    snapDistance: 0.5,
  },
  collision: {
    ...DEFAULT_BUILD_MODE_CONFIG.collision,
    enabled: true,
    preventOverlap: false,
  },
};
