import * as planck from 'planck-js'
import type { RevoluteJointDef } from 'planck-js'
import { InputHandler } from './InputHandler'
import { CanvasRenderer } from '../renderer'
import { EntityManager, EntityFactory, BaseEntity } from '../entities'
import { EntityType } from '../types'

const RevoluteJointCtor = (planck as any).RevoluteJoint

enum EditorMode {
  SELECT = 'select',
  PLACE = 'place',
  CONNECT = 'connect',
  PAN = 'pan',
}

interface EditorState {
  mode: EditorMode
  selectedEntity: BaseEntity | null
  placingEntityType: EntityType | null
  connectingFromEntity: BaseEntity | null
  isDragging: boolean
  dragStartScreen: { x: number; y: number } | null
  dragStartWorld: planck.Vec2 | null
  cameraStartPosition: planck.Vec2 | null
}

export class SceneEditor {
  private renderer: CanvasRenderer
  private entityManager: EntityManager
  private inputHandler: InputHandler
  private state: EditorState
  private world: planck.World | null = null

  constructor(
    renderer: CanvasRenderer,
    entityManager: EntityManager,
    inputHandler: InputHandler
  ) {
    this.renderer = renderer
    this.entityManager = entityManager
    this.inputHandler = inputHandler
    this.state = {
      mode: EditorMode.SELECT,
      selectedEntity: null,
      placingEntityType: null,
      connectingFromEntity: null,
      isDragging: false,
      dragStartScreen: null,
      dragStartWorld: null,
      cameraStartPosition: null,
    }

    this.setupEventHandlers()
  }

  setWorld(world: planck.World): void {
    this.world = world
  }

  private setupEventHandlers(): void {
    this.inputHandler.onMouseDown(this.handleMouseDown.bind(this))
    this.inputHandler.onMouseUp(this.handleMouseUp.bind(this))
    this.inputHandler.onMouseMove(this.handleMouseMove.bind(this))
    this.inputHandler.onWheel(this.handleWheel.bind(this))
    this.inputHandler.onKeyDown(this.handleKeyDown.bind(this))
  }

