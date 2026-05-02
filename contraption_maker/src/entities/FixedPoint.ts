import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class FixedPoint extends BaseEntity {
  private radius: number = 0.3
  
  constructor(props: EntityProps) {
    super({
      ...props,
      isStatic: true,
    })
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
    
    ctx.fillStyle = '#4a5568'
    ctx.strokeStyle = '#a0aec0'
    ctx.lineWidth = 3
    
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#2d3748'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#718096'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.8, 0, Math.PI * 2)
    ctx.stroke()
    
    if (showDebug) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(-40, -40, 80, 20)
      
      ctx.fillStyle = '#fff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('固定点', 0, -26)
    }
    
    ctx.restore()
  }

  getStress(): number {
    return 0
  }

  getRadius(): number {
    return this.radius
  }
}
