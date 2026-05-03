import { LDrawModelInstance } from '../types/ldraw';
import { ProjectData, BuildStep } from '../types/app';

/**
 * OPFS (Origin Private File System) 存储管理器
 * 用于在浏览器中持久化存储乐高项目
 */
export class OPFSStorageManager {
  private root: FileSystemDirectoryHandle | null = null;
  private readonly PROJECTS_DIR = 'brickcraft_projects';
  private readonly THUMBNAILS_DIR = 'thumbnails';

  /**
   * 初始化OPFS
   */
  async initialize(): Promise<void> {
    if (this.root) return;

    // 检查浏览器是否支持OPFS
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('浏览器不支持 Origin Private File System');
    }

    try {
      const opfsRoot = await navigator.storage.getDirectory();
      this.root = await opfsRoot.getDirectoryHandle(this.PROJECTS_DIR, { create: true });
      
      // 创建缩略图目录
      await this.root.getDirectoryHandle(this.THUMBNAILS_DIR, { create: true });
    } catch (error) {
      console.error('OPFS 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查OPFS是否可用
   */
  static isAvailable(): boolean {
    return 'storage' in navigator && 'getDirectory' in navigator.storage;
  }

  /**
   * 生成唯一的项目ID
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存项目
   */
  async saveProject(
    parts: LDrawModelInstance[],
    name: string = '未命名项目',
    steps?: BuildStep[],
    thumbnail?: string
  ): Promise<ProjectData> {
    if (!this.root) {
      await this.initialize();
    }

    const projectId = this.generateProjectId();
    const now = Date.now();

    const projectData: ProjectData = {
      id: projectId,
      name,
      createdAt: now,
      updatedAt: now,
      parts,
      steps,
      thumbnail,
    };

    // 创建项目文件
    const fileHandle = await this.root!.getFileHandle(`${projectId}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(projectData, null, 2));
    await writable.close();

    // 保存缩略图
    if (thumbnail) {
      await this.saveThumbnail(projectId, thumbnail);
    }

    return projectData;
  }

  /**
   * 更新现有项目
   */
  async updateProject(
    projectId: string,
    parts: LDrawModelInstance[],
    name?: string,
    steps?: BuildStep[],
    thumbnail?: string
  ): Promise<ProjectData> {
    if (!this.root) {
      await this.initialize();
    }

    // 读取现有项目
    let existingProject: ProjectData | null = null;
    try {
      const fileHandle = await this.root!.getFileHandle(`${projectId}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      existingProject = JSON.parse(content);
    } catch {
      throw new Error(`项目不存在: ${projectId}`);
    }

    const updatedProject: ProjectData = {
      ...existingProject,
      name: name ?? existingProject.name,
      updatedAt: Date.now(),
      parts,
      steps: steps ?? existingProject.steps,
      thumbnail: thumbnail ?? existingProject.thumbnail,
    };

    // 写入更新
    const fileHandle = await this.root!.getFileHandle(`${projectId}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(updatedProject, null, 2));
    await writable.close();

    // 更新缩略图
    if (thumbnail) {
      await this.saveThumbnail(projectId, thumbnail);
    }

    return updatedProject;
  }

  /**
   * 加载项目
   */
  async loadProject(projectId: string): Promise<ProjectData> {
    if (!this.root) {
      await this.initialize();
    }

    try {
      const fileHandle = await this.root!.getFileHandle(`${projectId}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      console.error(`加载项目失败: ${projectId}`, error);
      throw new Error(`无法加载项目: ${projectId}`);
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.root) {
      await this.initialize();
    }

    try {
      await this.root!.removeEntry(`${projectId}.json`);
      
      // 尝试删除缩略图
      try {
        const thumbsDir = await this.root!.getDirectoryHandle(this.THUMBNAILS_DIR);
        await thumbsDir.removeEntry(`${projectId}.png`);
      } catch {
        // 缩略图不存在是正常的
      }
    } catch (error) {
      console.error(`删除项目失败: ${projectId}`, error);
      throw new Error(`无法删除项目: ${projectId}`);
    }
  }

  /**
   * 获取所有项目列表
   */
  async listProjects(): Promise<ProjectData[]> {
    if (!this.root) {
      await this.initialize();
    }

    const projects: ProjectData[] = [];

    try {
      for await (const [name, handle] of this.root!.entries()) {
        if (handle.kind === 'file' && name.endsWith('.json') && !name.startsWith('.')) {
          try {
            const file = await (handle as FileSystemFileHandle).getFile();
            const content = await file.text();
            const project = JSON.parse(content) as ProjectData;
            projects.push(project);
          } catch (error) {
            console.warn(`无法解析项目文件: ${name}`, error);
          }
        }
      }
    } catch (error) {
      console.error('列出项目失败:', error);
    }

    // 按更新时间排序 (最新的在前)
    projects.sort((a, b) => b.updatedAt - a.updatedAt);

    return projects;
  }

  /**
   * 保存缩略图
   */
  private async saveThumbnail(projectId: string, thumbnail: string): Promise<void> {
    if (!this.root) return;

    try {
      const thumbsDir = await this.root.getDirectoryHandle(this.THUMBNAILS_DIR, { create: true });
      const fileHandle = await thumbsDir.getFileHandle(`${projectId}.png`, { create: true });
      const writable = await fileHandle.createWritable();

      // 转换 dataURL 为 Blob
      const response = await fetch(thumbnail);
      const blob = await response.blob();

      await writable.write(blob);
      await writable.close();
    } catch (error) {
      console.warn(`保存缩略图失败: ${projectId}`, error);
    }
  }

  /**
   * 加载缩略图
   */
  async loadThumbnail(projectId: string): Promise<string | null> {
    if (!this.root) return null;

    try {
      const thumbsDir = await this.root.getDirectoryHandle(this.THUMBNAILS_DIR);
      const fileHandle = await thumbsDir.getFileHandle(`${projectId}.png`);
      const file = await fileHandle.getFile();

      // 转换为 dataURL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  }

  /**
   * 清除所有项目 (谨慎使用)
   */
  async clearAllProjects(): Promise<void> {
    if (!this.root) {
      await this.initialize();
    }

    const projects = await this.listProjects();
    for (const project of projects) {
      await this.deleteProject(project.id);
    }
  }

  /**
   * 获取使用的存储空间
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }
}

// 单例实例
let storageManagerInstance: OPFSStorageManager | null = null;

/**
 * 获取存储管理器单例
 */
export function getStorageManager(): OPFSStorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new OPFSStorageManager();
  }
  return storageManagerInstance;
}

/**
 * 便捷函数: 保存当前项目
 */
export async function saveCurrentProject(
  parts: LDrawModelInstance[],
  name?: string
): Promise<ProjectData> {
  const manager = getStorageManager();
  return manager.saveProject(parts, name);
}

/**
 * 便捷函数: 加载项目
 */
export async function loadProject(projectId: string): Promise<ProjectData> {
  const manager = getStorageManager();
  return manager.loadProject(projectId);
}

/**
 * 便捷函数: 获取项目列表
 */
export async function listProjects(): Promise<ProjectData[]> {
  const manager = getStorageManager();
  return manager.listProjects();
}

export default OPFSStorageManager;
