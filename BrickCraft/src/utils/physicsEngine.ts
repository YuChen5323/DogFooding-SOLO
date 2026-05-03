import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

/**
 * 物理体类型
 */
export type PhysicsBodyType = 'static' | 'dynamic' | 'kinematic';

/**
 * 碰撞器形状
 */
export type ColliderShape = 'cuboid' | 'ball' | 'cylinder' | 'trimesh';

/**
 * 物理体配置
 */
export interface PhysicsBodyConfig {
  id?: string;
  bodyType: PhysicsBodyType;
  position: [number, number, number];
  rotation?: [number, number, number]; // 欧拉角 (弧度)
  mass?: number;
  restitution?: number;
  friction?: number;
  linearVelocity?: [number, number, number];
  angularVelocity?: [number, number, number];
  canSleep?: boolean;
  ccdEnabled?: boolean;
}

/**
 * 碰撞器配置
 */
export interface ColliderConfig {
  shape: ColliderShape;
  dimensions: number[]; // 根据形状不同：
                         // cuboid: [halfWidth, halfHeight, halfDepth]
                         // ball: [radius]
                         // cylinder: [halfHeight, radius]
                         // trimesh: [vertices, indices]
  density?: number;
  isSensor?: boolean;
  collisionGroups?: number;
  solverGroups?: number;
}

/**
 * 物理事件回调
 */
export interface PhysicsCallbacks {
  onCollision?: (body1Id: string, body2Id: string) => void;
  onCollisionEnd?: (body1Id: string, body2Id: string) => void;
  onBodySleep?: (bodyId: string) => void;
  onBodyWake?: (bodyId: string) => void;
}

/**
 * 物理引擎管理器
 * 封装 Rapier.js 物理引擎
 */
export class PhysicsEngine {
  private world: RAPIER.World | null = null;
  private bodies: Map<string, RAPIER.RigidBody> = new Map();
  private colliders: Map<string, RAPIER.Collider[]> = new Map();
  private eventQueue: RAPIER.EventQueue | null = null;
  private initialized = false;
  private gravity: { x: number; y: number; z: number } = { x: 0.0, y: -9.81, z: 0.0 };
  private callbacks: PhysicsCallbacks = {};
  private timestep: number = 1 / 60;
  private accumulator: number = 0;

