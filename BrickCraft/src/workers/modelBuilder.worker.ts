/**
 * 模型构建 Web Worker
 * 在后台线程中处理模型构建相关的耗时任务
 */

// 定义 Worker 消息类型
type WorkerMessageType = 
  | 'INIT'
  | 'BUILD_MODEL'
  | 'CALCULATE_STABILITY'
  | 'GENERATE_STEPS'
  | 'PARSE_LDRAW'
  | 'CANCEL'
  | 'DISPOSE';

type WorkerResponseType =
  | 'INIT_COMPLETE'
  | 'BUILD_PROGRESS'
  | 'BUILD_COMPLETE'
  | 'STABILITY_RESULT'
  | 'STEPS_GENERATED'
  | 'LDRAW_PARSED'
  | 'CANCELLED'
  | 'ERROR';

// 消息接口
interface WorkerMessage {
  type: WorkerMessageType;
  payload?: any;
  taskId?: string;
}

interface WorkerResponse {
  type: WorkerResponseType;
  payload?: any;
  taskId?: string;
  progress?: number;
}

// 零件接口
interface PartInstance {
  id: string;
  partId: string;
  color: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

// 模型接口
interface ModelData {
  id: string;
  name: string;
  parts: PartInstance[];
}

// 拓扑排序节点
interface TopologyNode {
  partId: string;
  instanceId: string;
  dependencies: string[]; // 依赖的零件ID
}

// 拼装步骤
interface AssemblyStep {
  stepNumber: number;
  parts: string[]; // 零件实例ID列表
  description?: string;
}

// 简单的物理模拟状态
interface SimplePhysicsState {
  position: [number, number, number];
  velocity: [number, number, number];
  isStable: boolean;
  supportingParts: string[];
}

// 任务状态
interface TaskState {
  id: string;
  type: WorkerMessageType;
  isCancelled: boolean;
}

// 当前运行的任务
let currentTask: TaskState | null = null;

// 存储已解析的零件数据
const parsedPartsCache: Map<string, any> = new Map();

/**
 * 发送响应消息
 */
function sendResponse(response: WorkerResponse): void {
  self.postMessage(response);
}

/**
 * 处理初始化消息
 */
function handleInit(): void {
  sendResponse({
    type: 'INIT_COMPLETE',
    payload: {
      status: 'ready',
      timestamp: Date.now()
    }
  });
}

/**
 * 解析 LDraw 内容
 */
function handleParseLDraw(payload: { content: string; fileName: string }, taskId: string): void {
  try {
    const { content, fileName } = payload;
    
    // 简单的 LDraw 解析 (在 Worker 中)
    const geometries = parseLDrawContent(content);
    
    // 提取零件元数据
    const metadata = extractMetadata(content, fileName);
    
    sendResponse({
      type: 'LDRAW_PARSED',
      taskId,
      payload: {
        fileName,
        metadata,
        geometryCount: geometries.length,
        geometries: geometries.slice(0, 1000) // 限制返回数量防止消息过大
      }
    });
  } catch (error) {
    sendResponse({
      type: 'ERROR',
      taskId,
      payload: {
        message: (error as Error).message,
        stack: (error as Error).stack
      }
    });
  }
}

/**
 * 解析 LDraw 内容
 */
function parseLDrawContent(content: string): any[] {
  const lines = content.split('\n');
  const geometries: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const firstChar = trimmed.charAt(0);
    
    // 跳过注释
    if (firstChar === '0') continue;

    // 解析几何体命令
    const parts = trimmed.split(/\s+/);
    const type = parseInt(parts[0]);

    switch (type) {
      case 1: // 子文件引用
        if (parts.length >= 15) {
          geometries.push({
            type: 'subfile',
            color: parseInt(parts[1]),
            position: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
            matrix: [
              parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]),
              parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]),
              parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13])
            ],
            fileName: parts.slice(14).join(' ')
          });
        }
        break;

      case 2: // 线条
        if (parts.length >= 9) {
          geometries.push({
            type: 'line',
            color: parseInt(parts[1]),
            p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
            p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])]
          });
        }
        break;

      case 3: // 三角形
        if (parts.length >= 12) {
          geometries.push({
            type: 'triangle',
            color: parseInt(parts[1]),
            p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
            p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
            p3: [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])]
          });
        }
        break;

      case 4: // 四边形
        if (parts.length >= 15) {
          geometries.push({
            type: 'quad',
            color: parseInt(parts[1]),
            p1: [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])],
            p2: [parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7])],
            p3: [parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10])],
            p4: [parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13])]
          });
        }
        break;
    }
  }

  return geometries;
}

