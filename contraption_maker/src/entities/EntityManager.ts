import * as planck from 'planck-js'
import { EntityId, EntityProps, EntityType } from '../types'
import { BaseEntity } from './BaseEntity'
import { EntityFactory } from './EntityFactory'

export class EntityManager {
  private entities: Map<EntityId, BaseEntity> = new Map()
  private world: planck.World | null = null

  setWorld(world: planck.World): void {
    this.world = world
  }

  getWorld(): planck.World | null {
    return this.world
  }

  addEntity(entity: BaseEntity, position: planck.Vec2, angle: number = 0): void {
    if (this.world) {
      entity.createBody(this.world, position, angle)
    }
    this.entities.set(entity.getId(), entity)
  }

  removeEntity(id: EntityId): boolean {
    const entity = this.entities.get(id)
    if (entity) {
      entity.destroy()
      return this.entities.delete(id)
    }
    return false
  }

  getEntity(id: EntityId): BaseEntity | undefined {
    return this.entities.get(id)
  }

  getEntities(): BaseEntity[] {
    return Array.from(this.entities.values())
  }

  getEntitiesByType(type: EntityType): BaseEntity[] {
    return this.getEntities().filter((entity) => entity.getType() === type)
  }

  clear(): void {
    this.entities.forEach((entity) => entity.destroy())
    this.entities.clear()
  }

  renderAll(ctx: CanvasRenderingContext2D, scale: number, showDebug: boolean = false): void {
    this.entities.forEach((entity) => {
      entity.render(ctx, scale, showDebug)
    })
  }

  toPropsArray(): EntityProps[] {
    return this.getEntities().map((entity) => entity.toProps())
  }

  fromPropsArray(propsArray: EntityProps[]): void {
    this.clear()
    propsArray.forEach((props) => {
      const entity = EntityFactory.fromProps(props)
      if (this.world) {
        entity.createBody(this.world, props.position, props.angle)
      }
      this.entities.set(entity.getId(), entity)
    })
  }

  findEntityAtPosition(worldPos: planck.Vec2, radius: number = 0.5): BaseEntity | null {
    let closestEntity: BaseEntity | null = null
    let closestDistance = radius

    this.entities.forEach((entity) => {
      const body = entity.getBody()
      if (body) {
        const position = body.getPosition()
        const distance = Math.sqrt(
          Math.pow(position.x - worldPos.x, 2) + Math.pow(position.y - worldPos.y, 2)
        )
        if (distance < closestDistance) {
          closestDistance = distance
          closestEntity = entity
        }
      }
    })

    return closestEntity
  }

  getCount(): number {
    return this.entities.size
  }
}
