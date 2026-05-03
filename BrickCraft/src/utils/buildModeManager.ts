import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import {
  BuildModeType,
  PlacementStatus,
  SnapType,
  SnapInfo,
  PlacementPreview,
  SelectionMode,
  SelectionInfo,
  DragOperation,
  BuildHistoryEntry,
  BuildModeConfig,
  DEFAULT_BUILD_MODE_CONFIG,
  PRECISION_MODE_CONFIG,
  FREE_MODE_CONFIG,
} from '../types/buildMode';
import { LDrawModelInstance } from '../types/ldraw';
import { getPhysicsEngine } from './physicsEngine';

/**
 * 零件实例扩展
 */
interface PartInstance extends LDrawModelInstance {
  threeObject?: THREE.Object3D;
  bounds?: THREE.Box3;
}

/**
 * 搭建模式事件
 */
interface BuildModeEvents {
  onModeChange?: (mode: BuildModeType) => void;
  onPlacementPreview?: (preview: PlacementPreview | null) => void;
  onPartPlaced?: (part: PartInstance) => void;
  onPartRemoved?: (partId: string) => void;
  onSelectionChange?: (selection: SelectionInfo) => void;
  onDragStart?: (operation: DragOperation) => void;
  onDragUpdate?: (operation: DragOperation) => void;
  onDragEnd?: (operation: DragOperation) => void;
  onCollision?: (partId: string, otherPartId: string) => void;
  onHistoryChange?: (history: BuildHistoryEntry[]) => void;
}

/**
 * 搭建模式管理器
 * 管理精确放置和自由拖动功能
 */
export class BuildModeManager {
  private config: BuildModeConfig;
  private parts: Map<string, PartInstance> = new Map();
  private selection: SelectionInfo;
  private dragOperation: DragOperation;
  private placementPreview: PlacementPreview | null = null;
  private history: BuildHistoryEntry[] = [];
  private historyIndex: number = -1;
  private events: BuildModeEvents = {};
  private physicsEngine = getPhysicsEngine();
  private isPhysicsInitialized = false;

  constructor(initialConfig?: Partial<BuildModeConfig>) {
    this.config = { ...DEFAULT_BUILD_MODE_CONFIG, ...initialConfig };
    this.selection = {
      selectedPartIds: [],
      selectionMode: 'single',
    };
    this.dragOperation = {
      isDragging: false,
      draggedPartIds: [],
      dragStartPosition: [0, 0, 0],
      dragStartRotation: [0, 0, 0],
      currentOffset: [0, 0, 0],
    };
  }

  /**
   * 初始化物理引擎
   */
  async initializePhysics(): Promise<void> {
    if (this.isPhysicsInitialized) return;
    await this.physicsEngine.initialize();
    this.isPhysicsInitialized = true;
  }

  /**
   * 设置事件监听
   */
  setEvents(events: BuildModeEvents): void {
    this.events = events;
  }

  /**
   * 获取当前配置
   */
  getConfig(): BuildModeConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<BuildModeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 切换搭建模式
   */
  setMode(mode: BuildModeType): void {
    if (this.config.mode === mode) return;

    this.config = mode === 'precision' 
      ? { ...PRECISION_MODE_CONFIG } 
      : { ...FREE_MODE_CONFIG };

    this.events.onModeChange?.(mode);
  }

  /**
   * 获取当前模式
   */
  getMode(): BuildModeType {
    return this.config.mode;
  }

  /**
   * 添加零件
   */
  addPart(part: PartInstance, recordHistory: boolean = true): void {
    this.parts.set(part.id, part);

    if (recordHistory) {
      this.addHistoryEntry({
        id: uuidv4(),
        type: 'add',
        timestamp: Date.now(),
        description: `添加零件 ${part.partId}`,
        affectedPartIds: [part.id],
        afterState: { ...part },
      });
    }

    this.events.onPartPlaced?.(part);
  }

