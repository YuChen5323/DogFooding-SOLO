import React, { useEffect, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Card, Slider, Button, Space, Tag, Descriptions, Progress, message, Typography, Modal } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ToolOutlined,
  CheckOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { RootState, AppDispatch } from '../store';
import { 
  setBrushTool, 
  setSelectedBone, 
  setGridCells, 
  updateGridCell,
  excavateBone,
  advancePhase,
} from '../store/gameSlice';
import { GamePhase, GridCellState, BoneFragment, BrushTool } from '../types';
import ExcavationScene from '../components/ExcavationScene';
import { gameApi } from '../services/api';

const { Title } = Typography;

const gridSize = 6;

const ExcavationPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { session, gridCells, brushTool, selectedBone, excavatedBones, score } = useSelector(
    (state: RootState) => state.game
  );

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);

  const initializeGrid = useCallback(() => {
    if (!session?.fossil?.bones) return;

    const bones = session.fossil.bones;
    const cells: GridCellState[] = [];
    const bonePositions: Set<string> = new Set();

    bones.forEach((bone) => {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      bonePositions.add(`${row}-${col}`);
    });

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellId = `cell-${row}-${col}`;
        const hasBone = bonePositions.has(`${row}-${col}`);
        
        cells.push({
          id: cellId,
          excavated: false,
          hasBone,
          boneVisible: false,
          damage: 0,
        });
      }
    }

    dispatch(setGridCells(cells));
  }, [session?.fossil?.bones, dispatch]);

  useEffect(() => {
    if (gridCells.length === 0 && session) {
      initializeGrid();
    }
  }, [gridCells.length, session, initializeGrid]);

  useEffect(() => {
    if (session && session.currentPhase !== GamePhase.EXCAVATION) {
      navigate('/assembly');
    }
  }, [session, navigate]);

  const handleExcavate = useCallback((cellId: string, strength: number) => {
    const cell = gridCells.find((c) => c.id === cellId);
    if (!cell) return;

    const updatedCells = gridCells.map((c) => {
      if (c.id === cellId) {
        const newExcavatedLevel = Math.min(1, (c.damage || 0) + strength * 0.1);
        const newDamage = Math.min(1, c.damage + strength * 0.05);
        
        if (c.hasBone && newExcavatedLevel >= 0.8 && !c.boneVisible) {
          const boneCells = gridCells.filter((gc) => gc.hasBone);
          const boneIndex = boneCells.findIndex((bc) => bc.id === cellId);
          
          if (session?.fossil?.bones && boneIndex !== -1) {
            const bone = session.fossil.bones[boneIndex];
            if (bone && !excavatedBones[bone.id]) {
              const damage = newDamage;
              dispatch(excavateBone({ boneId: bone.id, damage }));
              message.success(`发现骨骼碎片: ${bone.name}${damage > 0.5 ? ' (有轻微损坏)' : ''}`);
            }
          }
        }

        return {
          ...c,
          excavated: newExcavatedLevel >= 0.8,
          boneVisible: c.hasBone && newExcavatedLevel >= 0.8,
          damage: newDamage,
        };
      }
      return c;
    });

    dispatch(setGridCells(updatedCells));
  }, [gridCells, session?.fossil?.bones, excavatedBones, dispatch]);

  const handleBrushTypeChange = (type: BrushTool['type']) => {
    let size: number, strength: number;
    switch (type) {
      case 'soft':
        size = 0.3;
        strength = 0.1;
        break;
      case 'hard':
        size = 0.8;
        strength = 0.6;
        break;
      case 'medium':
      default:
        size = 0.5;
        strength = 0.3;
        break;
    }
    dispatch(setBrushTool({ type, size, strength }));
  };

  const bonesWithCells = session?.fossil?.bones.map((bone, index) => {
    const cellPositions = gridCells
      .filter((c) => c.hasBone)
      .map((_, i) => ({
        x: -3 + (i % gridSize) * 1.5 + 0.75,
        y: 0.1 + (Math.random() - 0.5) * 0.2,
        z: -3 + Math.floor(i / gridSize) * 1.5 + 0.75,
      }));

    const pos = cellPositions[index] || { x: 0, y: 0, z: 0 };
    
    return {
      ...bone,
      buriedPosition: pos,
      buriedRotation: {
        x: Math.random() * 0.5,
        y: Math.random() * Math.PI,
        z: Math.random() * 0.3,
      },
    } as BoneFragment;
  }) || [];

  const excavationProgress = session?.fossil?.bones 
    ? Object.keys(excavatedBones).length / session.fossil.bones.length * 100 
    : 0;

  const isAllExcavated = session?.fossil?.bones 
    ? Object.keys(excavatedBones).length >= session.fossil.bones.length 
    : false;

  const handleAdvancePhase = async () => {
    if (!session) return;
    
    setAdvanceLoading(true);
    try {
      await dispatch(advancePhase(session._id)).unwrap();
      setShowCompleteModal(false);
      message.success('进入拼装阶段！');
      navigate('/assembly');
    } catch (error) {
      console.error('Failed to advance phase:', error);
      message.error('无法进入下一阶段');
    } finally {
      setAdvanceLoading(false);
    }
  };

  const gridCellsWithLevels = gridCells.map((cell) => {
    const cellParts = cell.id.split('-');
    const row = parseInt(cellParts[1]);
    const col = parseInt(cellParts[2]);
    return {
      ...cell,
      row,
      col,
      excavatedLevel: cell.excavated ? 1 : cell.damage * 1.5,
    };
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <ToolOutlined style={{ marginRight: 12 }} />
          挖掘场
        </Title>
        <Space>
          <Card size="small" style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>挖掘进度</span>
              <span>{Math.round(excavationProgress)}%</span>
            </div>
            <Progress
              percent={Math.round(excavationProgress)}
              showInfo={false}
              strokeColor="#C4A35A"
              size="small"
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>
                已发现: {Object.keys(excavatedBones).length}/{session?.fossil?.bones?.length || 0} 块骨骼
              </span>
              <span>
                <Tag color="gold">分数: {score}</Tag>
              </span>
            </div>
          </Card>
          {isAllExcavated && (
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => setShowCompleteModal(true)}
            >
              完成挖掘
            </Button>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        <Card
          title="挖掘工具"
          size="small"
          style={{ width: 240, flexShrink: 0 }}
          extra={
            <Tag color={brushTool.type === 'soft' ? 'green' : brushTool.type === 'hard' ? 'red' : 'gold'}>
              {brushTool.type === 'soft' ? '精细' : brushTool.type === 'hard' ? '粗暴' : '适中'}
            </Tag>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button.Group style={{ width: '100%' }}>
              <Button
                type={brushTool.type === 'soft' ? 'primary' : 'default'}
                onClick={() => handleBrushTypeChange('soft')}
                icon={<SafetyOutlined />}
                block
              >
                精细刷
              </Button>
              <Button
                type={brushTool.type === 'medium' ? 'primary' : 'default'}
                onClick={() => handleBrushTypeChange('medium')}
                icon={<ToolOutlined />}
                block
              >
                标准刷
              </Button>
              <Button
                type={brushTool.type === 'hard' ? 'primary' : 'default'}
                onClick={() => handleBrushTypeChange('hard')}
                icon={<ThunderboltOutlined />}
                block
              >
                冲击刷
              </Button>
            </Button.Group>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 12 }}>笔刷大小</div>
              <Slider
                min={0.2}
                max={1}
                step={0.1}
                value={brushTool.size}
                onChange={(value) => dispatch(setBrushTool({ size: value }))}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 12 }}>挖掘力度</div>
              <Slider
                min={0.1}
                max={1}
                step={0.1}
                value={brushTool.strength}
                onChange={(value) => dispatch(setBrushTool({ strength: value }))}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#FFF8DC',
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                <WarningOutlined style={{ marginRight: 4 }} />
                提示
              </div>
              <div style={{ color: '#666', lineHeight: 1.6 }}>
                <p>• 使用精细刷可以降低骨骼损伤风险</p>
                <p>• 粗暴刷更快但可能损坏化石</p>
                <p>• 损坏的骨骼会影响最终评分</p>
              </div>
            </div>
          </Space>
        </Card>

        <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
            <Canvas shadows camera={{ position: [8, 10, 8], fov: 50 }}>
              <ExcavationScene
                bones={bonesWithCells}
                excavatedBones={excavatedBones}
                selectedBone={selectedBone}
                onSelectBone={(bone) => dispatch(setSelectedBone(bone))}
                gridCells={gridCellsWithLevels}
                brushTool={brushTool}
                onExcavate={handleExcavate}
                gridSize={gridSize}
              />
            </Canvas>
          </div>
        </Card>

        <Card
          title="已发现骨骼"
          size="small"
          style={{ width: 280, flexShrink: 0 }}
        >
          {session?.fossil?.bones?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.fossil.bones.map((bone) => {
                const isExcavated = excavatedBones[bone.id];
                return (
                  <div
                    key={bone.id}
                    style={{
                      padding: 12,
                      background: isExcavated ? '#DEB887' : '#F5DEB3',
                      borderRadius: 8,
                      border: selectedBone?.id === bone.id ? '2px solid #C4A35A' : '1px solid #D2B48C',
                      opacity: isExcavated ? 1 : 0.5,
                      cursor: 'pointer',
                    }}
                    onClick={() => isExcavated && dispatch(setSelectedBone(bone))}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: isExcavated ? 'bold' : 'normal' }}>
                        {isExcavated ? bone.name : '???'}
                      </span>
                      {isExcavated ? (
                        <Tag color="success" icon={<CheckOutlined />}>
                          已发现
                        </Tag>
                      ) : (
                        <Tag color="default">未发现</Tag>
                      )}
                    </div>
                    {isExcavated && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        {bone.anatomyPosition}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
              <ToolOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <p>开始挖掘以发现骨骼</p>
            </div>
          )}
        </Card>
      </div>

      <Modal
        title="挖掘完成！"
        open={showCompleteModal}
        onOk={handleAdvancePhase}
        onCancel={() => setShowCompleteModal(false)}
        confirmLoading={advanceLoading}
        okText="进入拼装实验室"
        cancelText="继续挖掘"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            恭喜您完成了{session?.fossil?.name}化石的挖掘工作！
          </p>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="发现骨骼数">
              {Object.keys(excavatedBones).length} 块
            </Descriptions.Item>
            <Descriptions.Item label="当前得分">
              {score} 分
            </Descriptions.Item>
          </Descriptions>
          <p style={{ fontSize: 12, color: '#666' }}>
            下一阶段：在拼装实验室中将骨骼碎片组装成完整骨架。
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default ExcavationPage;
