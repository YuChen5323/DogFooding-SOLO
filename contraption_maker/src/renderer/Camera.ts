import * as planck from 'planck-js'

export class Camera {
  private position: planck.Vec2
  private zoom: number
  private minZoom: number = 0.1
  private maxZoom: number = 10.0
  private zoomSpeed: number = 0.1

  constructor(position: planck.Vec2 = planck.Vec2(0, 0), zoom: number = 1.0) {
    this.position = position.clone()
    this.zoom = zoom
  }

  getPosition(): planck.Vec2 {
    return this.position.clone()
  }

  setPosition(position: planck.Vec2): void {
    this.position = position.clone()
  }

  translate(delta: planck.Vec2): void {
    this.position.add(delta)
  }

  getZoom(): number {
    return this.zoom
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
  }

  zoomIn(factor: number = 1.0): void {
    this.setZoom(this.zoom * (1 + this.zoomSpeed * factor))
  }

  zoomOut(factor: number = 1.0): void {
    this.setZoom(this.zoom / (1 + this.zoomSpeed * factor))
  }

  zoomAtPoint(screenPoint: { x: number; y: number }, canvasSize: { width: number; height: number }, zoomFactor: number): void {
    const worldPointBefore = this.screenToWorld(screenPoint, canvasSize)
    
    if (zoomFactor > 0) {
      this.zoomIn(zoomFactor)
    } else {
      this.zoomOut(Math.abs(zoomFactor))
    }
    
    const worldPointAfter = this.screenToWorld(screenPoint, canvasSize)
    
    const delta = planck.Vec2(
      worldPointBefore.x - worldPointAfter.x,
      worldPointBefore.y - worldPointAfter.y
    )
    this.translate(delta)
  }

  screenToWorld(screenPoint: { x: number; y: number }, canvasSize: { width: number; height: number }): planck.Vec2 {
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2
    
    const relativeX = (screenPoint.x - centerX) / this.zoom
    const relativeY = (screenPoint.y - centerY) / this.zoom
    
    return planck.Vec2(
      this.position.x + relativeX,
      this.position.y + relativeY
    )
  }

  worldToScreen(worldPoint: planck.Vec2, canvasSize: { width: number; height: number }): { x: number; y: number } {
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2
    
    const relativeX = (worldPoint.x - this.position.x) * this.zoom
    const relativeY = (worldPoint.y - this.position.y) * this.zoom
    
    return {
      x: centerX + relativeX,
      y: centerY + relativeY,
    }
  }

  getMinZoom(): number {
    return this.minZoom
  }

  setMinZoom(min: number): void {
    this.minZoom = Math.max(0.01, min)
  }

  getMaxZoom(): number {
    return this.maxZoom
  }

  setMaxZoom(max: number): void {
    this.maxZoom = Math.max(0.1, max)
  }

  getZoomSpeed(): number {
    return this.zoomSpeed
  }

  setZoomSpeed(speed: number): void {
    this.zoomSpeed = Math.max(0.01, speed)
  }

  reset(): void {
    this.position = planck.Vec2(0, 0)
    this.zoom = 1.0
  }

  clone(): Camera {
    return new Camera(this.position.clone(), this.zoom)
  }
}
