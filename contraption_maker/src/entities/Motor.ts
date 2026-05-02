import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Motor extends BaseEntity {
  private radius: number
  private speed: number
  private maxTorque: number
  private isEnabled: boolean = true
  private bodyWidth: number
  private bodyHeight: number
  
  constructor(props: EntityProps) {
    super(props)
    this.radius = (props.properties.radius as number) || 0.5
    this.speed = (props.properties.speed as number) || 2.0
    this.maxTorque = (props.properties.maxTorque as number) || 100.0
    this.bodyWidth = this.radius * 2.5
    this.bodyHeight = this.radius * 1.5
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
      shape: planck.Box(this.bodyWidth / 2, this.bodyHeight / 2),
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
    const screenRadius = this.radius * scale
    const screenBodyWidth = this.bodyWidth * scale
    const screenBodyHeight = this.bodyHeight * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    const gradient = ctx.createLinearGradient(0, -screenBodyHeight / 2, 0, screenBodyHeight / 2)
    gradient.addColorStop(0, '#8e44ad')
    gradient.addColorStop(1, '#6c3483')
    
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#9b59b6'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.roundRect(-screenBodyWidth / 2, -screenBodyHeight / 2, screenBodyWidth, screenBodyHeight, 5)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = this.isEnabled ? '#f1c40f' : '#7f8c8d'
    ctx.strokeStyle = '#d4ac0d'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    if (this.isEnabled) {
      ctx.strokeStyle = '#e67e22'
      ctx.lineWidth = 3
      const indicatorAngle = performance.now() / 500 * this.speed
      ctx.beginPath()
      ctx.arc(0, 0, screenRadius * 0.6, indicatorAngle, indicatorAngle + Math.PI)
      ctx.stroke()
    }
    
    ctx.fillStyle = '#2c3e50'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ecf0f1'
    ctx.font = `${screenRadius * 0.4}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', 0, 0)
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.body) return
    
    const screenBodyHeight = this.bodyHeight * scale
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-60, -screenBodyHeight / 2 - 45, 120, 35)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`速度: ${this.speed.toFixed(1)}`, 0, -screenBodyHeight / 2 - 31)
    ctx.fillText(`扭矩: ${this.maxTorque.toFixed(0)}`, 0, -screenBodyHeight / 2 - 19)
    ctx.fillText(`状态: ${this.isEnabled ? '开启' : '关闭'}`, 0, -screenBodyHeight / 2 - 7)
  }

  getStress(): number {
    if (!this.isEnabled) return 0
    return Math.abs(this.speed) * 0.5
  }

  getSpeed(): number {
    return this.speed
  }

  setSpeed(speed: number): void {
    this.speed = speed
  }

  getMaxTorque(): number {
    return this.maxTorque
  }

  setMaxTorque(torque: number): void {
    this.maxTorque = torque
  }

  getIsEnabled(): boolean {
    return this.isEnabled
  }

  setIsEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  getRadius(): number {
    return this.radius
  }
}
