import React, { useEffect, useRef, useState } from 'react'
import { Layout, Button, Space, Slider, Checkbox, Card, List, Tag, message } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SelectOutlined,
  LinkOutlined,
  PlusOutlined,
  RedoOutlined,
  SaveOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import * as planck from 'planck-js'

import { CanvasRenderer } from '../renderer'
import { EntityManager, EntityFactory } from '../entities'
import { InputHandler, SceneEditor, EditorMode } from '../interaction'
import { PhysicsWorld, SimulationController, ReplaySystem, JointManager } from '../physics'
import { EntityType } from '../types'

const { Header, Sider, Content } = Layout

const entityTypeOptions = [
  { value: EntityType.BALL, label: '球', icon: '⚪' },
  { value: EntityType.GEAR, label: '齿轮', icon: '⚙️' },
  { value: EntityType.LINK, label: '连杆', icon: '🔗' },
  { value: EntityType.SPRING, label: '弹簧', icon: '🌀' },
  { value: EntityType.MOTOR, label: '马达', icon: '⚡' },
  { value: EntityType.HINGE, label: '铰链', icon: '🔩' },
  { value: EntityType.BASKET, label: '篮子', icon: '🧺' },
  { value: EntityType.FIXED_POINT, label: '固定点', icon: '📍' },
  { value: EntityType.GROUND, label: '地面', icon: '🌍' },
]

