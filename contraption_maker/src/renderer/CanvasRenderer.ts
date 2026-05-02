import * as planck from 'planck-js'
import { Camera } from './Camera'
import { BaseEntity } from '../entities'
import { EntitySnapshot, FrameSnapshot } from '../types'

interface RendererConfig {
  backgroundColor: string
  gridColor: string
  gridSpacing: number
  showGrid: boolean
  showDebug: boolean
  scale: number
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private config: RendererConfig

  constructor(canvas: HTMLCanvasElement, config?: Partial<RendererConfig>) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D rendering context')
    }
    this.ctx = ctx
    this.camera = new Camera()
    
    this.config = {
      backgroundColor: '#1a1a2e',
      gridColor: 'rgba(255, 255, 255, 0.1)',
      gridSpacing: 1.0,
      showGrid: true,
      showDebug: false,
      scale: 30.0,
      ...config,
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  getCamera(): Camera {
    return this.camera
  }

  setCamera(camera: Camera): void {
    this.camera = camera.clone()
  }

  getConfig(): RendererConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...config }
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.ctx.scale(dpr, dpr)
  }

  clear(): void {
    this.ctx.fillStyle = this.config.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1))
  }

  drawGrid(): void {
    if (!this.config.showGrid) return

    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }

    const scale = this.config.scale * this.camera.getZoom()
    const gridSpacing = this.config.gridSpacing * scale

    const cameraPos = this.camera.getPosition()
    const offsetX = -cameraPos.x * scale + canvasSize.width / 2
    const offsetY = -cameraPos.y * scale + canvasSize.height / 2

    this.ctx.strokeStyle = this.config.gridColor
    this.ctx.lineWidth = 1

    const startX = Math.floor((0 - offsetX) / gridSpacing) * gridSpacing + offsetX
    const startY = Math.floor((0 - offsetY) / gridSpacing) * gridSpacing + offsetY

    for (let x = startX; x < canvasSize.width; x += gridSpacing) {
      if (x >= 0) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, canvasSize.height)
        this.ctx.stroke()
      }
    }

    for (let x = startX - gridSpacing; x > 0; x -= gridSpacing) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, canvasSize.height)
      this.ctx.stroke()
    }

    for (let y = startY; y < canvasSize.height; y += gridSpacing) {
      if (y >= 0) {
        this.ctx.beginPath()
        this.ctx.moveTo(0, y)
        this.ctx.lineTo(canvasSize.width, y)
        this.ctx.stroke()
      }
    }

    for (let y = startY - gridSpacing; y > 0; y -= gridSpacing) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(canvasSize.width, y)
      this.ctx.stroke()
    }

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 2

    const originScreen = this.camera.worldToScreen(planck.Vec2(0, 0), canvasSize)
    if (originScreen.x >= 0 && originScreen.x <= canvasSize.width) {
      this.ctx.beginPath()
      this.ctx.moveTo(originScreen.x, 0)
      this.ctx.lineTo(originScreen.x, canvasSize.height)
      this.ctx.stroke()
    }

    if (originScreen.y >= 0 && originScreen.y <= canvasSize.height) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, originScreen.y)
      this.ctx.lineTo(canvasSize.width, originScreen.y)
      this.ctx.stroke()
    }
  }

  renderEntities(entities: BaseEntity[]): void {
    const scale = this.config.scale * this.camera.getZoom()
    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }

    const cameraPos = this.camera.getPosition()
    const offsetX = -cameraPos.x * this.config.scale * this.camera.getZoom() + canvasSize.width / 2
    const offsetY = -cameraPos.y * this.config.scale * this.camera.getZoom() + canvasSize.height / 2

    this.ctx.save()
    this.ctx.translate(offsetX, offsetY)

    entities.forEach((entity) => {
      entity.render(this.ctx, scale, this.config.showDebug)
    })

    this.ctx.restore()
  }

  renderSnapshot(snapshot: FrameSnapshot): void {
    const scale = this.config.scale * this.camera.getZoom()
    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }

    const cameraPos = this.camera.getPosition()
    const offsetX = -cameraPos.x * this.config.scale * this.camera.getZoom() + canvasSize.width / 2
    const offsetY = -cameraPos.y * this.config.scale * this.camera.getZoom() + canvasSize.height / 2

    this.ctx.save()
    this.ctx.translate(offsetX, offsetY)

    snapshot.entities.forEach((entitySnapshot) => {
      this.renderEntitySnapshot(entitySnapshot, scale)
    })

    this.ctx.restore()
  }

  private renderEntitySnapshot(snapshot: EntitySnapshot, scale: number): void {
    const screenX = snapshot.position.x * scale
    const screenY = snapshot.position.y * scale

    this.ctx.save()
    this.ctx.translate(screenX, screenY)
    this.ctx.rotate(snapshot.angle)

    this.ctx.fillStyle = this.getStressColor(snapshot.stress)
    this.ctx.globalAlpha = 0.7
    this.ctx.beginPath()
    this.ctx.arc(0, 0, 15, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.globalAlpha = 1.0
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`S: ${snapshot.stress.toFixed(1)}`, 0, 4)

    this.ctx.restore()
  }

  private getStressColor(stress: number): string {
    const normalizedStress = Math.min(stress / 10, 1)
    const r = Math.floor(255 * normalizedStress)
    const g = Math.floor(255 * (1 - normalizedStress))
    const b = 100

    return `rgb(${r}, ${g}, ${b})`
  }

  renderCoordinateSystem(): void {
    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }

    const origin = this.camera.worldToScreen(planck.Vec2(0, 0), canvasSize)
    const axisLength = 50

    this.ctx.save()

    this.ctx.strokeStyle = '#ff4444'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(origin.x, origin.y)
    this.ctx.lineTo(origin.x + axisLength, origin.y)
    this.ctx.stroke()

    this.ctx.fillStyle = '#ff4444'
    this.ctx.font = '12px Arial'
    this.ctx.fillText('X', origin.x + axisLength + 5, origin.y + 4)

    this.ctx.strokeStyle = '#44ff44'
    this.ctx.beginPath()
    this.ctx.moveTo(origin.x, origin.y)
    this.ctx.lineTo(origin.x, origin.y + axisLength)
    this.ctx.stroke()

    this.ctx.fillStyle = '#44ff44'
    this.ctx.fillText('Y', origin.x - 10, origin.y + axisLength + 15)

    this.ctx.restore()
  }

  renderHUD(): void {
    this.ctx.save()

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 10, 200, 60)

    this.ctx.fillStyle = '#fff'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'left'

    const cameraPos = this.camera.getPosition()
    this.ctx.fillText(`位置: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)})`, 20, 30)
    this.ctx.fillText(`缩放: ${this.camera.getZoom().toFixed(2)}x`, 20, 50)
    this.ctx.fillText(`像素/单位: ${(this.config.scale * this.camera.getZoom()).toFixed(1)}`, 20, 70)

    this.ctx.restore()
  }

  render(entities: BaseEntity[]): void {
    this.clear()
    this.drawGrid()
    
    if (this.config.showDebug) {
      this.renderCoordinateSystem()
    }
    
    this.renderEntities(entities)
    this.renderHUD()
  }

  screenToWorld(screenPoint: { x: number; y: number }): planck.Vec2 {
    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }
    return this.camera.screenToWorld(screenPoint, canvasSize)
  }

  worldToScreen(worldPoint: planck.Vec2): { x: number; y: number } {
    const canvasSize = {
      width: this.canvas.width / (window.devicePixelRatio || 1),
      height: this.canvas.height / (window.devicePixelRatio || 1),
    }
    return this.camera.worldToScreen(worldPoint, canvasSize)
  }
}
