import { Entity, EntityId } from './Entity';
import { IComponent, componentRegistry } from './Component';
import { System, SystemManager } from './System';
import { Query } from './Query';

export class World {
  private entities: Map<EntityId, Entity> = new Map();
  private entityComponents: Map<EntityId, Map<string, IComponent>> = new Map();
  private nextEntityId: EntityId = 1;
  private systemManager: SystemManager;
  private resources: Map<string, unknown> = new Map();

  constructor() {
    this.systemManager = new SystemManager();
  }

  createEntity(name: string = ""): EntityId {
    const id = this.nextEntityId++;
    const entity = new Entity(id, name);
    this.entities.set(id, entity);
    this.entityComponents.set(id, new Map());
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.entities.has(entityId)) {
      return false;
    }
    this.entities.delete(entityId);
    this.entityComponents.delete(entityId);
    return true;
  }

  getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }

  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  addComponent<T extends IComponent>(entityId: EntityId, component: T): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    componentRegistry.register(component.type);
    const components = this.entityComponents.get(entityId)!;
    components.set(component.type, component);
  }

  removeComponent(entityId: EntityId, componentType: string): boolean {
    const components = this.entityComponents.get(entityId);
    if (!components) {
      return false;
    }
    return components.delete(componentType);
  }

  getComponent<T extends IComponent>(entityId: EntityId, componentType: string): T | undefined {
    const components = this.entityComponents.get(entityId);
    if (!components) {
      return undefined;
    }
    return components.get(componentType) as T | undefined;
  }

  hasComponent(entityId: EntityId, componentType: string): boolean {
    const components = this.entityComponents.get(entityId);
    return components !== undefined && components.has(componentType);
  }

  query(requiredComponents: string[] = []): Query {
    return new Query(this, requiredComponents);
  }

  addSystem(system: System): void {
    this.systemManager.add(system);
  }

  removeSystem(systemName: string): void {
    this.systemManager.remove(systemName);
  }

  getSystem(systemName: string): System | undefined {
    return this.systemManager.get(systemName);
  }

  init(): void {
    this.systemManager.initAll(this);
  }

  update(deltaTime: number): void {
    this.systemManager.updateAll(this, deltaTime);
  }

  render(): void {
    this.systemManager.renderAll(this);
  }

  destroy(): void {
    this.systemManager.destroyAll(this);
    this.entities.clear();
    this.entityComponents.clear();
    this.resources.clear();
  }

  setResource<T>(key: string, value: T): void {
    this.resources.set(key, value);
  }

  getResource<T>(key: string): T | undefined {
    return this.resources.get(key) as T | undefined;
  }

  removeResource(key: string): boolean {
    return this.resources.delete(key);
  }
}
