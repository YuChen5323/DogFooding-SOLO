export interface IComponent {
  type: string;
}

export class Component<T extends IComponent> {
  type: string;
  data: T;

  constructor(type: string, data: T) {
    this.type = type;
    this.data = data;
  }
}

export class ComponentRegistry {
  private components: Map<string, number> = new Map();
  private nextId: number = 0;

  register(type: string): number {
    if (this.components.has(type)) {
      return this.components.get(type)!;
    }
    const id = this.nextId++;
    this.components.set(type, id);
    return id;
  }

  getId(type: string): number | undefined {
    return this.components.get(type);
  }

  getType(id: number): string | undefined {
    for (const [type, componentId] of this.components) {
      if (componentId === id) {
        return type;
      }
    }
    return undefined;
  }
}

export const componentRegistry = new ComponentRegistry();
