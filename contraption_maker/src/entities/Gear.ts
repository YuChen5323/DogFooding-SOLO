import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Gear extends BaseEntity {
  private radius: number
  private teethCount: number
  private toothHeight: number = 0.1
  private color: string = '#4ecdc4'
  
  constructor(props: EntityProps) {
    super(props)
    this.radius = (props.properties.radius as number) || 1.0
    this.teethCount = (props.properties.teethCount as number) || 20
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
    const screenToothHeight = this.toothHeight * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    ctx.fillStyle = this.color
    ctx.strokeStyle = '#2d9a93'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = '#3db8b0'
    ctx.strokeStyle = '#2d9a93'
    ctx.lineWidth = 1
    
    for (let i = 0; i < this.teethCount; i++) {
      const toothAngle = (i / this.teethCount) * Math.PI * 2
      const nextToothAngle = ((i + 0.7) / this.teethCount) * Math.PI * 2
      
      const innerX1 = Math.cos(toothAngle) * screenRadius
      const innerY1 = Math.sin(toothAngle) * screenRadius
      const outerX1 = Math.cos(toothAngle) * (screenRadius + screenToothHeight)
      const outerY1 = Math.sin(toothAngle) * (screenRadius + screenToothHeight)
      
      const innerX2 = Math.cos(nextToothAngle) * screenRadius
      const innerY2 = Math.sin(nextToothAngle) * screenRadius
      const outerX2 = Math.cos(nextToothAngle) * (screenRadius + screenToothHeight)
      const outerY2 = Math.sin(nextToothAngle) * (screenRadius + screenToothHeight)
      
      ctx.beginPath()
      ctx.moveTo(innerX1, innerY1)
      ctx.lineTo(outerX1, outerY1)
      ctx.lineTo(outerX2, outerY2)
      ctx.lineTo(innerX2, innerY2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    
    ctx.fillStyle = '#2d9a93'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.3, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#1a6b65'
    ctx.beginPath()
    ctx.arc(0, 0, screenRadius * 0.15, 0, Math.PI * 2)
    ctx.fill()
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, scale: number): void {
    if (!this.body) return
    
    const angularVelocity = this.body.getAngularVelocity()
    
    const screenRadius = this.radius * scale
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-50, -screenRadius - 50, 100, 40)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`角速度: ${angularVelocity.toFixed(1)}`, 0, -screenRadius - 35)
    ctx.fillText(`应力: ${this.getStress().toFixed(1)}`, 0, -screenRadius - 20)
  }

  getStress(): number {
    if (!this.body) return 0
    
    const angularSpeed = Math.abs(this.body.getAngularVelocity())
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    
    return angularSpeed * 0.5 + speed
  }

  getRadius(): number {
    return this.radius
  }

  setRadius(radius: number): void {
    this.radius = radius
  }

  getTeethCount(): number {
    return this.teethCount
  }

  setTeethCount(count: number): void {
    this.teethCount = count
  }
}
