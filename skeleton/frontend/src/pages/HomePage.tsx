import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Space, Tag, Spin, message, Modal, Radio, Progress, Rate } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BuildOutlined,
  StarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd/es/radio';
import { Fossil, GamePhase } from '../types';
import { fossilApi } from '../services/api';
import { createGameSession } from '../store/gameSlice';
import type { AppDispatch } from '../store';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [fossils, setFossils] = useState<Fossil[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFossil, setSelectedFossil] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadFossils();
  }, []);

  const loadFossils = async () => {
    setLoading(true);
    try {
      const data = await fossilApi.getAll();
      setFossils(data);
    } catch (error) {
      console.error('Failed to load fossils:', error);
      message.error('无法加载化石列表');
    } finally {
      setLoading(false);
    }
  };

  const handleFossilSelect = (e: RadioChangeEvent) => {
    setSelectedFossil(e.target.value);
  };

  const handleStartGame = async () => {
    if (!selectedFossil) {
      message.warning('请先选择一个化石');
      return;
    }

    setIsStarting(true);
    try {
      await dispatch(createGameSession(selectedFossil)).unwrap();
      message.success('游戏开始！');
      navigate('/excavation');
    } catch (error) {
      console.error('Failed to start game:', error);
      message.error('无法开始游戏');
    } finally {
      setIsStarting(false);
    }
  };

  const selectedFossilData = fossils.find((f) => f._id === selectedFossil);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 32, textAlign: 'center' }}>
        <AppstoreOutlined style={{ marginRight: 12 }} />
        古生物化石实验室
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card title="选择化石标本" bordered={false}>
          <Spin spinning={loading}>
            <Radio.Group onChange={handleFossilSelect} value={selectedFossil}>
              <List
                dataSource={fossils}
                renderItem={(fossil) => (
                  <List.Item
                    key={fossil._id}
                    style={{
                      padding: 16,
                      background: selectedFossil === fossil._id ? '#DEB887' : 'transparent',
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Radio value={fossil._id}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                          {fossil.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {fossil.species}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <Tag color="gold">{fossil.period}</Tag>
                          <Rate
                            disabled
                            defaultValue={fossil.difficulty}
                            character={<StarOutlined />}
                            style={{ fontSize: 12 }}
                          />
                        </div>
                      </Space>
                    </Radio>
                  </List.Item>
                )}
              />
            </Radio.Group>
          </Spin>
        </Card>

        <Card title="化石详情" bordered={false}>
          {selectedFossilData ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={3}>{selectedFossilData.name}</Title>
              <Paragraph>
                <strong>学名:</strong> {selectedFossilData.species}
              </Paragraph>
              <Paragraph>
                <strong>生存年代:</strong> {selectedFossilData.period}
              </Paragraph>
              <Paragraph>
                <strong>拼装难度:</strong>
                <Rate
                  disabled
                  defaultValue={selectedFossilData.difficulty}
                  character={<StarOutlined />}
                />
              </Paragraph>
              <Paragraph>{selectedFossilData.description}</Paragraph>

              <div style={{ marginTop: 16 }}>
                <Title level={4}>游戏流程</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <BuildOutlined style={{ fontSize: 24, color: '#C4A35A' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>第一阶段：挖掘场</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        小心翼翼地挖掘化石碎片，避免损坏
                      </div>
                    </div>
                  </div>
                  <Progress
                    percent={25}
                    showInfo={false}
                    status="active"
                    strokeColor="#C4A35A"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <AppstoreOutlined style={{ fontSize: 24, color: '#6B8E23' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>第二阶段：拼装实验室</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        将骨骼碎片放置到正确的解剖位置
                      </div>
                    </div>
                  </div>
                  <Progress
                    percent={50}
                    showInfo={false}
                    status="active"
                    strokeColor="#6B8E23"
                  />
                </Space>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleStartGame}
                loading={isStarting}
                icon={<AppstoreOutlined />}
                style={{ marginTop: 24 }}
              >
                开始游戏
              </Button>
            </Space>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: '#888',
              }}
            >
              <AppstoreOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Paragraph>请从左侧选择一个化石标本</Paragraph>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