/**
 * 提取元数据
 */
function extractMetadata(content: string, fileName: string): {
  name: string;
  description: string;
  author: string;
  category: string;
} {
  const lines = content.split('\n');
  let name = fileName.replace(/\.[^.]+$/, '');
  let description = '';
  let author = '';
  let category = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('0')) continue;

    const comment = trimmed.substring(1).trim();

    if (comment.startsWith('Name:')) {
      name = comment.substring(5).trim();
    } else if (comment.startsWith('Author:')) {
      author = comment.substring(7).trim();
    } else if (comment.startsWith('!LDRAW_ORG')) {
      const parts = comment.split(/\s+/);
      if (parts.length >= 2) {
        category = parts[1];
      }
    } else if (!comment.startsWith('!') && comment.length > 0 && !description) {
      description = comment;
    }
  }

  return { name, description, author, category };
}

/**
 * 处理模型构建
 */
function handleBuildModel(payload: { model: ModelData; validate: boolean }, taskId: string): void {
  const { model, validate } = payload;
  const totalParts = model.parts.length;

  // 模拟构建进度
  for (let i = 0; i < totalParts; i++) {
    // 检查是否取消
    if (currentTask?.isCancelled) {
      sendResponse({ type: 'CANCELLED', taskId });
      return;
    }

    // 发送进度更新
    sendResponse({
      type: 'BUILD_PROGRESS',
      taskId,
      progress: (i + 1) / totalParts,
      payload: {
        currentPart: i,
        totalParts,
        partId: model.parts[i].partId
      }
    });

    // 模拟处理时间
    const wait = (ms: number) => {
      const start = Date.now();
      while (Date.now() - start < ms) {}
    };
    if (totalParts > 50 && i % 10 === 0) {
      wait(1); // 少量延迟以便可以接收取消消息
    }
  }

  // 如果需要验证，计算稳定性
  let stabilityResult = null;
  if (validate) {
    stabilityResult = calculateModelStability(model);
  }

  sendResponse({
    type: 'BUILD_COMPLETE',
    taskId,
    payload: {
      modelId: model.id,
      totalParts,
      isStable: stabilityResult?.isStable ?? true,
      unstableParts: stabilityResult?.unstableParts ?? [],
      warnings: stabilityResult?.warnings ?? []
    }
  });
}

/**
 * 计算模型稳定性 (简化版)
 */
function calculateModelStability(model: ModelData): {
  isStable: boolean;
  unstableParts: string[];
  warnings: string[];
} {
  const unstableParts: string[] = [];
  const warnings: string[] = [];

  // 简化的稳定性检查
  // 检查每个零件是否有支撑

  // 按照 Y 坐标排序 (从下到上)
  const sortedParts = [...model.parts].sort((a, b) => a.position[1] - b.position[1]);

  const placedParts: PartInstance[] = [];

  for (const part of sortedParts) {
    // 检查是否有支撑
    const hasSupport = checkSupport(part, placedParts);
    
    if (!hasSupport && part.position[1] > 0) {
      unstableParts.push(part.id);
    }

    placedParts.push(part);
  }

  // 检查过度悬挂
  for (const part of model.parts) {
    const overhang = calculateOverhang(part, model.parts);
    if (overhang > 0.7) {
      warnings.push(`零件 ${part.id} 存在严重悬挂 (${Math.round(overhang * 100)}%)`);
    }
  }

  return {
    isStable: unstableParts.length === 0,
    unstableParts,
    warnings
  };
}

