import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Card, Space, message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  AppstoreOutlined, 
  ExperimentOutlined, 
  ThunderboltOutlined, 
  BuildOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { RootState, AppDispatch } from './store';
import { GamePhase } from './types';
import { fossilApi } from './services/api';
import HomePage from './pages/HomePage';
import ExcavationPage from './pages/ExcavationPage';
import AssemblyPage from './pages/AssemblyPage';
import ReconstructionPage from './pages/ReconstructionPage';
import MuseumPage from './pages/MuseumPage';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentPhase, score, damagePenalty, session } = useSelector(
    (state: RootState) => state.game
  );

  const [fossilsLoaded, setFossilsLoaded] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fossilApi.initialize();
        setFossilsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize fossils:', error);
        message.error('无法初始化化石数据');
      }
    };

    initializeData();
  }, []);

  const getPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.EXCAVATION:
        return <BuildOutlined />;
      case GamePhase.ASSEMBLY:
        return <AppstoreOutlined />;
      case GamePhase.RECONSTRUCTION:
        return <ThunderboltOutlined />;
      case GamePhase.MUSEUM:
        return <TrophyOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '主页面',
    },
    {
      key: '/excavation',
      icon: <BuildOutlined />,
      label: '挖掘场',
      disabled: !session,
    },
    {
      key: '/assembly',
      icon: <AppstoreOutlined />,
      label: '拼装实验室',
      disabled: !session || currentPhase === GamePhase.EXCAVATION,
    },
    {
      key: '/reconstruction',
      icon: <ThunderboltOutlined />,
      label: '肌肉与运动',
      disabled: !session || currentPhase === GamePhase.EXCAVATION || currentPhase === GamePhase.ASSEMBLY,
    },
    {
      key: '/museum',
      icon: <TrophyOutlined />,
      label: '博物馆',
      disabled: !session,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ExperimentOutlined style={{ fontSize: 24, color: '#FFF8DC' }} />
          <h1 style={{ color: '#FFF8DC', margin: 0, fontSize: 20 }}>
            古生物化石拼装游戏
          </h1>
        </div>
        {session && (
          <Space>
            <Card size="small" style={{ background: 'transparent', border: '1px solid #FFF8DC', color: '#FFF8DC' }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>分数</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{score}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>损伤惩罚</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#CD5C5C' }}>
                    -{damagePenalty}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>当前阶段</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                    {getPhaseIcon(currentPhase)}{' '}
                    {currentPhase === GamePhase.EXCAVATION && '挖掘'}
                    {currentPhase === GamePhase.ASSEMBLY && '拼装'}
                    {currentPhase === GamePhase.RECONSTRUCTION && '重建'}
                    {currentPhase === GamePhase.MUSEUM && '博物馆'}
                  </div>
                </div>
              </div>
            </Card>
          </Space>
        )}
      </Header>
      <Layout>
        <Sider
          width={200}
          style={{ background: '#FFF8DC', borderRight: '1px solid #D2B48C' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ height: '100%', borderRight: 0, background: 'transparent' }}
          />
        </Sider>
        <Layout>
          <Content
            style={{
              margin: 0,
              padding: 24,
              minHeight: 280,
              overflow: 'auto',
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/excavation" element={<ExcavationPage />} />
              <Route path="/assembly" element={<AssemblyPage />} />
              <Route path="/reconstruction" element={<ReconstructionPage />} />
              <Route path="/museum" element={<MuseumPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
