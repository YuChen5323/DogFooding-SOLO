import * as planck from 'planck-js'
import { EntityId, EntityType, EntityProps } from '../types'

export abstract class BaseEntity {
  protected id: EntityId
  protected type: EntityType
  protected body: planck.Body | null = null
  protected world: planck.World | null = null
  protected properties: Record<string, unknown>
  protected isStatic: boolean
  protected density: number
  protected friction: number
  protected restitution: number

  constructor(props: EntityProps) {
    this.id = props.id
    this.type = props.type
    this.isStatic = props.isStatic
    this.density = props.density
    this.friction = props.friction
    this.restitution = props.restitution
    this.properties = { ...props.properties }
  }

  getId(): EntityId {
    return this.id
  }

  getType(): EntityType {
    return this.type
  }

  getBody(): planck.Body | null {
    return this.body
  }

  setProperty(key: string, value: unknown): void {
    this.properties[key] = value
  }

  getProperty<T>(key: string): T | undefined {
    return this.properties[key] as T
  }

  getProperties(): Record<string, unknown> {
    return { ...this.properties }
  }

  abstract createBody(world: planck.World, position: planck.Vec2, angle: number): void

  abstract render(ctx: CanvasRenderingContext2D, scale: number, showDebug: boolean): void

  abstract getStress(): number

  destroy(): void {
    if (this.world && this.body) {
      this.world.destroyBody(this.body)
      this.body = null
      this.world = null
    }
  }

  toProps(): EntityProps {
    const position = this.body ? this.body.getPosition() : planck.Vec2(0, 0)
    const angle = this.body ? this.body.getAngle() : 0

    return {
      id: this.id,
      type: this.type,
      position: planck.Vec2(position.x, position.y),
      angle: angle,
      isStatic: this.isStatic,
      density: this.density,
      friction: this.friction,
      restitution: this.restitution,
      properties: { ...this.properties },
    }
  }
}