  /**
   * 移除零件
   */
  removePart(partId: string, recordHistory: boolean = true): void {
    const part = this.parts.get(partId);
    if (!part) return;

    this.parts.delete(partId);

    // 从选择中移除
    this.selection.selectedPartIds = this.selection.selectedPartIds.filter(
      (id) => id !== partId
    );

    if (recordHistory) {
      this.addHistoryEntry({
        id: uuidv4(),
        type: 'remove',
        timestamp: Date.now(),
        description: `移除零件 ${part.partId}`,
        affectedPartIds: [partId],
        beforeState: { ...part },
      });
    }

    this.events.onPartRemoved?.(partId);
    this.events.onSelectionChange?.({ ...this.selection });
  }

  /**
   * 获取零件
   */
  getPart(partId: string): PartInstance | undefined {
    return this.parts.get(partId);
  }

  /**
   * 获取所有零件
   */
  getAllParts(): PartInstance[] {
    return Array.from(this.parts.values());
  }

  /**
   * 更新零件位置
   */
  updatePartPosition(
    partId: string,
    position: [number, number, number],
    recordHistory: boolean = true
  ): void {
    const part = this.parts.get(partId);
    if (!part) return;

    const oldPosition = [...part.position] as [number, number, number];
    part.position = position;

    if (recordHistory) {
      this.addHistoryEntry({
        id: uuidv4(),
        type: 'move',
        timestamp: Date.now(),
        description: `移动零件 ${part.partId}`,
        affectedPartIds: [partId],
        beforeState: { position: oldPosition },
        afterState: { position },
      });
    }
  }

  /**
   * 更新零件旋转
   */
  updatePartRotation(
    partId: string,
    rotation: [number, number, number],
    recordHistory: boolean = true
  ): void {
    const part = this.parts.get(partId);
    if (!part) return;

    const oldRotation = [...part.rotation] as [number, number, number];
    part.rotation = rotation;

    if (recordHistory) {
      this.addHistoryEntry({
        id: uuidv4(),
        type: 'rotate',
        timestamp: Date.now(),
        description: `旋转零件 ${part.partId}`,
        affectedPartIds: [partId],
        beforeState: { rotation: oldRotation },
        afterState: { rotation },
      });
    }
  }

  /**
   * 选择零件
   */
  selectPart(partId: string, addToSelection: boolean = false): void {
    if (addToSelection) {
      if (!this.selection.selectedPartIds.includes(partId)) {
        this.selection.selectedPartIds.push(partId);
        this.selection.selectionMode = 'multiple';
      }
    } else {
      this.selection.selectedPartIds = [partId];
      this.selection.selectionMode = 'single';
    }
    this.selection.lastSelectedPartId = partId;

    this.events.onSelectionChange?.({ ...this.selection });
  }

  /**
   * 取消选择零件
   */
  deselectPart(partId: string): void {
    this.selection.selectedPartIds = this.selection.selectedPartIds.filter(
      (id) => id !== partId
    );
    if (this.selection.lastSelectedPartId === partId) {
      this.selection.lastSelectedPartId = this.selection.selectedPartIds[
        this.selection.selectedPartIds.length - 1
      ];
    }
    if (this.selection.selectedPartIds.length <= 1) {
      this.selection.selectionMode = this.selection.selectedPartIds.length === 1 ? 'single' : 'none';
    }

    this.events.onSelectionChange?.({ ...this.selection });
  }

  /**
   * 取消所有选择
   */
  clearSelection(): void {
    this.selection.selectedPartIds = [];
    this.selection.lastSelectedPartId = undefined;
    this.selection.selectionMode = 'none';

    this.events.onSelectionChange?.({ ...this.selection });
  }

  /**
   * 获取当前选择
   */
  getSelection(): SelectionInfo {
    return { ...this.selection };
  }