  /**
   * 初始化物理引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 初始化 RAPIER
    await RAPIER.init();

    // 创建物理世界
    this.world = new RAPIER.World(this.gravity);

    // 创建事件队列
    this.eventQueue = new RAPIER.EventQueue(true);

    this.initialized = true;
    console.log('Physics engine initialized');
  }

  /**
   * 设置物理回调
   */
  setCallbacks(callbacks: PhysicsCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 设置重力
   */
  setGravity(x: number, y: number, z: number): void {
    this.gravity = { x, y, z };
    if (this.world) {
      this.world.gravity = this.gravity;
    }
  }

  /**
   * 创建物理体
   */
  createBody(config: PhysicsBodyConfig): string {
    if (!this.world) throw new Error('Physics world not initialized');

    const id = config.id || uuidv4();

    // 创建刚体描述
    let bodyDesc: RAPIER.RigidBodyDesc;
    switch (config.bodyType) {
      case 'dynamic':
        bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case 'kinematic':
        bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
      case 'static':
      default:
        bodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }

    // 设置位置
    bodyDesc.setTranslation(config.position[0], config.position[1], config.position[2]);

    // 设置旋转 (如果提供)
    if (config.rotation) {
      const quaternion = this.eulerToQuaternion(
        config.rotation[0],
        config.rotation[1],
        config.rotation[2]
      );
      bodyDesc.setRotation(quaternion);
    }

    // 设置其他属性
    if (config.canSleep !== undefined) {
      bodyDesc.setCanSleep(config.canSleep);
    }

    if (config.ccdEnabled !== undefined) {
      bodyDesc.setCcdEnabled(config.ccdEnabled);
    }

    // 创建刚体
    const body = this.world.createRigidBody(bodyDesc);

    // 设置速度
    if (config.linearVelocity) {
      body.setLinvel(
        { x: config.linearVelocity[0], y: config.linearVelocity[1], z: config.linearVelocity[2] },
        true
      );
    }

    if (config.angularVelocity) {
      body.setAngvel(
        { x: config.angularVelocity[0], y: config.angularVelocity[1], z: config.angularVelocity[2] },
        true
      );
    }

    this.bodies.set(id, body);
    this.colliders.set(id, []);

    return id;
  }

  /**
   * 为物理体添加碰撞器
   */
  addCollider(bodyId: string, config: ColliderConfig): void {
    if (!this.world) throw new Error('Physics world not initialized');

    const body = this.bodies.get(bodyId);
    if (!body) throw new Error(`Body not found: ${bodyId}`);

    // 创建碰撞器描述
    let colliderDesc: RAPIER.ColliderDesc;

    switch (config.shape) {
      case 'cuboid':
        colliderDesc = RAPIER.ColliderDesc.cuboid(
          config.dimensions[0],
          config.dimensions[1],
          config.dimensions[2]
        );
        break;

      case 'ball':
        colliderDesc = RAPIER.ColliderDesc.ball(config.dimensions[0]);
        break;

      case 'cylinder':
        colliderDesc = RAPIER.ColliderDesc.cylinder(config.dimensions[0], config.dimensions[1]);
        break;

      case 'trimesh':
        // trimesh 需要 vertices 和 indices
        const vertices = config.dimensions[0] as Float32Array;
        const indices = config.dimensions[1] as Uint32Array;
        colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
        break;

      default:
        throw new Error(`Unsupported collider shape: ${config.shape}`);
    }

    // 设置碰撞器属性
    if (config.density !== undefined) {
      colliderDesc.setDensity(config.density);
    }

    if (config.isSensor !== undefined) {
      colliderDesc.setSensor(config.isSensor);
    }

    if (config.collisionGroups !== undefined) {
      colliderDesc.setCollisionGroups(config.collisionGroups);
    }

    if (config.solverGroups !== undefined) {
      colliderDesc.setSolverGroups(config.solverGroups);
    }

    // 创建碰撞器
    const collider = this.world.createCollider(colliderDesc, body);

    // 记录碰撞器
    const colliderList = this.colliders.get(bodyId) || [];
    colliderList.push(collider);
    this.colliders.set(bodyId, colliderList);
  }

  /**
   * 移除物理体
   */
  removeBody(bodyId: string): void {
    if (!this.world) return;

    const body = this.bodies.get(bodyId);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(bodyId);
      this.colliders.delete(bodyId);
    }
  }

  /**
   * 获取物理体位置
   */
  getBodyPosition(bodyId: string): [number, number, number] | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;

