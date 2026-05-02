import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Link extends BaseEntity {
  private length: number
  private width: number
  private color: string = '#ffd93d'
  private endRadius: number
  
  constructor(props: EntityProps) {
    super(props)
    this.length = (props.properties.length as number) || 3.0
    this.width = (props.properties.width as number) || 0.3
    this.endRadius = this.width * 0.6
  }

  createBody(world: planck.World, position: planck.Vec2, angle: number): void {
    this.world = world
    const bodyDef: planck.BodyDef = {
      type: this.isStatic ? 'static' : 'dynamic',
      position: position,
      angle: angle,
    }
    
    this.body = world.createBody(bodyDef)
    
    const fixtureDef: planck.FixtureDef = {
      shape: planck.Box(this.length / 2, this.width / 2),
      density: this.density,
      friction: this.friction,
      restitution: this.restitution,
    }
    
    this.body.createFixture(fixtureDef)
  }

  render(ctx: CanvasRenderingContext2D, scale: number, showDebug: boolean): void {
    if (!this.body) return
    
    const position = this.body.getPosition()
    const angle = this.body.getAngle()
    const screenX = position.x * scale
    const screenY = position.y * scale
    const screenLength = this.length * scale
    const screenWidth = this.width * scale
    const screenEndRadius = this.endRadius * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    ctx.fillStyle = this.color
    ctx.strokeStyle = '#cc9900'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.roundRect(-screenLength / 2, -screenWidth / 2, screenLength, screenWidth, screenEndRadius)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#cc9900'
    ctx.strokeStyle = '#996600'
    ctx.lineWidth = 1
    
    ctx.beginPath()
    ctx.arc(-screenLength / 2 + screenEndRadius, 0, screenEndRadius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(screenLength / 2 - screenEndRadius, 0, screenEndRadius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 1
    for (let i = -screenLength / 2 + screenEndRadius * 2; i < screenLength / 2 - screenEndRadius; i += 10) {
      ctx.beginPath()
      ctx.moveTo(i, -screenWidth / 2 + 2)
      ctx.lineTo(i, screenWidth / 2 - 2)
      ctx.stroke()
    }
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.body) return
    
    const screenWidth = this.width * scale
    
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-50, -screenWidth / 2 - 40, 100, 30)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`速度: ${speed.toFixed(1)}`, 0, -screenWidth / 2 - 26)
    ctx.fillText(`应力: ${this.getStress().toFixed(1)}`, 0, -screenWidth / 2 - 14)
  }

  getStress(): number {
    if (!this.body) return 0
    
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    const angularSpeed = Math.abs(this.body.getAngularVelocity())
    
    return speed + angularSpeed * 0.5
  }

  getLength(): number {
    return this.length
  }

  setLength(length: number): void {
    this.length = length
  }

  getWidth(): number {
    return this.width
  }

  setWidth(width: number): void {
    this.width = width
    this.endRadius = width * 0.6
  }

  getEndPoints(): { start: planck.Vec2; end: planck.Vec2 } {
    if (!this.body) {
      return {
        start: planck.Vec2(0, 0),
        end: planck.Vec2(0, 0),
      }
    }
    
    const position = this.body.getPosition()
    const angle = this.body.getAngle()
    
    const halfLength = this.length / 2
    const dx = Math.cos(angle) * halfLength
    const dy = Math.sin(angle) * halfLength
    
    return {
      start: planck.Vec2(position.x - dx, position.y - dy),
      end: planck.Vec2(position.x + dx, position.y + dy),
    }
  }
}
