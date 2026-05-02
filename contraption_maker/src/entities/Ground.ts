import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Ground extends BaseEntity {
  private width: number
  private height: number
  
  constructor(props: EntityProps) {
    super({
      ...props,
      isStatic: true,
    })
    this.width = (props.properties.width as number) || 50
    this.height = (props.properties.height as number) || 1
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
      shape: planck.Box(this.width / 2, this.height / 2),
      density: 0,
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
    const screenWidth = this.width * scale
    const screenHeight = this.height * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    const gradient = ctx.createLinearGradient(0, -screenHeight / 2, 0, screenHeight / 2)
    gradient.addColorStop(0, '#4a5568')
    gradient.addColorStop(1, '#2d3748')
    
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#718096'
    ctx.lineWidth = 2
    
    ctx.fillRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight)
    ctx.strokeRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight)
    
    ctx.strokeStyle = '#5a6878'
    ctx.lineWidth = 1
    for (let i = 0; i < screenWidth; i += 20) {
      ctx.beginPath()
      ctx.moveTo(-screenWidth / 2 + i, -screenHeight / 2)
      ctx.lineTo(-screenWidth / 2 + i + 10, 0)
      ctx.stroke()
    }
    
    if (showDebug) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(-40, -screenHeight - 25, 80, 20)
      
      ctx.fillStyle = '#fff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('地面', 0, -screenHeight - 11)
    }
    
    ctx.restore()
  }

  getStress(): number {
    return 0
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}
