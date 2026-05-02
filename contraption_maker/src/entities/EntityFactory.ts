import * as planck from 'planck-js'
import { v4 as uuidv4 } from 'uuid'
import { EntityType, EntityProps } from '../types'
import { BaseEntity } from './BaseEntity'
import { Ball } from './Ball'
import { Gear } from './Gear'
import { Link } from './Link'
import { Spring } from './Spring'
import { Motor } from './Motor'
import { Hinge } from './Hinge'
import { Basket } from './Basket'
import { FixedPoint } from './FixedPoint'
import { Ground } from './Ground'

export class EntityFactory {
  static createEntity(type: EntityType, props: Partial<EntityProps>): BaseEntity {
    const id = props.id || uuidv4()
    const position = props.position || planck.Vec2(0, 0)
    const angle = props.angle || 0
    const isStatic = props.isStatic ?? false
    const density = props.density ?? 1.0
    const friction = props.friction ?? 0.3
    const restitution = props.restitution ?? 0.2
    const properties = props.properties || {}

    const entityProps: EntityProps = {
      id,
      type,
      position,
      angle,
      isStatic,
      density,
      friction,
      restitution,
      properties,
    }

    switch (type) {
      case EntityType.BALL:
        return new Ball(entityProps)
      case EntityType.GEAR:
        return new Gear(entityProps)
      case EntityType.LINK:
        return new Link(entityProps)
      case EntityType.SPRING:
        return new Spring(entityProps)
      case EntityType.MOTOR:
        return new Motor(entityProps)
      case EntityType.HINGE:
        return new Hinge(entityProps)
      case EntityType.BASKET:
        return new Basket(entityProps)
      case EntityType.FIXED_POINT:
        return new FixedPoint(entityProps)
      case EntityType.GROUND:
        return new Ground(entityProps)
      default:
        throw new Error(`Unknown entity type: ${type}`)
    }
  }

  static createDefaultEntity(type: EntityType, position: planck.Vec2): BaseEntity {
    const defaultProps: Record<EntityType, Partial<EntityProps>> = {
      [EntityType.BALL]: {
        properties: { radius: 0.5 },
        density: 1.0,
        restitution: 0.6,
      },
      [EntityType.GEAR]: {
        properties: { radius: 1.0, teethCount: 20 },
        density: 0.5,
      },
      [EntityType.LINK]: {
        properties: { length: 3.0, width: 0.3 },
        density: 0.8,
      },
      [EntityType.SPRING]: {
        properties: { restLength: 2.0, stiffness: 50.0, damping: 0.5 },
        density: 0.1,
      },
      [EntityType.MOTOR]: {
        properties: { radius: 0.5, speed: 2.0, maxTorque: 100.0 },
        isStatic: true,
      },
      [EntityType.HINGE]: {
        properties: { radius: 0.2 },
        isStatic: true,
      },
      [EntityType.BASKET]: {
        properties: { width: 2.0, height: 1.0 },
        isStatic: true,
      },
      [EntityType.FIXED_POINT]: {
        properties: { radius: 0.3 },
        isStatic: true,
      },
      [EntityType.GROUND]: {
        properties: { width: 50, height: 1 },
        isStatic: true,
        friction: 0.8,
      },
    }

    const props = defaultProps[type]
    return this.createEntity(type, {
      ...props,
      position,
    })
  }

  static fromProps(props: EntityProps): BaseEntity {
    return this.createEntity(props.type, props)
  }
}