  /**
   * 开始拖动
   */
  startDrag(
    partIds: string[],
    startPosition: [number, number, number],
    startRotation: [number, number, number]
  ): void {
    this.dragOperation = {
      isDragging: true,
      draggedPartIds: [...partIds],
      dragStartPosition: [...startPosition] as [number, number, number],
      dragStartRotation: [...startRotation] as [number, number, number],
      currentOffset: [0, 0, 0],
    };

    this.events.onDragStart?.({ ...this.dragOperation });
  }

  /**
   * 更新拖动
   */
  updateDrag(offset: [number, number, number]): void {
    if (!this.dragOperation.isDragging) return;

    this.dragOperation.currentOffset = [...offset] as [number, number, number];

    // 计算新位置
    const newPosition: [number, number, number] = [
      this.dragOperation.dragStartPosition[0] + offset[0],
      this.dragOperation.dragStartPosition[1] + offset[1],
      this.dragOperation.dragStartPosition[2] + offset[2],
    ];

    // 应用吸附（如果启用）
    let finalPosition = newPosition;
    let snapInfo: SnapInfo | undefined;

    if (this.config.snap.enabled) {
      const snapResult = this.findSnapPoint(newPosition);
      if (snapResult) {
        finalPosition = snapResult.targetPosition;
        snapInfo = snapResult;
      }
    }

    // 应用网格吸附（如果启用）
    if (this.config.grid.enabled) {
      finalPosition = this.snapToGrid(finalPosition);
    }

    // 检查碰撞
    const isColliding = this.checkCollision(
      this.dragOperation.draggedPartIds,
      finalPosition
    );

    // 更新拖动的零件位置（临时，不记录历史）
    for (const partId of this.dragOperation.draggedPartIds) {
      this.updatePartPosition(partId, finalPosition, false);
    }

    this.events.onDragUpdate?.({ ...this.dragOperation });
  }

  /**
   * 结束拖动
   */
  endDrag(): void {
    if (!this.dragOperation.isDragging) return;

    // 记录历史（如果位置有变化）
    if (
      this.dragOperation.currentOffset[0] !== 0 ||
      this.dragOperation.currentOffset[1] !== 0 ||
      this.dragOperation.currentOffset[2] !== 0
    ) {
      this.addHistoryEntry({
        id: uuidv4(),
        type: 'move',
        timestamp: Date.now(),
        description: `拖动 ${this.dragOperation.draggedPartIds.length} 个零件`,
        affectedPartIds: [...this.dragOperation.draggedPartIds],
      });
    }

    this.events.onDragEnd?.({ ...this.dragOperation });

    // 重置拖动状态
    this.dragOperation = {
      isDragging: false,
      draggedPartIds: [],
      dragStartPosition: [0, 0, 0],
      dragStartRotation: [0, 0, 0],
      currentOffset: [0, 0, 0],
    };
  }

  /**
   * 取消拖动
   */
  cancelDrag(): void {
    if (!this.dragOperation.isDragging) return;

    // 恢复原始位置
    for (const partId of this.dragOperation.draggedPartIds) {
      this.updatePartPosition(partId, this.dragOperation.dragStartPosition, false);
    }

    this.dragOperation.isDragging = false;
    this.dragOperation.currentOffset = [0, 0, 0];
  }

  /**
   * 设置放置预览
   */
  setPlacementPreview(preview: PlacementPreview | null): void {
    this.placementPreview = preview;
    this.events.onPlacementPreview?.(preview);
  }

  /**
   * 获取放置预览
   */
  getPlacementPreview(): PlacementPreview | null {
    return this.placementPreview;
  }