  private handleMouseDown(e: { screenX: number; screenY: number; button: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean } }): void {
    const screenPos = { x: e.screenX, y: e.screenY }
    const worldPos = this.renderer.screenToWorld(screenPos)

    if (e.modifiers.alt || e.button === 1) {
      this.state.mode = EditorMode.PAN
      this.state.isDragging = true
      this.state.dragStartScreen = screenPos
      this.state.cameraStartPosition = this.renderer.getCamera().getPosition()
      return
    }

    switch (this.state.mode) {
      case EditorMode.SELECT:
        this.handleSelectMouseDown(worldPos, e)
        break
      case EditorMode.PLACE:
        this.handlePlaceMouseDown(worldPos)
        break
      case EditorMode.CONNECT:
        this.handleConnectMouseDown(worldPos)
        break
    }
  }

  private handleMouseUp(e: { screenX: number; screenY: number; button: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean } }): void {
    const screenPos = { x: e.screenX, y: e.screenY }
    const worldPos = this.renderer.screenToWorld(screenPos)

    if (this.state.mode === EditorMode.PAN) {
      this.state.isDragging = false
      this.state.dragStartScreen = null
      this.state.cameraStartPosition = null
      this.state.mode = EditorMode.SELECT
      return
    }

    switch (this.state.mode) {
      case EditorMode.SELECT:
        this.handleSelectMouseUp()
        break
      case EditorMode.CONNECT:
        this.handleConnectMouseUp(worldPos)
        break
    }
  }

  private handleMouseMove(e: { screenX: number; screenY: number; button: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean } }): void {
    const screenPos = { x: e.screenX, y: e.screenY }
    const worldPos = this.renderer.screenToWorld(screenPos)

    if (this.state.mode === EditorMode.PAN && this.state.isDragging) {
      this.handlePanMouseMove(screenPos)
      return
    }

    if (this.state.isDragging && this.state.selectedEntity) {
      this.handleDragMouseMove(worldPos)
      return
    }
  }

  private handleWheel(e: { deltaX: number; deltaY: number; deltaMode: number; screenX: number; screenY: number }): void {
    const zoomFactor = e.deltaY > 0 ? -1 : 1
    const screenPos = { x: e.screenX, y: e.screenY }
    const canvasSize = {
      width: this.renderer.getCanvas().width / (window.devicePixelRatio || 1),
      height: this.renderer.getCanvas().height / (window.devicePixelRatio || 1),
    }

    const camera = this.renderer.getCamera()
    camera.zoomAtPoint(screenPos, canvasSize, zoomFactor)
  }

  private handleKeyDown(key: string, _modifiers: { ctrl: boolean; shift: boolean; alt: boolean }): void {
    switch (key.toLowerCase()) {
      case 's':
        this.setMode(EditorMode.SELECT)
        break
      case 'p':
        if (this.state.placingEntityType) {
          this.setMode(EditorMode.PLACE)
        }
        break
      case 'c':
        this.setMode(EditorMode.CONNECT)
        break
      case 'delete':
      case 'backspace':
        if (this.state.selectedEntity) {
          this.entityManager.removeEntity(this.state.selectedEntity.getId())
          this.state.selectedEntity = null
        }
        break
      case 'escape':
        this.cancelCurrentAction()
        break
    }
  }

  private handleSelectMouseDown(worldPos: planck.Vec2, e: { button: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean } }): void {
    const entity = this.entityManager.findEntityAtPosition(worldPos)
    
    if (entity) {
      if (e.modifiers.shift) {
        if (this.state.selectedEntity === entity) {
          this.state.selectedEntity = null
        }
      } else {
        this.state.selectedEntity = entity
        this.state.isDragging = true
        this.state.dragStartWorld = worldPos.clone()
      }
    } else if (!e.modifiers.shift) {
      this.state.selectedEntity = null
    }
  }

  private handleSelectMouseUp(): void {
    if (this.state.isDragging) {
      this.state.isDragging = false
      this.state.dragStartWorld = null
    }
  }

  private handleDragMouseMove(worldPos: planck.Vec2): void {
    if (!this.state.selectedEntity || !this.state.dragStartWorld) return
    
    const body = this.state.selectedEntity.getBody()
    if (body && !body.isStatic()) {
      const delta = planck.Vec2(
        worldPos.x - this.state.dragStartWorld.x,
        worldPos.y - this.state.dragStartWorld.y
      )
      
      const currentPos = body.getPosition()
      body.setTransform(
        planck.Vec2(currentPos.x + delta.x, currentPos.y + delta.y),
        body.getAngle()
      )
      
      this.state.dragStartWorld = worldPos.clone()
    }
  }

  private handlePlaceMouseDown(worldPos: planck.Vec2): void {
    if (!this.state.placingEntityType) return
    
    const entity = EntityFactory.createDefaultEntity(this.state.placingEntityType, worldPos)
    
    if (this.world) {
      this.entityManager.setWorld(this.world)
      this.entityManager.addEntity(entity, worldPos, 0)
    }
    
    this.state.selectedEntity = entity
  }

  private handleConnectMouseDown(worldPos: planck.Vec2): void {
    const entity = this.entityManager.findEntityAtPosition(worldPos)
    
    if (entity && !this.state.connectingFromEntity) {
      this.state.connectingFromEntity = entity
      this.state.isDragging = true
    }
  }

  private handleConnectMouseUp(worldPos: planck.Vec2): void {
    if (!this.state.connectingFromEntity || !this.world) {
      this.state.isDragging = false
      return
    }
    
    const targetEntity = this.entityManager.findEntityAtPosition(worldPos)
    
    if (targetEntity && targetEntity !== this.state.connectingFromEntity) {
      const bodyA = this.state.connectingFromEntity.getBody()
      const bodyB = targetEntity.getBody()
      
      if (bodyA && bodyB) {
        const midpoint = planck.Vec2(
          (bodyA.getPosition().x + bodyB.getPosition().x) / 2,
          (bodyA.getPosition().y + bodyB.getPosition().y) / 2
        )
        
        try {
          const jointDef: RevoluteJointDef = {
            bodyA: bodyA,
            bodyB: bodyB,
            localAnchorA: midpoint,
            localAnchorB: midpoint,
            referenceAngle: 0,
          }
          this.world.createJoint(RevoluteJointCtor(jointDef))
        } catch (e) {
          console.error('Failed to create joint:', e)
        }
      }
    }
    
    this.state.connectingFromEntity = null
    this.state.isDragging = false
  }

  private handlePanMouseMove(screenPos: { x: number; y: number }): void {
    if (!this.state.dragStartScreen || !this.state.cameraStartPosition) return
    
    const camera = this.renderer.getCamera()
    const zoom = camera.getZoom()
    
    const deltaWorldX = (this.state.dragStartScreen.x - screenPos.x) / zoom
    const deltaWorldY = (this.state.dragStartScreen.y - screenPos.y) / zoom
    
    camera.setPosition(planck.Vec2(
      this.state.cameraStartPosition.x + deltaWorldX,
      this.state.cameraStartPosition.y + deltaWorldY
    ))
  }

  setMode(mode: EditorMode): void {
    this.state.mode = mode
    if (mode !== EditorMode.CONNECT) {
      this.state.connectingFromEntity = null
    }
  }

  getMode(): EditorMode {
    return this.state.mode
  }

  setPlacingEntityType(entityType: EntityType | null): void {
    this.state.placingEntityType = entityType
    if (entityType) {
      this.state.mode = EditorMode.PLACE
    }
  }

  getPlacingEntityType(): EntityType | null {
    return this.state.placingEntityType
  }

  getSelectedEntity(): BaseEntity | null {
    return this.state.selectedEntity
  }

  setSelectedEntity(entity: BaseEntity | null): void {
    this.state.selectedEntity = entity
  }

  private cancelCurrentAction(): void {
    this.state.isDragging = false
    this.state.dragStartScreen = null
    this.state.dragStartWorld = null
    this.state.cameraStartPosition = null
    this.state.connectingFromEntity = null
    this.state.mode = EditorMode.SELECT
  }

  resetCamera(): void {
    this.renderer.getCamera().reset()
  }

  destroy(): void {
    this.inputHandler.destroy()
  }
}

export { EditorMode }
