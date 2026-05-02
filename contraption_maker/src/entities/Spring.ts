import * as planck from 'planck-js'
import { BaseEntity } from './BaseEntity'
import { EntityProps } from '../types'

export class Spring extends BaseEntity {
  private restLength: number
  private stiffness: number
  private damping: number
  private width: number = 0.2
  private color: string = '#ff6b9d'
  private coils: number = 8
  
  constructor(props: EntityProps) {
    super(props)
    this.restLength = (props.properties.restLength as number) || 2.0
    this.stiffness = (props.properties.stiffness as number) || 50.0
    this.damping = (props.properties.damping as number) || 0.5
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
      shape: planck.Box(this.restLength / 2, this.width / 2),
      density: this.density * 0.5,
      friction: this.friction,
      restitution: this.restitution,
      isSensor: true,
    }
    
    this.body.createFixture(fixtureDef)
  }

  render(ctx: CanvasRenderingContext2D, scale: number, showDebug: boolean): void {
    if (!this.body) return
    
    const position = this.body.getPosition()
    const angle = this.body.getAngle()
    const screenX = position.x * scale
    const screenY = position.y * scale
    const screenLength = this.restLength * scale
    const screenWidth = this.width * scale
    
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angle)
    
    ctx.strokeStyle = this.color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    
    const coilSpacing = screenLength / (this.coils + 2)
    const coilAmplitude = screenWidth * 2
    
    ctx.beginPath()
    
    ctx.moveTo(-screenLength / 2, 0)
    ctx.lineTo(-screenLength / 2 + coilSpacing, 0)
    
    for (let i = 0; i < this.coils; i++) {
      const x = -screenLength / 2 + coilSpacing * (i + 1)
      const nextX = x + coilSpacing
      
      ctx.quadraticCurveTo(
        (x + nextX) / 2,
        i % 2 === 0 ? -coilAmplitude : coilAmplitude,
        nextX,
        0
      )
    }
    
    ctx.lineTo(screenLength / 2, 0)
    ctx.stroke()
    
    ctx.fillStyle = '#8b0000'
    ctx.beginPath()
    ctx.arc(-screenLength / 2, 0, screenWidth * 0.8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(screenLength / 2, 0, screenWidth * 0.8, 0, Math.PI * 2)
    ctx.fill()
    
    if (showDebug) {
      this.renderDebugInfo(ctx, scale)
    }
    
    ctx.restore()
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D, _scale: number): void {
    if (!this.body) return
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-60, -30, 120, 25)
    
    ctx.fillStyle = '#fff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`刚度: ${this.stiffness.toFixed(0)}`, 0, -16)
    ctx.fillText(`应力: ${this.getStress().toFixed(1)}`, 0, -4)
  }

  getStress(): number {
    if (!this.body) return 0
    
    const velocity = this.body.getLinearVelocity()
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    const angularSpeed = Math.abs(this.body.getAngularVelocity())
    
    return speed * 2 + angularSpeed
  }

  getRestLength(): number {
    return this.restLength
  }

  setRestLength(length: number): void {
    this.restLength = length
  }

  getStiffness(): number {
    return this.stiffness
  }

  setStiffness(stiffness: number): void {
    this.stiffness = stiffness
  }

  getDamping(): number {
    return this.damping
  }

  setDamping(damping: number): void {
    this.damping = damping
  }
}