/**
 * 检查零件是否有支撑
 */
function checkSupport(part: PartInstance, placedParts: PartInstance[]): boolean {
  // 如果在地面上，认为有支撑
  if (part.position[1] <= 0) return true;

  // 检查是否有零件在正下方
  for (const placed of placedParts) {
    // 检查是否在同一 XZ 区域
    const xDiff = Math.abs(part.position[0] - placed.position[0]);
    const zDiff = Math.abs(part.position[2] - placed.position[2]);

    // 简单的碰撞盒检查 (假设零件是 2x4 的砖块)
    const xOverlap = xDiff < 2; // 2 个乐高单位
    const zOverlap = zDiff < 4; // 4 个乐高单位

    // 检查是否在下方
    const yDistance = part.position[1] - placed.position[1];
    const isBelow = yDistance > 0 && yDistance < 1.2; // 约一个砖块高度

    if (xOverlap && zOverlap && isBelow) {
      return true;
    }
  }

  return false;
}

/**
 * 计算悬挂比例
 */
function calculateOverhang(part: PartInstance, allParts: PartInstance[]): number {
  // 简化计算：检查零件投影区域有多少被下方零件覆盖
  let totalArea = 8; // 2x4 砖块面积
  let supportedArea = 0;

  const otherParts = allParts.filter(p => p.id !== part.id);

  for (const other of otherParts) {
    if (other.position[1] >= part.position[1]) continue;

    // 计算 XZ 平面上的重叠
    const xOverlap = Math.max(0, 
      Math.min(part.position[0] + 1, other.position[0] + 1) - 
      Math.max(part.position[0] - 1, other.position[0] - 1)
    );
    
    const zOverlap = Math.max(0,
      Math.min(part.position[2] + 2, other.position[2] + 2) -
      Math.max(part.position[2] - 2, other.position[2] - 2)
    );

    supportedArea += xOverlap * zOverlap;
  }

  return Math.max(0, 1 - supportedArea / totalArea);
}

/**
 * 处理稳定性计算
 */
function handleCalculateStability(payload: { model: ModelData }, taskId: string): void {
  try {
    const result = calculateModelStability(payload.model);
    
    sendResponse({
      type: 'STABILITY_RESULT',
      taskId,
      payload: result
    });
  } catch (error) {
    sendResponse({
      type: 'ERROR',
      taskId,
      payload: {
        message: (error as Error).message,
        stack: (error as Error).stack
      }
    });
  }
}

/**
 * 生成拼装步骤 (拓扑排序)
 */
function handleGenerateSteps(payload: { model: ModelData; maxPartsPerStep: number }, taskId: string): void {
  try {
    const { model, maxPartsPerStep = 5 } = payload;
    
    // 1. 构建依赖图
    const nodes = buildDependencyGraph(model);
    
    // 2. 拓扑排序
    const sortedNodes = topologicalSort(nodes);
    
    // 3. 分组为步骤
    const steps = groupIntoSteps(sortedNodes, maxPartsPerStep);
    
    sendResponse({
      type: 'STEPS_GENERATED',
      taskId,
      payload: {
        totalSteps: steps.length,
        steps,
        modelId: model.id
      }
    });
  } catch (error) {
    sendResponse({
      type: 'ERROR',
      taskId,
      payload: {
        message: (error as Error).message,
        stack: (error as Error).stack
      }
    });
  }
}

/**
 * 构建依赖图
 */
