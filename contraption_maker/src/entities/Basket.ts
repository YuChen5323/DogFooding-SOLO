import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Basket extends BaseEntity {
  private width: number
  private height: number
  private color: string = '#27ae60'
  private hasBall: boolean = false
  
  constructor(props: EntityProps) {
    super({
      ...props,
      isStatic: true,
    })
    this.width = (props.properties.width as number) || 2.0
    this.height = (props.properties.height as number) || 1.0
  }

  createBody(world: planck.World, position: planck.Vec2, angle: number): void {
    this.world = world
    const bodyDef: planck.BodyDef = {
      type: 'static',
      position: position,
      angle: angle,
    }
    
    this.body = world.createBody(bodyDef)
    
    const bottomFixtureDef: planck.FixtureDef = {
      shape: planck.Box(this.width / 2, 0.1, planck.Vec2(0, this.height / 2 - 0.1), 0),
      density: 0,
      friction: this.friction,
      restitution: this.restitution,
    }
    this.body.createFixture(bottomFixtureDef)
    
    const leftFixtureDef: planck.FixtureDef = {
      shape: planck.Box(0.1, this.height / 2, planck.Vec2(-this.width / 2 + 0.1, 0), 0),
      density: 0,
      friction: this.friction,
      restitution: this.restitution,
    }
    this.body.createFixture(leftFixtureDef)
    
    const rightFixtureDef: planck.FixtureDef = {
      shape: planck.Box(0.1, this.height / 2, planck.Vec2(this.width / 2 - 0.1, 0), 0),
      density: 0,
      friction: this.friction,
      restitution: this.restitution,
    }
    this.body.createFixture(rightFixtureDef)
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
    
    ctx.strokeStyle = this.hasBall ? '#f39c12' : this.color
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    
    ctx.beginPath()
    ctx.moveTo(-screenWidth / 2, -screenHeight / 2)
    ctx.lineTo(-screenWidth / 2, screenHeight / 2)
    ctx.lineTo(screenWidth / 2, screenHeight / 2)
    ctx.lineTo(screenWidth / 2, -screenHeight / 2)
    ctx.stroke()
    
    ctx.strokeStyle = this.hasBall ? '#e67e22' : '#2ecc71'
    ctx.lineWidth = 1
    
    const netSpacing = 15
    for (let i = -screenWidth / 2 + netSpacing; i < screenWidth / 2; i += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(i, -screenHeight / 2)
      ctx.lineTo(i, screenHeight / 2)
      ctx.stroke()
    }
    
    for (let i = -screenHeight / 2 + netSpacing; i < screenHeight / 2; i += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(-screenWidth / 2, i)
      ctx.lineTo(screenWidth / 2, i)
      ctx.stroke()
    }
    
    if (this.hasBall) {
      ctx.fillStyle = 'rgba(243, 156, 18, 0.3)'
      ctx.fillRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight)
      
      ctx.fillStyle = '#f39c12'
      ctx.font = `${screenWidth * 0.15}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('✓', 0, 0)
    }
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.body) return
    
    const screenHeight = this.height * scale
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-50, -screenHeight - 30, 100, 20)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`篮子: ${this.hasBall ? '有球' : '空'}`, 0, -screenHeight - 16)
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

  setHasBall(hasBall: boolean): void {
    this.hasBall = hasBall
  }

  getHasBall(): boolean {
    return this.hasBall
  }

  containsPosition(pos: planck.Vec2): boolean {
    if (!this.body) return false
    
    const bodyPos = this.body.getPosition()
    const bodyAngle = this.body.getAngle()
    
    const dx = pos.x - bodyPos.x
    const dy = pos.y - bodyPos.y
    
    const cos = Math.cos(-bodyAngle)
    const sin = Math.sin(-bodyAngle)
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos
    
    return (
      Math.abs(localX) < this.width / 2 - 0.2 &&
      localY > -this.height / 2 + 0.2 &&
      localY < this.height / 2 - 0.2
    )
  }
}
