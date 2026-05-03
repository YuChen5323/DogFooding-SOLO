import { World } from './World';
import { EntityId } from './Entity';

export class Query {
  private world: World;
  private requiredComponents: string[];
  private excludedComponents: string[];

  constructor(
    world: World,
    requiredComponents: string[],
    excludedComponents: string[] = []
  ) {
    this.world = world;
    this.requiredComponents = requiredComponents;
    this.excludedComponents = excludedComponents;
  }

  with(componentType: string): Query {
    this.requiredComponents.push(componentType);
    return this;
  }

  without(componentType: string): Query {
    this.excludedComponents.push(componentType);
    return this;
  }

  entities(): EntityId[] {
    const result: EntityId[] = [];
    const allEntities = this.world.getEntities();

    for (const entity of allEntities) {
      if (!entity.active) continue;

      let hasAllRequired = true;
      for (const comp of this.requiredComponents) {
        if (!this.world.hasComponent(entity.id, comp)) {
          hasAllRequired = false;
          break;
        }
      }

      if (!hasAllRequired) continue;

      let hasExcluded = false;
      for (const comp of this.excludedComponents) {
        if (this.world.hasComponent(entity.id, comp)) {
          hasExcluded = true;
          break;
        }
      }

      if (!hasExcluded) {
        result.push(entity.id);
      }
    }

    return result;
  }

  iter(): IterableIterator<EntityId> {
    return this.entities()[Symbol.iterator]();
  }

  forEach(callback: (entityId: EntityId) => void): void {
    for (const entityId of this.entities()) {
      callback(entityId);
    }
  }
}
