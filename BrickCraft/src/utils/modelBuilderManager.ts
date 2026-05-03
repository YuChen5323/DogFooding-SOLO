import { v4 as uuidv4 } from 'uuid';
import type {
  WorkerMessage,
  WorkerResponse,
  PartInstance,
  ModelData,
  AssemblyStep,
  WorkerMessageType,
  WorkerResponseType
} from '../workers/modelBuilder.worker';

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * 任务信息
 */
export interface TaskInfo {
  id: string;
  type: WorkerMessageType;
  status: TaskStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

/**
 * 构建模型结果
 */
export interface BuildModelResult {
  modelId: string;
  totalParts: number;
  isStable: boolean;
  unstableParts: string[];
  warnings: string[];
}

/**
 * 稳定性计算结果
 */
export interface StabilityResult {
  isStable: boolean;
  unstableParts: string[];
  warnings: string[];
}

/**
 * 步骤生成结果
 */
export interface StepsResult {
  totalSteps: number;
  steps: AssemblyStep[];
  modelId: string;
}

/**
 * LDraw 解析结果
 */
export interface LDrawParseResult {
  fileName: string;
  metadata: {
    name: string;
    description: string;
    author: string;
    category: string;
  };
  geometryCount: number;
  geometries: any[];
}

/**
 * 任务回调
 */
export interface TaskCallbacks<T = any> {
  onProgress?: (progress: number, payload?: any) => void;
  onComplete?: (result: T) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

/**
 * 模型构建管理器
 * 管理与 Web Worker 的通信
 */
export class ModelBuilderManager {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private isInitialized = false;
  private tasks: Map<string, TaskInfo> = new Map();
  private taskCallbacks: Map<string, TaskCallbacks> = new Map();
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化 Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // 动态导入 Worker
      const { default: ModelBuilderWorker } = await import(
        /* @vite-ignore */
        '../workers/modelBuilder.worker?worker'
      );
      
      this.worker = new ModelBuilderWorker();
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);

      // 发送初始化消息
      this.worker.postMessage({ type: 'INIT' as WorkerMessageType });

