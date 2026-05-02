import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Ball extends BaseEntity {
  private radius: number
  private color: string = '#ff6b6b'
  
  constructor(props: EntityProps) {
    super(props)
    this.radius = (props.properties.radius as number) || 0.5
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
      shape: planck.Circle(this.radius),
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
    const screenRadius = this.radius * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    ctx.fillStyle = this.color
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(screenRadius * 0.8, 0)
    ctx.strokeStyle = '#ffcc00'
    ctx.stroke()
    
    if (showDebug) {
      this.renderDebugInfo(ctx)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
    if (!this.body) return
    
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-40, -60, 80, 40)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`速度: ${speed.toFixed(1)}`, 0, -45)
    ctx.fillText(`应力: ${this.getStress().toFixed(1)}`, 0, -30)
  }

  getStress(): number {
    if (!this.body) return 0
    
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    const angularSpeed = Math.abs(this.body.getAngularVelocity())
    
    return speed + angularSpeed * 0.5
  }

  getRadius(): number {
    return this.radius
  }

  setRadius(radius: number): void {
    this.radius = radius
  }
}
