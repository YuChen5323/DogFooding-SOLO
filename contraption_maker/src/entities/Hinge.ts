import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Hinge extends BaseEntity {
  private radius: number
  private color: string = '#3498db'
  private connectedEntityId1: string | null = null
  private connectedEntityId2: string | null = null
  
  constructor(props: EntityProps) {
    super({
      ...props,
      isStatic: true,
    })
    this.radius = (props.properties.radius as number) || 0.2
  }

  createBody(world: planck.World, position: planck.Vec2, angle: number): void {
    this.world = world
    const bodyDef: planck.BodyDef = {
      type: 'static',
      position: position,
      angle: angle,
    }
    
    this.body = world.createBody(bodyDef)
    
    const fixtureDef: planck.FixtureDef = {
      shape: planck.Circle(this.radius),
      density: 0,
      friction: 0,
      restitution: 0,
      isSensor: true,
    }
    
    this.body.createFixture(fixtureDef)
  }

  render(ctx: CanvasRenderingContext2D, scale: number, showDebug: boolean): void {
    if (!this.body) return
    
    const position = this.body.getPosition()
    const screenX = position.x * scale
    const screenY = position.y * scale
    const screenRadius = this.radius * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = this.color
    ctx.strokeStyle = '#2980b9'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#1a5276'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-screenRadius * 0.7, 0)
    ctx.lineTo(screenRadius * 0.7, 0)
    ctx.moveTo(0, -screenRadius * 0.7)
    ctx.lineTo(0, screenRadius * 0.7)
    ctx.stroke()
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.body) return
    
    const screenRadius = this.radius * scale
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-40, -screenRadius - 35, 80, 25)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('铰链', 0, -screenRadius - 21)
    ctx.fillText(`连接: ${this.getConnectionCount()}`, 0, -screenRadius - 9)
  }

  getStress(): number {
    return 0
  }

  getRadius(): number {
    return this.radius
  }

  setConnectedEntity1(entityId: string | null): void {
    this.connectedEntityId1 = entityId
  }

  setConnectedEntity2(entityId: string | null): void {
    this.connectedEntityId2 = entityId
  }

  getConnectedEntity1(): string | null {
    return this.connectedEntityId1
  }

  getConnectedEntity2(): string | null {
    return this.connectedEntityId2
  }

  getConnectionCount(): number {
    let count = 0
    if (this.connectedEntityId1) count++
    if (this.connectedEntityId2) count++
    return count
  }

  isFullyConnected(): boolean {
    return this.connectedEntityId1 !== null && this.connectedEntityId2 !== null
  }
}
