import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Card, Button, Space, Typography, message, Slider, Switch, Descriptions, Tag, Modal, Result } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrophyOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RotateRightOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { GamePhase } from '../types';
import MuseumScene from '../components/MuseumScene';

const { Title, Paragraph } = Typography;

const MuseumPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, score, assembledBones, excavatedBones } = useSelector(
    (state: RootState) => state.game
  );

  const [isRotating, setIsRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [showCompleteModal, setShowCompleteModal] = useState(true);

  useEffect(() => {
    if (session && session.currentPhase !== GamePhase.MUSEUM) {
      navigate('/reconstruction');
    }
  }, [session, navigate]);

  const fossilName = session?.fossil?.name || '未知恐龙';
  const species = session?.fossil?.species || 'Dinoausrus sp.';
  const period = session?.fossil?.period || '未知年代';
  const description = session?.fossil?.description || '一具完整的恐龙骨架化石，由玩家精心挖掘并组装。';

  const totalBones = session?.fossil?.bones?.length || 0;
  const excavatedCount = Object.keys(excavatedBones).length;
  const assembledCorrectly = Object.values(assembledBones).filter((b) => b.correct).length;

  const getExhibitionLevel = () => {
    if (score >= 1000) return { level: '黄金展陈', color: 'gold', stars: 3 };
    if (score >= 500) return { level: '白银展陈', color: 'silver', stars: 2 };
    return { level: '青铜展陈', color: 'bronze', stars: 1 };
  };

  const exhibition = getExhibitionLevel();

  const handleRestart = () => {
    message.info('返回主页面，选择新的化石开始游戏');
    navigate('/');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <TrophyOutlined style={{ marginRight: 12 }} />
          博物馆展陈
          <Tag
            color={
              exhibition.color === 'gold'
                ? 'gold'
                : exhibition.color === 'silver'
                ? 'default'
                : 'orange'
            }
            style={{ marginLeft: 12 }}
          >
            {'⭐'.repeat(exhibition.stars)} {exhibition.level}
          </Tag>
        </Title>
        <Space>
          <Tag color="gold" style={{ fontSize: 16, padding: '4px 16px' }}>
            <TrophyOutlined style={{ marginRight: 4 }} />
            最终得分: {score}
          </Tag>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={handleRestart}
          >
            再玩一次
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        <Card title="展陈控制" size="small" style={{ width: 260, flexShrink: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>旋转展示</div>
              <Button
                type={isRotating ? 'primary' : 'default'}
                block
                icon={isRotating ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsRotating(!isRotating)}
              >
                {isRotating ? '暂停旋转' : '开始旋转'}
              </Button>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>旋转速度</span>
                <span>{rotationSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={rotationSpeed}
                onChange={setRotationSpeed}
              />
            </div>

            <Button
              icon={<RotateRightOutlined />}
              block
              style={{ marginTop: 16 }}
              onClick={() => {
                setRotationSpeed(1);
                setIsRotating(true);
                message.success('已重置展示效果');
              }}
            >
              重置展示
            </Button>
          </Space>
        </Card>

        <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
            <Canvas shadows camera={{ position: [10, 6, 10], fov: 50 }}>
              <MuseumScene
                fossilName={fossilName}
                species={species}
                period={period}
                description={description}
                finalScore={score}
                isRotating={isRotating}
                rotationSpeed={rotationSpeed}
              />
            </Canvas>
          </div>
        </Card>

        <Card title="展览信息" size="small" style={{ width: 300, flexShrink: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card
              size="small"
              className="museum-info-card"
              style={{ background: 'linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%)' }}
            >
              <div className="museum-title" style={{ fontFamily: 'Georgia, serif', fontSize: 20 }}>
                {fossilName}
              </div>
              <div className="museum-detail">
                <Paragraph>
                  <strong>学名:</strong> <em>{species}</em>
                </Paragraph>
                <Paragraph>
                  <strong>生存年代:</strong> {period}
                </Paragraph>
                <Paragraph className="museum-detail" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {description}
                </Paragraph>
              </div>
            </Card>

            <Descriptions column={1} size="small" bordered title="游戏统计">
              <Descriptions.Item label="挖掘骨骼">
                {excavatedCount}/{totalBones} 块
              </Descriptions.Item>
              <Descriptions.Item label="正确拼装">
                {assembledCorrectly}/{totalBones} 块
              </Descriptions.Item>
              <Descriptions.Item label="展览等级">
                <Tag
                  color={
                    exhibition.color === 'gold'
                      ? 'gold'
                      : exhibition.color === 'silver'
                      ? 'default'
                      : 'orange'
                  }
                >
                  {'⭐'.repeat(exhibition.stars)} {exhibition.level}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最终得分">
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#C4A35A' }}>
                  {score}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="成就徽章">
              <Space wrap>
                {score >= 200 && (
                  <Tag color="blue">🦴 初出茅庐</Tag>
                )}
                {assembledCorrectly === totalBones && totalBones > 0 && (
                  <Tag color="green">🧩 完美拼装</Tag>
                )}
                {score >= 500 && (
                  <Tag color="gold">🏆 化石猎人</Tag>
                )}
                {score >= 1000 && (
                  <Tag color="purple">👑 古生物学家</Tag>
                )}
              </Space>
            </Card>
          </Space>
        </Card>
      </div>

      <Modal
        title="恭喜完成游戏！"
        open={showCompleteModal}
        onOk={() => setShowCompleteModal(false)}
        onCancel={() => setShowCompleteModal(false)}
        footer={[
          <Button key="back" onClick={() => setShowCompleteModal(false)}>
            查看展览
          </Button>,
          <Button key="submit" type="primary" onClick={handleRestart}>
            再玩一次
          </Button>,
        ]}
        width={600}
      >
        <Result
          status="success"
          title={`恭喜完成 ${fossilName} 的挖掘与拼装！`}
          subTitle="您的化石标本已在博物馆展出"
          extra={[
            <div key="stats" style={{ marginBottom: 24 }}>
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="挖掘">{excavatedCount}/{totalBones}</Descriptions.Item>
                <Descriptions.Item label="拼装">{assembledCorrectly}/{totalBones}</Descriptions.Item>
                <Descriptions.Item label="得分">
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#C4A35A' }}>
                    {score}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </div>,
          ]}
        >
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text type="secondary">
              您可以在博物馆中欣赏您的完整作品，或者选择新的化石开始新的冒险！
            </Typography.Text>
          </div>
        </Result>
      </Modal>
    </div>
  );
};

export default MuseumPage;