  /**
   * 计算放置预览
   */
  calculatePlacementPreview(
    partId: string,
    color: number,
    position: [number, number, number],
    rotation: [number, number, number]
  ): PlacementPreview {
    let finalPosition = [...position] as [number, number, number];
    let finalRotation = [...rotation] as [number, number, number];
    let snapInfo: SnapInfo | undefined;
    let status: PlacementStatus = 'placing';

    // 应用吸附
    if (this.config.snap.enabled) {
      const snapResult = this.findSnapPoint(finalPosition);
      if (snapResult) {
        finalPosition = snapResult.targetPosition;
        finalRotation = snapResult.targetRotation;
        snapInfo = snapResult;
        status = 'snapped';
      }
    }

    // 应用网格吸附
    if (this.config.grid.enabled) {
      finalPosition = this.snapToGrid(finalPosition);
      if (this.config.grid.snapRotation) {
        finalRotation = this.snapRotationToGrid(finalRotation);
      }
    }

    // 检查碰撞
    const isColliding = this.checkCollisionWithPosition(partId, finalPosition);
    
    // 检查稳定性
    const isStable = this.checkStability(partId, finalPosition);

    // 确定状态
    if (isColliding) {
      status = 'conflicting';
    } else if (isStable && (snapInfo || this.config.grid.enabled)) {
      status = 'valid';
    } else if (snapInfo) {
      status = 'snapped';
    }

    return {
      partId,
      color,
      position: finalPosition,
      rotation: finalRotation,
      status,
      snapInfo,
      isColliding,
      isStable,
    };
  }

  /**
   * 查找吸附点
   */
  private findSnapPoint(position: [number, number, number]): SnapInfo | null {
    const snapDistance = this.config.snap.snapDistance;
    let bestSnap: SnapInfo | null = null;
    let bestDistance = snapDistance;

    // 检查网格吸附
    if (this.config.snap.snapToGrid) {
      const gridPosition = this.snapToGrid(position);
      const distance = this.calculateDistance(position, gridPosition);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSnap = {
          type: 'grid',
          targetPosition: gridPosition,
          targetRotation: [0, 0, 0],
          snapOffset: [
            gridPosition[0] - position[0],
            gridPosition[1] - position[1],
            gridPosition[2] - position[2],
          ],
          distance,
        };
      }
    }

    // 检查零件吸附
    if (this.config.snap.snapToParts) {
      for (const [partId, part] of this.parts.entries()) {
        const partSnap = this.findPartSnapPoint(position, part);
        if (partSnap && partSnap.distance < bestDistance) {
          bestDistance = partSnap.distance;
          bestSnap = partSnap;
        }
      }
    }