const MainLayout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const entityManagerRef = useRef<EntityManager | null>(null)
  const inputHandlerRef = useRef<InputHandler | null>(null)
  const sceneEditorRef = useRef<SceneEditor | null>(null)
  const physicsWorldRef = useRef<PhysicsWorld | null>(null)
  const simulationControllerRef = useRef<SimulationController | null>(null)
  const replaySystemRef = useRef<ReplaySystem | null>(null)
  const jointManagerRef = useRef<JointManager | null>(null)
  
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [timeScale, setTimeScale] = useState(1.0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [showDebug, setShowDebug] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.SELECT)
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(null)
  const [entityCount, setEntityCount] = useState(0)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent && rendererRef.current) {
        rendererRef.current.resize(parent.clientWidth, parent.clientHeight)
      }
    }

    rendererRef.current = new CanvasRenderer(canvas)
    entityManagerRef.current = new EntityManager()
    inputHandlerRef.current = new InputHandler(canvas)
    sceneEditorRef.current = new SceneEditor(
      rendererRef.current,
      entityManagerRef.current,
      inputHandlerRef.current
    )
    physicsWorldRef.current = new PhysicsWorld()
    replaySystemRef.current = new ReplaySystem()
    simulationControllerRef.current = new SimulationController(
      physicsWorldRef.current,
      replaySystemRef.current
    )
    jointManagerRef.current = new JointManager()

    const world = physicsWorldRef.current.getWorld()
    entityManagerRef.current.setWorld(world)
    sceneEditorRef.current.setWorld(world)
    jointManagerRef.current.setWorld(world)

    const ground = EntityFactory.createDefaultEntity(EntityType.GROUND, planck.Vec2(0, 10))
    entityManagerRef.current.addEntity(ground, planck.Vec2(0, 10), 0)
    setEntityCount(1)

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const gameLoop = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time
      }
      
      const deltaTime = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      if (physicsWorldRef.current && simulationControllerRef.current && entityManagerRef.current) {
        const entities = new Map()
        entityManagerRef.current.getEntities().forEach((entity) => {
          const body = entity.getBody()
          if (body) {
            entities.set(entity.getId(), {
              body: body,
              stress: entity.getStress(),
            })
          }
        })

        const joints = jointManagerRef.current?.getAllJoints() || new Map()
        simulationControllerRef.current.update(deltaTime, entities, joints)
      }

      if (rendererRef.current && entityManagerRef.current) {
        rendererRef.current.setConfig({ showDebug })
        rendererRef.current.render(entityManagerRef.current.getEntities())
      }

      if (simulationControllerRef.current) {
        const state = simulationControllerRef.current.getSimulationState()
        setIsRunning(state.isRunning)
        setIsPaused(state.isPaused)
        setIsReplaying(state.isReplaying)
        setCurrentFrame(state.currentFrame)
        setTotalFrames(state.totalFrames)
        setTimeScale(state.timeScale)
      }

      if (sceneEditorRef.current) {
        setEditorMode(sceneEditorRef.current.getMode() as EditorMode)
        const selected = sceneEditorRef.current.getSelectedEntity()
        if (selected) {
          setSelectedEntity(selected.getId())
        } else {
          setSelectedEntity(null)
        }
      }

      if (entityManagerRef.current) {
        setEntityCount(entityManagerRef.current.getCount())
      }

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (inputHandlerRef.current) {
        inputHandlerRef.current.destroy()
      }
    }
  }, [showDebug])

  const handlePlay = () => {
    simulationControllerRef.current?.start()
  }

  const handlePause = () => {
    if (simulationControllerRef.current?.isPaused()) {
      simulationControllerRef.current?.resume()
    } else {
      simulationControllerRef.current?.pause()
    }
  }

  const handleStep = () => {
    simulationControllerRef.current?.step()
  }

  const handleReset = () => {
    simulationControllerRef.current?.reset()
    setIsRunning(false)
    setIsPaused(false)
    setIsReplaying(false)
    setCurrentFrame(0)
    setTotalFrames(0)
  }

  const handleReplay = () => {
    simulationControllerRef.current?.startReplay()
  }

  const handleTimeScaleChange = (value: number) => {
    setTimeScale(value)
    simulationControllerRef.current?.setTimeScale(value)
  }

  const handleEditorModeChange = (mode: EditorMode) => {
    sceneEditorRef.current?.setMode(mode)
    setEditorMode(mode)
    if (mode !== EditorMode.PLACE) {
      setSelectedEntityType(null)
    }
  }

  const handleEntityTypeSelect = (type: EntityType) => {
    sceneEditorRef.current?.setPlacingEntityType(type)
    setSelectedEntityType(type)
  }

  const handleDeleteSelected = () => {
    if (sceneEditorRef.current) {
      const selected = sceneEditorRef.current.getSelectedEntity()
      if (selected) {
        entityManagerRef.current?.removeEntity(selected.getId())
        sceneEditorRef.current.setSelectedEntity(null)
        message.success('已删除选中的实体')
      }
    }
  }

  const handleSaveWork = () => {
    message.info('保存功能将在IndexedDB模块实现后启用')
  }

  const handleLoadWork = () => {
    message.info('加载功能将在IndexedDB模块实现后启用')
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          Contraption Maker - 2D机械发明模拟器
        </div>
        
        <Space>
          <Button
            type={isRunning && !isPaused ? 'primary' : 'default'}
            icon={<PlayCircleOutlined />}
            onClick={handlePlay}
            disabled={isReplaying}
          >
            开始
          </Button>
          <Button
            icon={<PauseCircleOutlined />}
            onClick={handlePause}
            disabled={!isRunning || isReplaying}
          >
            {isPaused ? '继续' : '暂停'}
          </Button>
          <Button
            icon={<StepForwardOutlined />}
            onClick={handleStep}
            disabled={!isRunning || !isPaused}
          >
            步进
          </Button>
          <Button
            icon={<RedoOutlined />}
            onClick={handleReplay}
            disabled={totalFrames === 0}
          >
            回放
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置
          </Button>
          
          <div style={{ width: 150 }}>
            <Slider
              min={0.1}
              max={3.0}
              step={0.1}
              value={timeScale}
              onChange={handleTimeScaleChange}
              tooltip={{ formatter: (value) => `${value}x` }}
            />
          </div>
          
          <Tag color={isRunning ? 'green' : 'default'}>
            帧: {currentFrame}/{totalFrames}
          </Tag>
          <Tag color="blue">
            实体: {entityCount}
          </Tag>
        </Space>
      </Header>

      <Layout>
        <Sider
          width={250}
          style={{ background: '#002140', overflowY: 'auto' }}
        >
          <Card
            title="编辑模式"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
            bodyStyle={{ padding: '8px 0' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type={editorMode === EditorMode.SELECT ? 'primary' : 'default'}
                icon={<SelectOutlined />}
                block
                onClick={() => handleEditorModeChange(EditorMode.SELECT)}
              >
                选择模式 (S)
              </Button>
              <Button
                type={editorMode === EditorMode.PLACE ? 'primary' : 'default'}
                icon={<PlusOutlined />}
                block
                onClick={() => {
                  handleEditorModeChange(EditorMode.PLACE)
                }}
                disabled={!selectedEntityType}
              >
                放置模式 (P)
              </Button>
              <Button
                type={editorMode === EditorMode.CONNECT ? 'primary' : 'default'}
                icon={<LinkOutlined />}
                block
                onClick={() => handleEditorModeChange(EditorMode.CONNECT)}
              >
                连接模式 (C)
              </Button>
            </Space>
          </Card>

          <Card
            title="组件面板"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
            bodyStyle={{ padding: '8px 0' }}
          >
            <List
              size="small"
              dataSource={entityTypeOptions}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedEntityType === item.value ? 'rgba(24, 144, 255, 0.3)' : 'transparent',
                    borderRadius: '4px',
                    margin: '4px',
                    padding: '8px 12px',
                  }}
                  onClick={() => handleEntityTypeSelect(item.value as EntityType)}
                >
                  <Space>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ color: '#fff' }}>{item.label}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="快捷操作"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
            bodyStyle={{ padding: '8px 0' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                block
                onClick={handleDeleteSelected}
                disabled={!selectedEntity}
              >
                删除选中 (Delete)
              </Button>
              <Button
                icon={<SaveOutlined />}
                block
                onClick={handleSaveWork}
              >
                保存作品
              </Button>
              <Button
                icon={<FolderOpenOutlined />}
                block
                onClick={handleLoadWork}
              >
                加载作品
              </Button>
            </Space>
          </Card>

          <Card
            title="显示选项"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
            bodyStyle={{ padding: '8px 0' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Checkbox
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                style={{ color: '#fff' }}
              >
                显示调试信息
              </Checkbox>
            </Space>
          </Card>
        </Sider>

        <Content
          style={{
            background: '#1a1a2e',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <div>鼠标滚轮: 缩放</div>
            <div>Alt + 拖动或中键拖动: 平移</div>
            <div>Delete/Backspace: 删除选中实体</div>
            <div>Esc: 取消当前操作</div>
          </div>
        </Content>

        <Sider
          width={280}
          style={{ background: '#002140', overflowY: 'auto' }}
        >
          <Card
            title="属性检查器"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
          >
            {selectedEntity ? (
              <div style={{ color: '#fff' }}>
                <p>已选中: {selectedEntity}</p>
                <p style={{ color: '#1890ff', fontSize: '12px' }}>
                  属性编辑功能将在后续模块中实现
                </p>
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>
                请在画布上选择一个实体查看属性
              </p>
            )}
          </Card>

          <Card
            title="挑战关卡"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
          >
            <List
              size="small"
              dataSource={[
                { name: '将球送到篮子', description: '使用机械装置将球送入篮子中' },
                { name: '搭建平衡秤', description: '搭建一个可平衡的秤' },
                { name: '齿轮传动', description: '使用齿轮系统传递动力' },
              ]}
              renderItem={(item) => (
                <List.Item style={{ color: '#fff', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.description}</div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="模拟状态"
            size="small"
            style={{ margin: '8px', background: 'transparent', border: 'none' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #1890ff' }}
          >
            <Space direction="vertical" style={{ width: '100%', color: '#fff' }}>
              <div>
                运行状态: 
                <Tag color={isRunning ? 'green' : 'default'} style={{ marginLeft: 8 }}>
                  {isRunning ? '运行中' : '已停止'}
                </Tag>
              </div>
              <div>
                暂停状态:
                <Tag color={isPaused ? 'orange' : 'default'} style={{ marginLeft: 8 }}>
                  {isPaused ? '已暂停' : '运行中'}
                </Tag>
              </div>
              <div>
                回放状态:
                <Tag color={isReplaying ? 'cyan' : 'default'} style={{ marginLeft: 8 }}>
                  {isReplaying ? '回放中' : '未回放'}
                </Tag>
              </div>
              <div>时间缩放: {timeScale.toFixed(1)}x</div>
              <div>当前帧: {currentFrame}</div>
              <div>总帧数: {totalFrames}</div>
            </Space>
          </Card>
        </Sider>
      </Layout>
    </Layout>
  )
}

export default MainLayout
