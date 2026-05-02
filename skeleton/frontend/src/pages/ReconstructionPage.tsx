import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Card, Button, Space, Tag, Typography, Modal, message, Radio, Slider, Switch, Descriptions, Alert } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd/es/radio';
import { RootState, AppDispatch } from '../store';
import { advancePhase } from '../store/gameSlice';
import { GamePhase, AssemblyBone } from '../types';
import ReconstructionScene from '../components/ReconstructionScene';

const { Title, Paragraph } = Typography;

type AnimationType = 'idle' | 'walk' | 'attack' | 'roar';

const ReconstructionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { session, assembledBones, score } = useSelector((state: RootState) => state.game);

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType>('idle');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showMuscles, setShowMuscles] = useState(true);
  const [showJoints, setShowJoints] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);

  useEffect(() => {
    if (session) {
      const validPhases = [GamePhase.RECONSTRUCTION, GamePhase.MUSEUM];
      if (!validPhases.includes(session.currentPhase)) {
        navigate('/assembly');
      }
    }
  }, [session, navigate]);

  const assemblyBones: AssemblyBone[] = Object.entries(assembledBones).map(([boneId, data]) => {
    const bone = session?.fossil?.bones?.find((b) => b.id === boneId);
    return {
      bone: bone || {
        id: boneId,
        name: '未知骨骼',
        type: 'unknown',
        targetPosition: data.position,
        targetRotation: data.rotation,
        targetScale: { x: 1, y: 1, z: 1 },
        anatomyPosition: '',
        isExposed: false,
        isAssembled: data.correct,
        damageLevel: 0,
        buriedPosition: { x: 0, y: 0, z: 0 },
        buriedRotation: { x: 0, y: 0, z: 0 },
        depth: 0,
      },
      position: data.position,
      rotation: data.rotation,
      correct: data.correct,
    };
  });

  const handleAnimationTypeChange = (e: RadioChangeEvent) => {
    setAnimationType(e.target.value);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      message.info(`播放${getAnimationLabel(animationType)}动画`);
    }
  };

  const getAnimationLabel = (type: AnimationType): string => {
    switch (type) {
      case 'idle':
        return '站立姿态';
      case 'walk':
        return '行走';
      case 'attack':
        return '捕食攻击';
      case 'roar':
        return '吼叫';
      default:
        return '';
    }
  };

  const handleAdvancePhase = async () => {
    if (!session) return;

    setAdvanceLoading(true);
    try {
      await dispatch(advancePhase(session._id)).unwrap();
      setShowCompleteModal(false);
      message.success('进入博物馆展陈模式！');
      navigate('/museum');
    } catch (error) {
      console.error('Failed to advance phase:', error);
      message.error('无法进入下一阶段');
    } finally {
      setAdvanceLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 12 }} />
          肌肉与运动重建
        </Title>
        <Space>
          <Card size="small" style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>当前分数</div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{score}</div>
              </div>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => setShowCompleteModal(true)}
              >
                进入博物馆
              </Button>
            </div>
          </Card>
        </Space>
      </div>

      <Alert
        message="动画说明"
        description="选择不同的动画类型来预览恐龙的各种运动姿态。可以调整动画速度，并观察肌肉收缩和关节运动。"
        type="info"
        showIcon
      />

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        <Card title="动画控制" size="small" style={{ width: 280, flexShrink: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>动画类型</div>
              <Radio.Group onChange={handleAnimationTypeChange} value={animationType}>
                <Space direction="vertical">
                  <Radio value="idle">站立姿态</Radio>
                  <Radio value="walk">行走动画</Radio>
                  <Radio value="attack">捕食攻击</Radio>
                  <Radio value="roar">吼叫姿态</Radio>
                </Space>
              </Radio.Group>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>播放控制</div>
              <Button
                type={isPlaying ? 'default' : 'primary'}
                size="large"
                block
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlayToggle}
              >
                {isPlaying ? '暂停动画' : '播放动画'}
              </Button>
              <Tag
                color={isPlaying ? 'success' : 'default'}
                style={{ marginTop: 8, display: 'block', textAlign: 'center' }}
              >
                {isPlaying ? '动画播放中' : '动画已暂停'}
              </Tag>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>动画速度</span>
                <span>{animationSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={animationSpeed}
                onChange={setAnimationSpeed}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>显示选项</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><EyeOutlined style={{ marginRight: 4 }} />显示肌肉</span>
                  <Switch checked={showMuscles} onChange={setShowMuscles} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><CheckCircleOutlined style={{ marginRight: 4 }} />显示关节</span>
                  <Switch checked={showJoints} onChange={setShowJoints} />
                </div>
              </Space>
            </div>

            <Button
              onClick={() => {
                setIsPlaying(false);
                setAnimationSpeed(1);
              }}
              icon={<ReloadOutlined />}
              block
              style={{ marginTop: 16 }}
            >
              重置动画
            </Button>
          </Space>
        </Card>

        <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
            <Canvas shadows camera={{ position: [8, 6, 8], fov: 50 }}>
              <ReconstructionScene
                assembledBones={assemblyBones}
                animationType={animationType}
                isPlaying={isPlaying}
                animationSpeed={animationSpeed}
                showMuscles={showMuscles}
                showJoints={showJoints}
              />
            </Canvas>
          </div>
        </Card>

        <Card title="肌肉系统" size="small" style={{ width: 280, flexShrink: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="颈肌">
                控制头部旋转和抬头动作
              </Descriptions.Item>
              <Descriptions.Item label="胸肌">
                连接肱骨，控制前肢摆动
              </Descriptions.Item>
              <Descriptions.Item label="腹肌">
                支撑躯干，辅助呼吸和平衡
              </Descriptions.Item>
              <Descriptions.Item label="腿部肌肉">
                强大的后肢肌群，提供奔跑动力
              </Descriptions.Item>
              <Descriptions.Item label="尾部肌肉">
                保持平衡，辅助转向
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="关节旋转范围" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                <p><strong>颈关节:</strong> 上下 ±30°，左右 ±17°</p>
                <p><strong>肩关节:</strong> 前后 ±57°，左右 ±29°</p>
                <p><strong>髋关节:</strong> 前后 ±46°，左右 ±11°</p>
                <p><strong>尾关节:</strong> 上下 ±17°，左右 ±29°</p>
              </div>
            </Card>

            {animationType === 'walk' && (
              <Alert
                message="行走动画"
                description="霸王龙用后腿行走，尾巴用于保持平衡。腿部肌肉交替收缩产生推进力。"
                type="info"
                showIcon
                size="small"
              />
            )}
            {animationType === 'attack' && (
              <Alert
                message="捕食攻击"
                description="攻击时头部快速前伸，下颚张开。颈部和颌部肌肉剧烈收缩产生强大咬合力。"
                type="warning"
                showIcon
                size="small"
              />
            )}
          </Space>
        </Card>
      </div>

      <Modal
        title="肌肉与运动重建完成！"
        open={showCompleteModal}
        onOk={handleAdvancePhase}
        onCancel={() => setShowCompleteModal(false)}
        confirmLoading={advanceLoading}
        okText="进入博物馆展陈"
        cancelText="继续观看动画"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            您已完成{session?.fossil?.name}的肌肉与运动系统重建！
          </Paragraph>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="重建内容">
              <Tag>肌肉体积</Tag>
              <Tag>关节限制</Tag>
              <Tag>运动动画</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最终得分">
              {score} 分
            </Descriptions.Item>
          </Descriptions>
          <Alert
            message="博物馆展陈"
            description="在博物馆模式中，您可以为您组装的恐龙创建精美的展牌，并在旋转展示台上展示您的完整作品。"
            type="success"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default ReconstructionPage;
