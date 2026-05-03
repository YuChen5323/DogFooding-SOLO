import { World } from './World';

export interface ISystem {
  name: string;
  priority: number;
  enabled: boolean;
  onInit?(world: World): void;
  onUpdate?(world: World, deltaTime: number): void;
  onRender?(world: World): void;
  onDestroy?(world: World): void;
}

export abstract class System implements ISystem {
  name: string;
  priority: number;
  enabled: boolean;

  constructor(name: string, priority: number = 0) {
    this.name = name;
    this.priority = priority;
    this.enabled = true;
  }

  onInit?(_world: World): void;
  onUpdate?(_world: World, _deltaTime: number): void;
  onRender?(_world: World): void;
  onDestroy?(_world: World): void;
}

export class SystemManager {
  private systems: System[] = [];
  private initialized: Set<string> = new Set();

  add(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  remove(systemName: string): void {
    this.systems = this.systems.filter(s => s.name !== systemName);
    this.initialized.delete(systemName);
  }

  get(systemName: string): System | undefined {
    return this.systems.find(s => s.name === systemName);
  }

  initAll(world: World): void {
    for (const system of this.systems) {
      if (!this.initialized.has(system.name) && system.enabled) {
        if (system.onInit) {
          system.onInit(world);
        }
        this.initialized.add(system.name);
      }
    }
  }

  updateAll(world: World, deltaTime: number): void {
    for (const system of this.systems) {
      if (system.enabled && system.onUpdate) {
        if (!this.initialized.has(system.name)) {
          if (system.onInit) {
            system.onInit(world);
          }
          this.initialized.add(system.name);
        }
        system.onUpdate(world, deltaTime);
      }
    }
  }

  renderAll(world: World): void {
    for (const system of this.systems) {
      if (system.enabled && system.onRender) {
        if (!this.initialized.has(system.name)) {
          if (system.onInit) {
            system.onInit(world);
          }
          this.initialized.add(system.name);
        }
        system.onRender(world);
      }
    }
  }

  destroyAll(world: World): void {
    for (const system of this.systems) {
      if (system.onDestroy) {
        system.onDestroy(world);
      }
    }
    this.systems = [];
    this.initialized.clear();
  }
}
