import { useState } from 'react';
import { Layout, Menu, Button, Space, Badge, Drawer } from 'antd';
import {
  KeyOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  MenuOutlined,
  GithubOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useKeyboardStore } from './store';
import LayoutEditor from './components/LayoutEditor';
import KeycapPreview from './components/KeycapPreview';
import FirmwareWizard from './components/FirmwareWizard';
import TypingGame from './components/TypingGame';
import './App.css';

const { Header, Sider, Content } = Layout;

type MenuKey = 'layout' | 'preview' | 'firmware' | 'typing';

const menuItems = [
  {
    key: 'layout',
    icon: <KeyOutlined />,
    label: 'Layout Editor',
    description: 'Design your keyboard layout',
  },
  {
    key: 'preview',
    icon: <EyeOutlined />,
    label: 'Keycap Preview',
    description: 'Customize keycaps & switches',
  },
  {
    key: 'firmware',
    icon: <ThunderboltOutlined />,
    label: 'Firmware Config',
    description: 'Configure MCU & generate QMK',
  },
  {
    key: 'typing',
    icon: <TrophyOutlined />,
    label: 'Typing Test',
    description: 'Test your keyboard feel',
  },
];

export default function App() {
  const { layout } = useKeyboardStore();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('layout');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    setActiveMenu(key as MenuKey);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'layout':
        return <LayoutEditor />;
      case 'preview':
        return <KeycapPreview />;
      case 'firmware':
        return <FirmwareWizard />;
      case 'typing':
        return <TypingGame />;
      default:
        return <LayoutEditor />;
    }
  };

  return (
    <Layout className="main-layout">
      <Header className="app-header">
        <div className="header-left">
          <Button
            className="mobile-menu-btn"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
          />
          <div className="logo">
            <KeyOutlined style={{ fontSize: '24px' }} />
            <span className="logo-text">KeyDesigner</span>
          </div>
        </div>
        
        <div className="header-right">
          <Space>
            <Badge dot={!!layout}>
              <Button type="text" icon={<SaveOutlined />}>
                Save
              </Button>
            </Badge>
            <Button type="text" icon={<GithubOutlined />}>
              GitHub
            </Button>
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider 
          className="app-sider"
          width={240}
          breakpoint="md"
          collapsedWidth="0"
          trigger={null}
        >
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            onClick={handleMenuClick}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: (
                <div className="menu-item-content">
                  <span className="menu-item-label">{item.label}</span>
                  <span className="menu-item-desc">{item.description}</span>
                </div>
              ),
            }))}
          />

          <div className="sider-footer">
            <div className="version-info">
              <span className="version-label">v1.0.0</span>
              <span className="beta-tag">BETA</span>
            </div>
          </div>
        </Sider>

        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
        >
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            onClick={handleMenuClick}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: (
                <div className="menu-item-content">
                  <span className="menu-item-label">{item.label}</span>
                  <span className="menu-item-desc">{item.description}</span>
                </div>
              ),
            }))}
          />
        </Drawer>

        <Content className="app-content">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
