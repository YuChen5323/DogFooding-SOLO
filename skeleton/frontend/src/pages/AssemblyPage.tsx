import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Card, Button, Space, Tag, Progress, Typography, Modal, message, List, Descriptions, Alert } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AppstoreOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { RootState, AppDispatch } from '../store';
import {
  setDraggedBone,
  setSelectedBone,
  assembleBone,
  advancePhase,
} from '../store/gameSlice';
import { GamePhase, BoneFragment, Position, Rotation, AssemblyCheckResult } from '../types';
import AssemblyScene from '../components/AssemblyScene';
import { gameApi } from '../services/api';

const { Title, Paragraph } = Typography;

const AssemblyPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { session, assembledBones, excavatedBones, draggedBone, selectedBone, score } =
    useSelector((state: RootState) => state.game);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [checkingAssembly, setCheckingAssembly] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AssemblyCheckResult | null>(null);
  const [showOutlines, setShowOutlines] = useState(true);

  useEffect(() => {
    if (session && session.currentPhase !== GamePhase.ASSEMBLY && session.currentPhase !== GamePhase.RECONSTRUCTION && session.currentPhase !== GamePhase.MUSEUM) {
      navigate('/excavation');
    }
  }, [session, navigate]);

  const handleDragStart = useCallback((bone: BoneFragment) => {
    dispatch(setDraggedBone(bone));
  }, [dispatch]);

  const handleDragEnd = useCallback(async (bone: BoneFragment, position: Position, rotation: Rotation) => {
    if (!session) return;

    setCheckingAssembly(true);
    setCheckResult(null);

    const distanceToTarget = Math.sqrt(
      Math.pow(position.x - bone.targetPosition.x - 4, 2) +
      Math.pow(position.y - bone.targetPosition.y, 2) +
      Math.pow(position.z - bone.targetPosition.z, 2)
    );

    const snapThreshold = 2;
    let finalPosition = position;
    let finalRotation = rotation;

    if (distanceToTarget < snapThreshold) {
      finalPosition = {
        x: bone.targetPosition.x + 4,
        y: bone.targetPosition.y,
        z: bone.targetPosition.z,
      };
      finalRotation = bone.targetRotation;
    }

    try {
      const result = await gameApi.checkAssembly(
        bone.id,
        finalPosition,
        finalRotation,
        { x: bone.targetPosition.x + 4, y: bone.targetPosition.y, z: bone.targetPosition.z },
        bone.targetRotation
      );

      setCheckResult(result);

      if (result.isCorrect) {
        message.success(result.feedback);
        
        await dispatch(
          assembleBone({
            boneId: bone.id,
            position: finalPosition,
            rotation: finalRotation,
            correct: true,
          })
        ).unwrap();
      } else {
        message.warning(result.feedback);
        await dispatch(
          assembleBone({
            boneId: bone.id,
            position: finalPosition,
            rotation: finalRotation,
            correct: false,
          })
        ).unwrap();
      }
    } catch (error) {
      console.error('Failed to check assembly:', error);
      message.error('无法校验装配位置');
    } finally {
      setCheckingAssembly(false);
      dispatch(setDraggedBone(null));
    }
  }, [session, dispatch]);

  const bones = session?.fossil?.bones || [];
  const totalBones = bones.length;
  const assembledCorrectly = Object.values(assembledBones).filter((b) => b.correct).length;
  const assemblyProgress = totalBones > 0 ? (assembledCorrectly / totalBones) * 100 : 0;
  const isAllAssembled = assembledCorrectly >= totalBones && totalBones > 0;

  const handleAdvancePhase = async () => {
    if (!session) return;

    setAdvanceLoading(true);
    try {
      await dispatch(advancePhase(session._id)).unwrap();
      setShowCompleteModal(false);
      message.success('进入肌肉与运动重建阶段！');
      navigate('/reconstruction');
    } catch (error) {
      console.error('Failed to advance phase:', error);
      message.error('无法进入下一阶段');
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleResetAssembly = () => {
    if (selectedBone) {
      dispatch(
        assembleBone({
          boneId: selectedBone.id,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          correct: false,
        })
      );
      message.info('已重置选中骨骼位置');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <AppstoreOutlined style={{ marginRight: 12 }} />
          拼装实验室
        </Title>
        <Space>
          <Card size="small" style={{ minWidth: 250 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>拼装进度</span>
              <span>{assembledCorrectly}/{totalBones} 块骨骼</span>
            </div>
            <Progress
              percent={Math.round(assemblyProgress)}
              showInfo={false}
              strokeColor="#C4A35A"
              size="small"
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Tag color="gold">分数: {score}</Tag>
              <Tag color={isAllAssembled ? 'success' : 'default'}>
                {isAllAssembled ? '拼装完成!' : '进行中'}
              </Tag>
            </div>
          </Card>
          {isAllAssembled && (
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => setShowCompleteModal(true)}
            >
              完成拼装
            </Button>
          )}
        </Space>
      </div>

      {checkResult && (
        <Alert
          message={checkResult.feedback}
          type={checkResult.isCorrect ? 'success' : 'warning'}
          showIcon
          action={
            <Space>
              <span>位置精度: {checkResult.positionAccuracy.toFixed(1)}%</span>
              <span>旋转精度: {checkResult.rotationAccuracy.toFixed(1)}%</span>
            </Space>
          }
          closable
          onClose={() => setCheckResult(null)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        <Card title="操作面板" size="small" style={{ width: 240, flexShrink: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ padding: 12, background: '#FFF8DC', borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                操作说明
              </div>
              <div style={{ color: '#666', lineHeight: 1.8 }}>
                <p>1. 拖拽左侧的骨骼碎片</p>
                <p>2. 移动到右侧的目标位置</p>
                <p>3. 靠近目标时会自动吸附</p>
                <p>4. 位置正确后会自动锁定</p>
              </div>
            </div>

            <Button
              onClick={() => setShowOutlines(!showOutlines)}
              icon={showOutlines ? <CheckOutlined /> : undefined}
              block
            >
              {showOutlines ? '隐藏目标轮廓' : '显示目标轮廓'}
            </Button>

            {selectedBone && (
              <Button
                onClick={handleResetAssembly}
                icon={<ReloadOutlined />}
                block
              >
                重置选中骨骼
              </Button>
            )}

            {selectedBone && (
              <Card size="small" title="选中骨骼" style={{ marginTop: 8 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="名称">
                    {selectedBone.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="位置">
                    {selectedBone.anatomyPosition}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {assembledBones[selectedBone.id]?.correct ? (
                      <Tag color="success">已正确放置</Tag>
                    ) : assembledBones[selectedBone.id] ? (
                      <Tag color="warning">需要调整</Tag>
                    ) : (
                      <Tag color="default">未放置</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Space>
        </Card>

        <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
            <Canvas shadows camera={{ position: [10, 8, 10], fov: 50 }}>
              <AssemblyScene
                bones={bones}
                excavatedBones={excavatedBones}
                assembledBones={assembledBones}
                draggedBone={draggedBone}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                selectedBone={selectedBone}
                onSelectBone={(bone) => dispatch(setSelectedBone(bone))}
                showOutlines={showOutlines}
              />
            </Canvas>
          </div>
        </Card>

        <Card title="骨骼列表" size="small" style={{ width: 280, flexShrink: 0 }}>
          {bones.length > 0 ? (
            <List
              size="small"
              dataSource={bones}
              renderItem={(bone) => {
                const isExcavated = excavatedBones[bone.id];
                const isAssembled = assembledBones[bone.id]?.correct;
                const isPlaced = !!assembledBones[bone.id];

                return (
                  <List.Item
                    key={bone.id}
                    style={{
                      padding: 12,
                      background: isAssembled
                        ? '#DEB887'
                        : isPlaced
                        ? '#F5DEB3'
                        : '#FFF8DC',
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: isExcavated ? 'pointer' : 'default',
                      border: selectedBone?.id === bone.id ? '2px solid #C4A35A' : '1px solid #D2B48C',
                      opacity: isExcavated ? 1 : 0.5,
                    }}
                    onClick={() => isExcavated && dispatch(setSelectedBone(bone))}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: isAssembled ? 'bold' : 'normal' }}>
                          {isExcavated ? bone.name : '???'}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {isExcavated ? bone.anatomyPosition : '未挖掘'}
                        </div>
                      </div>
                      <Space>
                        {isAssembled && (
                          <Tag color="success" icon={<CheckOutlined />}>
                            完成
                          </Tag>
                        )}
                        {isPlaced && !isAssembled && (
                          <Tag color="warning">调整中</Tag>
                        )}
                        {!isPlaced && isExcavated && (
                          <Tag color="default">待放置</Tag>
                        )}
                        {!isExcavated && <Tag color="default">未发现</Tag>}
                      </Space>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
              <AppstoreOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <p>没有可用的骨骼</p>
            </div>
          )}
        </Card>
      </div>

      <Modal
        title="拼装完成！"
        open={showCompleteModal}
        onOk={handleAdvancePhase}
        onCancel={() => setShowCompleteModal(false)}
        confirmLoading={advanceLoading}
        okText="进入肌肉与运动重建"
        cancelText="继续调整"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            恭喜您成功拼装了{session?.fossil?.name}的完整骨架！
          </Paragraph>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="正确放置骨骼">
              {assembledCorrectly} 块
            </Descriptions.Item>
            <Descriptions.Item label="当前得分">
              {score} 分
            </Descriptions.Item>
          </Descriptions>
          <Alert
            message="下一阶段"
            description="在肌肉与运动重建阶段，系统将为骨架自动添加肌肉并设置关节运动范围，然后您可以预览行走和捕食动画。"
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default AssemblyPage;