function buildDependencyGraph(model: ModelData): TopologyNode[] {
  const nodes: TopologyNode[] = [];

  // 为每个零件创建节点
  for (const part of model.parts) {
    const dependencies: string[] = [];

    // 找出依赖的零件 (支撑当前零件的零件)
    for (const other of model.parts) {
      if (other.id === part.id) continue;

      // 检查是否在下方支撑
      const yDistance = part.position[1] - other.position[1];
      if (yDistance > 0 && yDistance < 1.2) {
        // 检查 XZ 重叠
        const xOverlap = Math.abs(part.position[0] - other.position[0]) < 2;
        const zOverlap = Math.abs(part.position[2] - other.position[2]) < 4;

        if (xOverlap && zOverlap) {
          dependencies.push(other.id);
        }
      }
    }

    nodes.push({
      partId: part.partId,
      instanceId: part.id,
      dependencies
    });
  }

  return nodes;
}

/**
 * 拓扑排序
 */
function topologicalSort(nodes: TopologyNode[]): TopologyNode[] {
  const result: TopologyNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  // 按照 Y 坐标排序作为辅助
  const sortedByY = [...nodes].sort((a, b) => {
    const aPart = nodes.find(n => n.instanceId === a.instanceId);
    const bPart = nodes.find(n => n.instanceId === b.instanceId);
    return 0; // 简化，不依赖外部数据
  });

  function visit(node: TopologyNode): void {
    if (visited.has(node.instanceId)) return;
    if (visiting.has(node.instanceId)) {
      // 检测到循环依赖，跳过
      return;
    }

    visiting.add(node.instanceId);

    // 访问依赖
    for (const depId of node.dependencies) {
      const depNode = nodes.find(n => n.instanceId === depId);
      if (depNode) {
        visit(depNode);
      }
    }

    visiting.delete(node.instanceId);
    visited.add(node.instanceId);
    result.push(node);
  }

  // 访问所有节点
  for (const node of nodes) {
    visit(node);
  }

  return result;
}

/**
 * 分组为步骤
 */
function groupIntoSteps(nodes: TopologyNode[], maxPartsPerStep: number): AssemblyStep[] {
  const steps: AssemblyStep[] = [];
  let currentStep: AssemblyStep | null = null;

  for (let i = 0; i < nodes.length; i++) {
    // 创建新步骤
    if (i % maxPartsPerStep === 0) {
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        stepNumber: steps.length + 1,
        parts: [],
        description: `步骤 ${steps.length + 1}`
      };
    }

    if (currentStep) {
      currentStep.parts.push(nodes[i].instanceId);
    }
  }

  // 添加最后一步
  if (currentStep && currentStep.parts.length > 0) {
    steps.push(currentStep);
  }

  return steps;
}

/**
 * 处理取消
 */
function handleCancel(taskId: string): void {
  if (currentTask?.id === taskId) {
    currentTask.isCancelled = true;
  }
}

/**
 * 处理释放
 */
function handleDispose(): void {
  parsedPartsCache.clear();
  currentTask = null;
}

/**
 * 消息处理
 */
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, taskId } = event.data;

  switch (type) {
    case 'INIT':
      handleInit();
      break;

    case 'PARSE_LDRAW':
      if (payload && taskId) {
        currentTask = { id: taskId, type, isCancelled: false };
        handleParseLDraw(payload, taskId);
      }
      break;

    case 'BUILD_MODEL':
      if (payload && taskId) {
        currentTask = { id: taskId, type, isCancelled: false };
        handleBuildModel(payload, taskId);
      }
      break;

    case 'CALCULATE_STABILITY':
      if (payload && taskId) {
        currentTask = { id: taskId, type, isCancelled: false };
        handleCalculateStability(payload, taskId);
      }
      break;

    case 'GENERATE_STEPS':
      if (payload && taskId) {
        currentTask = { id: taskId, type, isCancelled: false };
        handleGenerateSteps(payload, taskId);
      }
      break;

    case 'CANCEL':
      if (taskId) {
        handleCancel(taskId);
      }
      break;

    case 'DISPOSE':
      handleDispose();
      break;
  }
});

// 导出类型以便在主线程使用
export type {
  WorkerMessage,
  WorkerResponse,
  PartInstance,
  ModelData,
  AssemblyStep,
  WorkerMessageType,
  WorkerResponseType
};
