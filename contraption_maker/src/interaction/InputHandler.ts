interface MouseEventData {
  screenX: number
  screenY: number
  button: number
  modifiers: {
    ctrl: boolean
    shift: boolean
    alt: boolean
  }
}

interface WheelEventData {
  deltaX: number
  deltaY: number
  deltaMode: number
  screenX: number
  screenY: number
}

export type MouseEventHandler = (event: MouseEventData) => void
export type WheelEventHandler = (event: WheelEventData) => void
export type KeyboardEventHandler = (key: string, modifiers: { ctrl: boolean; shift: boolean; alt: boolean }) => void

export class InputHandler {
  private canvas: HTMLCanvasElement
  private isMouseDown: boolean = false
  private mouseButton: number = 0
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private keys: Set<string> = new Set()

  private onMouseDownHandlers: MouseEventHandler[] = []
  private onMouseUpHandlers: MouseEventHandler[] = []
  private onMouseMoveHandlers: MouseEventHandler[] = []
  private onMouseLeaveHandlers: MouseEventHandler[] = []
  private onWheelHandlers: WheelEventHandler[] = []
  private onKeyDownHandlers: KeyboardEventHandler[] = []
  private onKeyUpHandlers: KeyboardEventHandler[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.attachEventListeners()
  }

  private attachEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false })
    
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private getEventModifiers(e: MouseEvent | KeyboardEvent): { ctrl: boolean; shift: boolean; alt: boolean } {
    return {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    this.isMouseDown = true
    this.mouseButton = e.button
    this.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const eventData: MouseEventData = {
      screenX: this.mousePosition.x,
      screenY: this.mousePosition.y,
      button: e.button,
      modifiers: this.getEventModifiers(e),
    }

    this.onMouseDownHandlers.forEach((handler) => handler(eventData))
  }

  private handleMouseUp(e: MouseEvent): void {
    e.preventDefault()
    this.isMouseDown = false
    const rect = this.canvas.getBoundingClientRect()
    this.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const eventData: MouseEventData = {
      screenX: this.mousePosition.x,
      screenY: this.mousePosition.y,
      button: e.button,
      modifiers: this.getEventModifiers(e),
    }

    this.onMouseUpHandlers.forEach((handler) => handler(eventData))
  }

  private handleMouseMove(e: MouseEvent): void {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    this.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    const eventData: MouseEventData = {
      screenX: this.mousePosition.x,
      screenY: this.mousePosition.y,
      button: this.mouseButton,
      modifiers: this.getEventModifiers(e),
    }

    this.onMouseMoveHandlers.forEach((handler) => handler(eventData))
  }

  private handleMouseLeave(e: MouseEvent): void {
    e.preventDefault()
    this.isMouseDown = false

    const eventData: MouseEventData = {
      screenX: this.mousePosition.x,
      screenY: this.mousePosition.y,
      button: this.mouseButton,
      modifiers: this.getEventModifiers(e),
    }

    this.onMouseLeaveHandlers.forEach((handler) => handler(eventData))
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()

    const eventData: WheelEventData = {
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaMode: e.deltaMode,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    }

    this.onWheelHandlers.forEach((handler) => handler(eventData))
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase())

    const modifiers = this.getEventModifiers(e)
    this.onKeyDownHandlers.forEach((handler) => handler(e.key, modifiers))
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase())

    const modifiers = this.getEventModifiers(e)
    this.onKeyUpHandlers.forEach((handler) => handler(e.key, modifiers))
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase())
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition }
  }

  isMousePressed(): boolean {
    return this.isMouseDown
  }

  onMouseDown(handler: MouseEventHandler): void {
    this.onMouseDownHandlers.push(handler)
  }

  onMouseUp(handler: MouseEventHandler): void {
    this.onMouseUpHandlers.push(handler)
  }

  onMouseMove(handler: MouseEventHandler): void {
    this.onMouseMoveHandlers.push(handler)
  }

  onMouseLeave(handler: MouseEventHandler): void {
    this.onMouseLeaveHandlers.push(handler)
  }

  onWheel(handler: WheelEventHandler): void {
    this.onWheelHandlers.push(handler)
  }

  onKeyDown(handler: KeyboardEventHandler): void {
    this.onKeyDownHandlers.push(handler)
  }

  onKeyUp(handler: KeyboardEventHandler): void {
    this.onKeyUpHandlers.push(handler)
  }

  removeMouseDownHandler(handler: MouseEventHandler): void {
    this.onMouseDownHandlers = this.onMouseDownHandlers.filter((h) => h !== handler)
  }

  removeMouseUpHandler(handler: MouseEventHandler): void {
    this.onMouseUpHandlers = this.onMouseUpHandlers.filter((h) => h !== handler)
  }

  removeMouseMoveHandler(handler: MouseEventHandler): void {
    this.onMouseMoveHandlers = this.onMouseMoveHandlers.filter((h) => h !== handler)
  }

  removeMouseLeaveHandler(handler: MouseEventHandler): void {
    this.onMouseLeaveHandlers = this.onMouseLeaveHandlers.filter((h) => h !== handler)
  }

  removeWheelHandler(handler: WheelEventHandler): void {
    this.onWheelHandlers = this.onWheelHandlers.filter((h) => h !== handler)
  }

  removeKeyDownHandler(handler: KeyboardEventHandler): void {
    this.onKeyDownHandlers = this.onKeyDownHandlers.filter((h) => h !== handler)
  }

  removeKeyUpHandler(handler: KeyboardEventHandler): void {
    this.onKeyUpHandlers = this.onKeyUpHandlers.filter((h) => h !== handler)
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    
    this.onMouseDownHandlers = []
    this.onMouseUpHandlers = []
    this.onMouseMoveHandlers = []
    this.onMouseLeaveHandlers = []
    this.onWheelHandlers = []
    this.onKeyDownHandlers = []
    this.onKeyUpHandlers = []
  }
}