      // 等待初始化完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker 初始化超时'));
        }, 5000);

        const checkInit = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'INIT_COMPLETE') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', checkInit);
            this.isInitialized = true;
            resolve();
          }
        };

        this.worker?.addEventListener('message', checkInit);
      });

      console.log('ModelBuilder Worker 初始化完成');
    } catch (error) {
      console.error('Worker 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 处理 Worker 消息
   */
  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, taskId, payload, progress } = event.data;

    if (!taskId) return;

    const taskInfo = this.tasks.get(taskId);
    const callbacks = this.taskCallbacks.get(taskId);

    if (!taskInfo) return;

    switch (type) {
      case 'BUILD_PROGRESS':
        taskInfo.progress = progress || 0;
        callbacks?.onProgress?.(progress || 0, payload);
        break;

      case 'BUILD_COMPLETE':
        taskInfo.status = 'completed';
        taskInfo.progress = 1;
        taskInfo.completedAt = Date.now();
        callbacks?.onComplete?.(payload as BuildModelResult);
        this.cleanupTask(taskId);
        break;

      case 'STABILITY_RESULT':
        taskInfo.status = 'completed';
        taskInfo.progress = 1;
        taskInfo.completedAt = Date.now();
        callbacks?.onComplete?.(payload as StabilityResult);
        this.cleanupTask(taskId);
        break;

      case 'STEPS_GENERATED':
        taskInfo.status = 'completed';
        taskInfo.progress = 1;
        taskInfo.completedAt = Date.now();
        callbacks?.onComplete?.(payload as StepsResult);
        this.cleanupTask(taskId);
        break;

      case 'LDRAW_PARSED':
        taskInfo.status = 'completed';
        taskInfo.progress = 1;
        taskInfo.completedAt = Date.now();
        callbacks?.onComplete?.(payload as LDrawParseResult);
        this.cleanupTask(taskId);
        break;

      case 'CANCELLED':
        taskInfo.status = 'cancelled';
        callbacks?.onCancel?.();
        this.cleanupTask(taskId);
        break;

      case 'ERROR':
        taskInfo.status = 'failed';
        taskInfo.error = payload?.message || '未知错误';
        callbacks?.onError?.(payload?.message || '未知错误');
        this.cleanupTask(taskId);
        break;
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleError(event: ErrorEvent): void {
    console.error('Worker 错误:', event);
    
    // 尝试找出相关任务并标记为失败
    for (const [taskId, taskInfo] of this.tasks.entries()) {
      if (taskInfo.status === 'running') {
        const callbacks = this.taskCallbacks.get(taskId);
        taskInfo.status = 'failed';
        taskInfo.error = event.message;
        callbacks?.onError?.(event.message);
        this.cleanupTask(taskId);
        break;
      }
    }
  }

  /**
   * 清理任务
   */
  private cleanupTask(taskId: string): void {
    this.taskCallbacks.delete(taskId);
  }

  /**
   * 发送消息到 Worker
   */
  private sendMessage(message: WorkerMessage): void {
    if (!this.worker) {
      throw new Error('Worker 未初始化');
    }
    this.worker.postMessage(message);
  }

  /**
   * 创建任务
   */
  private createTask(type: WorkerMessageType, callbacks?: TaskCallbacks): string {
    const taskId = uuidv4();
    const taskInfo: TaskInfo = {
      id: taskId,
      type,
      status: 'pending',
      progress: 0,
      createdAt: Date.now()
    };

    this.tasks.set(taskId, taskInfo);
    if (callbacks) {
      this.taskCallbacks.set(taskId, callbacks);
    }

    return taskId;
  }

  /**
   * 解析 LDraw 文件
   */
  async parseLDraw(
    content: string,
    fileName: string,
    callbacks?: TaskCallbacks<LDrawParseResult>
  ): Promise<LDrawParseResult> {
    await this.initialize();

    const taskId = this.createTask('PARSE_LDRAW', callbacks);
    const taskInfo = this.tasks.get(taskId)!;
    taskInfo.status = 'running';
    taskInfo.startedAt = Date.now();

    this.sendMessage({
      type: 'PARSE_LDRAW',
      taskId,
      payload: { content, fileName }
    });

    return new Promise((resolve, reject) => {
      // 更新回调以包含 Promise 处理
      const existingCallbacks = this.taskCallbacks.get(taskId) || {};
      this.taskCallbacks.set(taskId, {
        ...existingCallbacks,
        onComplete: (result) => {
          existingCallbacks.onComplete?.(result);
          resolve(result as LDrawParseResult);
        },
        onError: (error) => {
          existingCallbacks.onError?.(error);
          reject(new Error(error));
        },
        onCancel: () => {
          existingCallbacks.onCancel?.();
          reject(new Error('任务已取消'));
        }
      });
    });
  }

  /**
   * 构建模型
   */
  async buildModel(
    model: ModelData,
    validate: boolean = true,
    callbacks?: TaskCallbacks<BuildModelResult>
  ): Promise<BuildModelResult> {
    await this.initialize();

    const taskId = this.createTask('BUILD_MODEL', callbacks);
    const taskInfo = this.tasks.get(taskId)!;
    taskInfo.status = 'running';
    taskInfo.startedAt = Date.now();

    this.sendMessage({
      type: 'BUILD_MODEL',
      taskId,
      payload: { model, validate }
    });

    return new Promise((resolve, reject) => {
      const existingCallbacks = this.taskCallbacks.get(taskId) || {};
      this.taskCallbacks.set(taskId, {
        ...existingCallbacks,
        onComplete: (result) => {
          existingCallbacks.onComplete?.(result);
          resolve(result as BuildModelResult);
        },
        onError: (error) => {
          existingCallbacks.onError?.(error);
          reject(new Error(error));
        },
        onCancel: () => {
          existingCallbacks.onCancel?.();
          reject(new Error('任务已取消'));
        }
      });
    });
  }

  /**
   * 计算模型稳定性
   */
  async calculateStability(
    model: ModelData,
    callbacks?: TaskCallbacks<StabilityResult>
  ): Promise<StabilityResult> {
    await this.initialize();

    const taskId = this.createTask('CALCULATE_STABILITY', callbacks);
    const taskInfo = this.tasks.get(taskId)!;
    taskInfo.status = 'running';
    taskInfo.startedAt = Date.now();

    this.sendMessage({
      type: 'CALCULATE_STABILITY',
      taskId,
      payload: { model }
    });

    return new Promise((resolve, reject) => {
      const existingCallbacks = this.taskCallbacks.get(taskId) || {};
      this.taskCallbacks.set(taskId, {
        ...existingCallbacks,
        onComplete: (result) => {
          existingCallbacks.onComplete?.(result);
          resolve(result as StabilityResult);
        },
        onError: (error) => {
          existingCallbacks.onError?.(error);
          reject(new Error(error));
        },
        onCancel: () => {
          existingCallbacks.onCancel?.();
          reject(new Error('任务已取消'));
        }
      });
    });
  }

  /**
   * 生成拼装步骤
   */
  async generateSteps(
    model: ModelData,
    maxPartsPerStep: number = 5,
    callbacks?: TaskCallbacks<StepsResult>
  ): Promise<StepsResult> {
    await this.initialize();

    const taskId = this.createTask('GENERATE_STEPS', callbacks);
    const taskInfo = this.tasks.get(taskId)!;
    taskInfo.status = 'running';
    taskInfo.startedAt = Date.now();

    this.sendMessage({
      type: 'GENERATE_STEPS',
      taskId,
      payload: { model, maxPartsPerStep }
    });

    return new Promise((resolve, reject) => {
      const existingCallbacks = this.taskCallbacks.get(taskId) || {};
      this.taskCallbacks.set(taskId, {
        ...existingCallbacks,
        onComplete: (result) => {
          existingCallbacks.onComplete?.(result);
          resolve(result as StepsResult);
        },
        onError: (error) => {
          existingCallbacks.onError?.(error);
          reject(new Error(error));
        },
        onCancel: () => {
          existingCallbacks.onCancel?.();
          reject(new Error('任务已取消'));
        }
      });
    });
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    const taskInfo = this.tasks.get(taskId);
    if (taskInfo && taskInfo.status === 'running') {
      this.sendMessage({
        type: 'CANCEL',
        taskId
      });
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskInfo | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): TaskInfo[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 清理已完成的任务
   */
  cleanupCompletedTasks(): void {
    for (const [taskId, taskInfo] of this.tasks.entries()) {
      if (taskInfo.status === 'completed' || taskInfo.status === 'failed' || taskInfo.status === 'cancelled') {
        this.tasks.delete(taskId);
      }
    }
  }

  /**
   * 销毁
   */
  dispose(): void {
    if (this.worker) {
      this.sendMessage({ type: 'DISPOSE' });
      this.worker.terminate();
      this.worker = null;
    }
    this.tasks.clear();
    this.taskCallbacks.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// 单例实例
let modelBuilderManagerInstance: ModelBuilderManager | null = null;

/**
 * 获取模型构建管理器单例
 */
export function getModelBuilderManager(): ModelBuilderManager {
  if (!modelBuilderManagerInstance) {
    modelBuilderManagerInstance = new ModelBuilderManager();
  }
  return modelBuilderManagerInstance;
}

export default ModelBuilderManager;
