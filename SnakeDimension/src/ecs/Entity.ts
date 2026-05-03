export type EntityId = number;
export type ComponentId = number;

export class Entity {
  id: EntityId;
  name: string;
  active: boolean;

  constructor(id: EntityId, name: string = "") {
    this.id = id;
    this.name = name || `Entity_${id}`;
    this.active = true;
  }
}