    return bestSnap;
  }

  /**
   * 查找零件吸附点
   */
  private findPartSnapPoint(
    position: [number, number, number],
    part: PartInstance
  ): SnapInfo | null {
    const snapDistance = this.config.snap.snapDistance;
    let bestSnap: SnapInfo | null = null;
    let bestDistance = snapDistance;

    // 简单的位置吸附（基于零件边界盒）
    if (part.bounds) {
      const center = new THREE.Vector3();
      part.bounds.getCenter(center);

      // 检查顶面中心（凸点位置）
      if (this.config.snap.snapToStuds) {
        const topCenter: [number, number, number] = [
          center.x,
          part.bounds.max.y,
          center.z,
        ];
        const distance = this.calculateDistance(position, topCenter);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSnap = {
            type: 'stud',
            targetPartId: part.id,
            targetPosition: topCenter,
            targetRotation: part.rotation,
            snapOffset: [
              topCenter[0] - position[0],
              topCenter[1] - position[1],
              topCenter[2] - position[2],
            ],
            distance,
          };
        }
      }

      // 检查面吸附
      if (this.config.snap.snapToFaces) {
        // 简化：检查是否靠近零件的任何面
        const faces = [
          { normal: [0, 1, 0] as [number, number, number], point: [center.x, part.bounds.max.y, center.z] as [number, number, number] },
          { normal: [0, -1, 0] as [number, number, number], point: [center.x, part.bounds.min.y, center.z] as [number, number, number] },
          { normal: [1, 0, 0] as [number, number, number], point: [part.bounds.max.x, center.y, center.z] as [number, number, number] },
          { normal: [-1, 0, 0] as [number, number, number], point: [part.bounds.min.x, center.y, center.z] as [number, number, number] },
          { normal: [0, 0, 1] as [number, number, number], point: [center.x, center.y, part.bounds.max.z] as [number, number, number] },
          { normal: [0, 0, -1] as [number, number, number], point: [center.x, center.y, part.bounds.min.z] as [number, number, number] },
        ];

        for (const face of faces) {
          const distance = this.calculateDistance(position, face.point);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSnap = {
              type: 'face',
              targetPartId: part.id,
              targetPosition: face.point,
              targetRotation: part.rotation,
              snapOffset: [
                face.point[0] - position[0],
                face.point[1] - position[1],
                face.point[2] - position[2],
              ],
              distance,
            };
          }
        }
      }
    }

    return bestSnap;
  }

  /**
   * 吸附到网格
   */
  private snapToGrid(position: [number, number, number]): [number, number, number] {
    const gridSize = this.config.grid.size;
    return [
      Math.round(position[0] / gridSize[0]) * gridSize[0],
      Math.round(position[1] / gridSize[1]) * gridSize[1],
      Math.round(position[2] / gridSize[2]) * gridSize[2],
    ];
  }

  /**
   * 旋转吸附到网格
   */
  private snapRotationToGrid(rotation: [number, number, number]): [number, number, number] {
    const step = this.config.grid.rotationStep;
    return [
      Math.round(rotation[0] / step) * step,
      Math.round(rotation[1] / step) * step,
      Math.round(rotation[2] / step) * step,
    ];
  }

  /**
   * 检查碰撞
   */
  private checkCollision(
    movingPartIds: string[],
    newPosition: [number, number, number]
  ): boolean {
    if (!this.config.collision.enabled) return false;

    // 简化碰撞检测：检查边界盒重叠
    for (const movingPartId of movingPartIds) {
      const movingPart = this.parts.get(movingPartId);
      if (!movingPart || !movingPart.bounds) continue;

      // 创建移动后的边界盒
      const movedBounds = movingPart.bounds.clone();
      const offset = new THREE.Vector3(
        newPosition[0] - movingPart.position[0],
        newPosition[1] - movingPart.position[1],
        newPosition[2] - movingPart.position[2]
      );
      movedBounds.translate(offset);

      // 检查与其他零件的碰撞
      for (const [partId, part] of this.parts.entries()) {
        if (movingPartIds.includes(partId)) continue;
        if (!part.bounds) continue;

        // 应用碰撞边距
        const expandedBounds = part.bounds.clone();
        expandedBounds.expandByScalar(this.config.collision.collisionMargin);

        if (movedBounds.intersectsBox(expandedBounds)) {
          this.events.onCollision?.(movingPartId, partId);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 检查特定位置的碰撞
   */
  private checkCollisionWithPosition(
    excludePartId: string,
    position: [number, number, number]
  ): boolean {
    if (!this.config.collision.enabled) return false;

    // 简化：假设零件是 2x4 的砖块
    const partBounds = new THREE.Box3(
      new THREE.Vector3(position[0] - 1, position[1], position[2] - 2),
      new THREE.Vector3(position[0] + 1, position[1] + 1, position[2] + 2)
    );

    for (const [partId, part] of this.parts.entries()) {
      if (partId === excludePartId) continue;
      if (!part.bounds) continue;

      const expandedBounds = part.bounds.clone();
      expandedBounds.expandByScalar(this.config.collision.collisionMargin);

      if (partBounds.intersectsBox(expandedBounds)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查稳定性
   */
  private checkStability(
    partId: string,
    position: [number, number, number]
  ): boolean {
    // 如果在地面上，认为稳定
    if (position[1] <= 0) return true;

    // 检查是否有支撑
    for (const [otherPartId, otherPart] of this.parts.entries()) {
      if (otherPartId === partId) continue;

      // 检查是否在正下方
      const yDistance = position[1] - otherPart.position[1];
      if (yDistance > 0 && yDistance < 1.2) { // 约一个砖块高度
        // 检查 XZ 重叠
        const xOverlap = Math.abs(position[0] - otherPart.position[0]) < 2;
        const zOverlap = Math.abs(position[2] - otherPart.position[2]) < 4;

        if (xOverlap && zOverlap) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 计算距离
   */
  private calculateDistance(
    p1: [number, number, number],
    p2: [number, number, number]
  ): number {
    return Math.sqrt(
      Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2)
    );
  }

  /**
   * 添加历史记录
   */
  private addHistoryEntry(entry: BuildHistoryEntry): void {
    // 清除重做栈
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(entry);
    this.historyIndex = this.history.length - 1;

    // 限制历史记录数量
    if (this.history.length > 100) {
      this.history.shift();
      this.historyIndex--;
    }

    this.events.onHistoryChange?.([...this.history]);
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (this.historyIndex <= 0) return false;

    this.historyIndex--;
    const entry = this.history[this.historyIndex];

    // 执行撤销操作
    switch (entry.type) {
      case 'add':
        // 撤销添加 = 移除
        for (const partId of entry.affectedPartIds) {
          this.removePart(partId, false);
        }
        break;

      case 'remove':
        // 撤销移除 = 添加回来
        if (entry.beforeState) {
          this.addPart(entry.beforeState as PartInstance, false);
        }
        break;

      case 'move':
        // 撤销移动 = 恢复位置
        if (entry.beforeState?.position) {
          for (const partId of entry.affectedPartIds) {
            this.updatePartPosition(partId, entry.beforeState.position, false);
          }
        }
        break;

      case 'rotate':
        // 撤销旋转 = 恢复旋转
        if (entry.beforeState?.rotation) {
          for (const partId of entry.affectedPartIds) {
            this.updatePartRotation(partId, entry.beforeState.rotation, false);
          }
        }
        break;
    }

    this.events.onHistoryChange?.([...this.history]);
    return true;
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    const entry = this.history[this.historyIndex];

    // 执行重做操作
    switch (entry.type) {
      case 'add':
        // 重做添加 = 再次添加
        if (entry.afterState) {
          this.addPart(entry.afterState as PartInstance, false);
        }
        break;

      case 'remove':
        // 重做移除 = 再次移除
        for (const partId of entry.affectedPartIds) {
          this.removePart(partId, false);
        }
        break;

      case 'move':
        // 重做移动 = 应用新位置
        if (entry.afterState?.position) {
          for (const partId of entry.affectedPartIds) {
            this.updatePartPosition(partId, entry.afterState.position, false);
          }
        }
        break;

      case 'rotate':
        // 重做旋转 = 应用新旋转
        if (entry.afterState?.rotation) {
          for (const partId of entry.affectedPartIds) {
            this.updatePartRotation(partId, entry.afterState.rotation, false);
          }
        }
        break;
    }

    this.events.onHistoryChange?.([...this.history]);
    return true;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 获取历史记录
   */
  getHistory(): BuildHistoryEntry[] {
    return [...this.history];
  }

  /**
   * 获取当前历史索引
   */
  getHistoryIndex(): number {
    return this.historyIndex;
  }

  /**
   * 清空所有零件
   */
  clearAllParts(): void {
    this.parts.clear();
    this.clearSelection();
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * 销毁
   */
  dispose(): void {
    this.parts.clear();
    this.history = [];
    this.events = {};
  }
}

// 单例实例
let buildModeManagerInstance: BuildModeManager | null = null;

/**
 * 获取搭建模式管理器单例
 */
export function getBuildModeManager(): BuildModeManager {
  if (!buildModeManagerInstance) {
    buildModeManagerInstance = new BuildModeManager();
  }
  return buildModeManagerInstance;
}

export default BuildModeManager;