    const translation = body.translation();
    return [translation.x, translation.y, translation.z];
  }

  /**
   * 获取物理体旋转 (四元数)
   */
  getBodyRotation(bodyId: string): [number, number, number, number] | null {
    const body = this.bodies.get(bodyId);
    if (!body) return null;

    const rotation = body.rotation();
    return [rotation.x, rotation.y, rotation.z, rotation.w];
  }

  /**
   * 获取物理体旋转 (欧拉角，弧度)
   */
  getBodyEulerRotation(bodyId: string): [number, number, number] | null {
    const quaternion = this.getBodyRotation(bodyId);
    if (!quaternion) return null;
    return this.quaternionToEuler(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
  }

  /**
   * 设置物理体位置
   */
  setBodyPosition(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    body.setTranslation({ x, y, z }, true);
  }

  /**
   * 设置物理体旋转 (欧拉角，弧度)
   */
  setBodyRotation(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    const quaternion = this.eulerToQuaternion(x, y, z);
    body.setRotation(quaternion, true);
  }

  /**
   * 设置物理体线速度
   */
  setLinearVelocity(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    body.setLinvel({ x, y, z }, true);
  }

  /**
   * 设置物理体角速度
   */
  setAngularVelocity(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    body.setAngvel({ x, y, z }, true);
  }

  /**
   * 应用力
   */
  applyForce(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    body.addForce({ x, y, z }, true);
  }

  /**
   * 应用冲量
   */
  applyImpulse(bodyId: string, x: number, y: number, z: number): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    body.addImpulse({ x, y, z }, true);
  }

  /**
   * 检查物理体是否在睡眠状态
   */
  isBodySleeping(bodyId: string): boolean {
    const body = this.bodies.get(bodyId);
    if (!body) return false;
    return body.isSleeping();
  }

  /**
   * 唤醒物理体
   */
  wakeBody(bodyId: string): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;
    body.wakeUp(true);
  }

  /**
   * 更新物理世界
   * @param deltaTime 从上一帧到现在的时间 (秒)
   */
  update(deltaTime: number): void {
    if (!this.world || !this.eventQueue) return;

    // 固定时间步长更新
    this.accumulator += deltaTime;

    while (this.accumulator >= this.timestep) {
      // 更新物理世界
      this.world.step(this.eventQueue);

      // 处理碰撞事件
      this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
        const body1 = this.world?.getRigidBody(handle1);
        const body2 = this.world?.getRigidBody(handle2);

        if (body1 && body2) {
          // 通过句柄查找ID
          const id1 = this.findBodyIdByHandle(body1.handle);
          const id2 = this.findBodyIdByHandle(body2.handle);

          if (id1 && id2) {
            if (started && this.callbacks.onCollision) {
              this.callbacks.onCollision(id1, id2);
            } else if (!started && this.callbacks.onCollisionEnd) {
              this.callbacks.onCollisionEnd(id1, id2);
            }
          }
        }
      });

      // 处理睡眠事件
      this.eventQueue.drainSleepEvents((handle, isSleeping) => {
        const body = this.world?.getRigidBody(handle);
        if (body) {
          const id = this.findBodyIdByHandle(body.handle);
          if (id) {
            if (isSleeping && this.callbacks.onBodySleep) {
              this.callbacks.onBodySleep(id);
            } else if (!isSleeping && this.callbacks.onBodyWake) {
              this.callbacks.onBodyWake(id);
            }
          }
        }
      });

      this.accumulator -= this.timestep;
    }
  }

  /**
   * 射线检测
   */
  raycast(
    origin: [number, number, number],
    direction: [number, number, number],
    maxDistance: number = 1000.0,
    solid: boolean = true
  ): {
    bodyId: string;
    point: [number, number, number];
    normal: [number, number, number];
    distance: number;
  } | null {
    if (!this.world) return null;

    const ray = new RAPIER.Ray(
      { x: origin[0], y: origin[1], z: origin[2] },
      { x: direction[0], y: direction[1], z: direction[2] }
    );

    const hit = this.world.castRay(ray, maxDistance, solid);

    if (hit) {
      const collider = this.world.colliders.get(hit.colliderHandle);
      if (collider) {
        const body = collider.parent();
        if (body) {
          const bodyId = this.findBodyIdByHandle(body.handle);
          if (bodyId) {
            const point = ray.pointAt(hit.toi);
            return {
              bodyId,
              point: [point.x, point.y, point.z],
              normal: [hit.normal.x, hit.normal.y, hit.normal.z],
              distance: hit.toi,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 形状检测
   */
  shapeIntersection(
    shape: ColliderShape,
    dimensions: number[],
    position: [number, number, number],
    rotation?: [number, number, number]
  ): string[] {
    if (!this.world) return [];

    // 创建临时形状
    let shapeHandle: RAPIER.Shape | null = null;

    switch (shape) {
      case 'cuboid':
        shapeHandle = new RAPIER.Cuboid(
          dimensions[0],
          dimensions[1],
          dimensions[2]
        );
        break;
      case 'ball':
        shapeHandle = new RAPIER.Ball(dimensions[0]);
        break;
      case 'cylinder':
        shapeHandle = new RAPIER.Cylinder(dimensions[0], dimensions[1]);
        break;
    }

    if (!shapeHandle) return [];

    const intersectingBodies: string[] = [];

    // 执行形状检测
    const pos = { x: position[0], y: position[1], z: position[2] };
    const rot = rotation ? this.eulerToQuaternion(rotation[0], rotation[1], rotation[2]) : { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };

    this.world.intersectionsWithShape(pos, rot, shapeHandle, (collider) => {
      const body = collider.parent();
      if (body) {
        const bodyId = this.findBodyIdByHandle(body.handle);
        if (bodyId && !intersectingBodies.includes(bodyId)) {
          intersectingBodies.push(bodyId);
        }
      }
      return true; // 继续检测
    });

    return intersectingBodies;
  }

  /**
   * 通过句柄查找物理体ID
   */
  private findBodyIdByHandle(handle: number): string | null {
    for (const [id, body] of this.bodies.entries()) {
      if (body.handle === handle) {
        return id;
      }
    }
    return null;
  }

  /**
   * 欧拉角转四元数 (YXZ 顺序)
   */
  private eulerToQuaternion(
    x: number,
    y: number,
    z: number
  ): { x: number; y: number; z: number; w: number } {
    const c1 = Math.cos(y / 2);
    const s1 = Math.sin(y / 2);
    const c2 = Math.cos(x / 2);
    const s2 = Math.sin(x / 2);
    const c3 = Math.cos(z / 2);
    const s3 = Math.sin(z / 2);

    const w = c1 * c2 * c3 + s1 * s2 * s3;
    const qx = c1 * s2 * c3 - s1 * c2 * s3;
    const qy = s1 * c2 * c3 + c1 * s2 * s3;
    const qz = c1 * c2 * s3 - s1 * s2 * c3;

    return { x: qx, y: qy, z: qz, w };
  }

  /**
   * 四元数转欧拉角 (YXZ 顺序，弧度)
   */
  private quaternionToEuler(
    x: number,
    y: number,
    z: number,
    w: number
  ): [number, number, number] {
    const sqw = w * w;
    const sqx = x * x;
    const sqy = y * y;
    const sqz = z * z;

    let heading: number;
    let attitude: number;
    let bank: number;

    const unit = sqx + sqy + sqz + sqw;
    const test = x * y + z * w;

    if (test > 0.499 * unit) {
      // 奇点在北极点
      heading = 2 * Math.atan2(x, w);
      attitude = Math.PI / 2;
      bank = 0;
    } else if (test < -0.499 * unit) {
      // 奇点在南极点
      heading = -2 * Math.atan2(x, w);
      attitude = -Math.PI / 2;
      bank = 0;
    } else {
      heading = Math.atan2(2 * y * w - 2 * x * z, sqx - sqy - sqz + sqw);
      attitude = Math.asin((2 * test) / unit);
      bank = Math.atan2(2 * x * w - 2 * y * z, -sqx + sqy - sqz + sqw);
    }

    return [bank, heading, attitude];
  }

  /**
   * 销毁物理引擎
   */
  destroy(): void {
    this.bodies.clear();
    this.colliders.clear();
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    if (this.eventQueue) {
      this.eventQueue.free();
      this.eventQueue = null;
    }
    this.initialized = false;
  }

  /**
   * 获取物理体数量
   */
  getBodyCount(): number {
    return this.bodies.size;
  }

  /**
   * 获取所有物理体ID
   */
  getBodyIds(): string[] {
    return Array.from(this.bodies.keys());
  }
}

// 单例实例
let physicsEngineInstance: PhysicsEngine | null = null;

/**
 * 获取物理引擎单例
 */
export function getPhysicsEngine(): PhysicsEngine {
  if (!physicsEngineInstance) {
    physicsEngineInstance = new PhysicsEngine();
  }
  return physicsEngineInstance;
}

export default PhysicsEngine;
