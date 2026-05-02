import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Slider, 
  Radio, 
  Space, 
  Tag,
  Descriptions,
  Input
} from 'antd';
import { 
  EyeOutlined
} from '@ant-design/icons';
import { useKeyboardStore } from '../store';
import type { Keycap, Switch, KeycapStyle } from '../types';
import './KeycapPreview.css';

const { Option } = Select;

export const KeycapPreview: React.FC = () => {
  const { componentLibrary, currentKey, updateKey } = useKeyboardStore();
  
  const [, setSelectedKeycap] = useState<Keycap | null>(null);
  const [selectedSwitch, setSelectedSwitch] = useState<Switch | null>(null);
  const [keycapStyle, setKeycapStyle] = useState<KeycapStyle>({
    color: '#3a3a3a',
    textColor: '#ffffff',
    fontFamily: 'Arial',
    fontSize: 14,
    thickness: 4,
    profile: 'Cherry',
  });
  const [keyLabel, setKeyLabel] = useState(currentKey?.label || 'A');
  const [viewMode, setViewMode] = useState<'top' | 'side' | '3d'>('3d');

  useEffect(() => {
    if (currentKey) {
      setKeyLabel(currentKey.label);
      setKeycapStyle(currentKey.style);
    }
  }, [currentKey]);

  const handleKeycapSelect = (keycapId: string) => {
    const keycap = componentLibrary.keycaps.find(k => k.id === keycapId);
    if (keycap) {
      setSelectedKeycap(keycap);
      setKeycapStyle(prev => ({
        ...prev,
        color: keycap.colors[0],
        profile: keycap.profile,
      }));
    }
  };

  const handleSwitchSelect = (switchId: string) => {
    const sw = componentLibrary.switches.find(s => s.id === switchId);
    if (sw) {
      setSelectedSwitch(sw);
    }
  };

  const handleStyleChange = (field: keyof KeycapStyle, value: any) => {
    setKeycapStyle(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (currentKey) {
      updateKey(currentKey.id, {
        style: {
          ...currentKey.style,
          [field]: value,
        },
      });
    }
  };

  const handleLabelChange = (value: string) => {
    setKeyLabel(value);
    if (currentKey) {
      updateKey(currentKey.id, { label: value });
    }
  };

  const getSwitchTypeColor = (type: string) => {
    switch (type) {
      case 'linear': return '#1890ff';
      case 'tactile': return '#52c41a';
      case 'clicky': return '#fa8c16';
      default: return '#8c8c8c';
    }
  };

  const getSwitchTypeText = (type: string) => {
    switch (type) {
      case 'linear': return 'Linear';
      case 'tactile': return 'Tactile';
      case 'clicky': return 'Clicky';
      default: return type;
    }
  };

  const colorOptions = [
    '#3a3a3a',
    '#2D2D2D',
    '#E8E8E8',
    '#1B3A4B',
    '#E63946',
    '#000000',
    '#FFFFFF',
    '#F5F5DC'
  ];

  const renderColorOptions = () => {
    return colorOptions.map(color => (
      <div
        key={color}
        onClick={() => handleStyleChange('color', color)}
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: color,
          borderRadius: '4px',
          cursor: 'pointer',
          border: keycapStyle.color === color ? '2px solid #1890ff' : '2px solid transparent',
          boxShadow: keycapStyle.color === color ? '0 0 0 2px rgba(24, 144, 255, 0.3)' : 'none',
        }}
      />
    ));
  };

  const render3DView = () => {
    return (
      <div className="keycap-3d-container">
        <div 
          className="keycap-3d"
          style={{
            perspective: '800px',
            width: '200px',
            height: '200px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <div 
            className="keycap-wrapper"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(20deg) rotateY(-20deg)',
              width: '100%',
              height: '100%',
              transition: 'transform 0.5s ease',
              position: 'relative',
            }}
          >
            <div 
              className="keycap-top"
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                top: '40px',
                left: '40px',
                backgroundColor: keycapStyle.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: keycapStyle.textColor,
                fontSize: `${keycapStyle.fontSize + 8}px`,
                fontWeight: 'bold',
                fontFamily: keycapStyle.fontFamily,
                boxShadow: `
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.3)
                `,
                transform: 'translateZ(10px)',
              }}
            >
              <span>{keyLabel}</span>
            </div>

            <div 
              className="keycap-front"
              style={{
                position: 'absolute',
                width: '120px',
                height: `${keycapStyle.thickness + 10}px`,
                bottom: '20px',
                left: '40px',
                backgroundColor: keycapStyle.color,
                filter: 'brightness(0.8)',
                borderRadius: '0 0 8px 8px',
                transform: 'rotateX(90deg)',
                transformOrigin: 'top',
              }}
            />

            <div 
              className="keycap-right"
              style={{
                position: 'absolute',
                width: `${keycapStyle.thickness + 10}px`,
                height: '120px',
                top: '40px',
                right: '20px',
                backgroundColor: keycapStyle.color,
                filter: 'brightness(0.9)',
                borderRadius: '0 8px 8px 0',
                transform: 'rotateY(90deg)',
                transformOrigin: 'left',
              }}
            />

            {selectedSwitch && (
              <div 
                className="switch-stem"
                style={{
                  position: 'absolute',
                  width: '40px',
                  height: '40px',
                  top: '100px',
                  left: '80px',
                  backgroundColor: selectedSwitch.color,
                  borderRadius: '4px',
                  opacity: 0.8,
                  transform: 'translateZ(-20px)',
                  boxShadow: `0 0 10px ${selectedSwitch.color}50`,
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '16px',
                    height: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '2px',
                    opacity: 0.9,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="side-view-legend" style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div 
                style={{ 
                  width: '20px', height: '20px', backgroundColor: keycapStyle.color, margin: '0 auto 5px', borderRadius: '4px' 
                }}
              />
              <span style={{ fontSize: '12px', color: '#999' }}>Keycap</span>
            </div>
            {selectedSwitch && (
              <div>
                <div 
                  style={{ 
                    width: '20px', height: '20px', backgroundColor: selectedSwitch.color, margin: '0 auto 5px', borderRadius: '4px' 
                  }}
                />
                <span style={{ fontSize: '12px', color: '#999' }}>Switch Stem</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSideView = () => {
    return (
      <div className="keycap-side-container" style={{ textAlign: 'center', padding: '40px' }}>
        <svg width="300" height="200" viewBox="0 0 300 200">
          <defs>
            <linearGradient id="keycapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: keycapStyle.color, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: keycapStyle.color, stopOpacity: 0.7 }} />
            </linearGradient>
          </defs>

          <rect
            x="50"
            y={80 - keycapStyle.thickness}
            width="200"
            height={keycapStyle.thickness + 10}
            rx="4"
            fill="url(#keycapGradient)"
            stroke={keycapStyle.color}
            strokeWidth="1"
          />

          <polygon
            points={`60,${80 - keycapStyle.thickness} 240,${80 - keycapStyle.thickness} 230,${60 - keycapStyle.thickness} 70,${60 - keycapStyle.thickness}`}
            fill={keycapStyle.color}
            stroke={keycapStyle.color}
            opacity="0.9"
          />

          <text
            x="150"
            y={75 - keycapStyle.thickness}
            textAnchor="middle"
            fill={keycapStyle.textColor}
            fontFamily={keycapStyle.fontFamily}
            fontSize={keycapStyle.fontSize}
            fontWeight="bold"
          >
            {keyLabel}
          </text>

          {selectedSwitch && (
            <g>
              <rect
                x="130"
                y="90"
                width="40"
                height="30"
                fill={selectedSwitch.color}
                opacity="0.8"
              />
              <rect
                x="142"
                y="80"
                width="16"
                height="20"
                fill="#ffffff"
                opacity="0.9"
              />
            </g>
          )}

          <line
            x1="30"
            y1="130"
            x2="270"
            y2="130"
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x="150"
            y="150"
            textAnchor="middle"
            fill="#666"
            fontSize="12"
          >
            PCB / Plate
          </text>

          <line
            x1="50"
            y1={70 - keycapStyle.thickness}
            x2="50"
            y2="130"
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1="250"
            y1={70 - keycapStyle.thickness}
            x2="250"
            y2="130"
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="4"
          />

          <line
            x1="50"
            y1={50 - keycapStyle.thickness}
            x2="250"
            y2={50 - keycapStyle.thickness}
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <line
            x1="50"
            y1={90 - keycapStyle.thickness}
            x2="250"
            y2={90 - keycapStyle.thickness}
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="4"
          />

          <text
            x="150"
            y={70 - keycapStyle.thickness}
            textAnchor="middle"
            fill="#1890ff"
            fontSize="12"
            fontWeight="bold"
          >
            Thickness: {keycapStyle.thickness}mm
          </text>
        </svg>

        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '14px', color: '#999' }}>
          </span>
        </div>
      </div>
    );
  };

  const renderTopView = () => {
    return (
      <div className="keycap-top-container" style={{ textAlign: 'center', padding: '40px' }}>
        <div 
        style={{
          width: '120px',
          height: '120px',
          backgroundColor: keycapStyle.color,
          borderRadius: '8px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: keycapStyle.textColor,
          fontSize: `${keycapStyle.fontSize + 12}px`,
          fontWeight: 'bold',
          fontFamily: keycapStyle.fontFamily,
          boxShadow: `
            0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
        }}
      >
        <span style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
          {keyLabel}
        </span>
        
        <div 
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '10px',
            opacity: 0.5,
          }}
        >
          {keycapStyle.profile}
        </div>
      </div>

      {selectedSwitch && (
        <div style={{ marginTop: '20px' }}>
          <Tag color={getSwitchTypeColor(selectedSwitch.type)}>
            {selectedSwitch.name}
          </Tag>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
            Type: {getSwitchTypeText(selectedSwitch.type)}
          </div>
        </div>
      )}
      </div>
    );
  };

  return (
    <div className="keycap-preview-container">
      <Row gutter={16}>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <EyeOutlined />
                Keycap & Switch Preview
              </Space>
            }
            extra={
              <Radio.Group 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="top">Top</Radio.Button>
                <Radio.Button value="side">Side</Radio.Button>
                <Radio.Button value="3d">3D</Radio.Button>
              </Radio.Group>
            }
          >
            {viewMode === '3d' && render3DView()}
            {viewMode === 'side' && renderSideView()}
            {viewMode === 'top' && renderTopView()}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Keycap Settings" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Key Label
                </label>
                <Input
                  value={keyLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  maxLength={3}
                  style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Preset Keycaps
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select keycap set"
                  onChange={handleKeycapSelect}
                  allowClear
                >
                  {componentLibrary.keycaps.map(keycap => (
                    <Option key={keycap.id} value={keycap.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      </span>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: keycap.colors[0],
                          borderRadius: '2px',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}
                      />
                      {keycap.name} ({keycap.profile})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Keycap Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {renderColorOptions()}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Text Color
                </label>
                <Radio.Group 
                  value={keycapStyle.textColor}
                  onChange={(e) => handleStyleChange('textColor', e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="#ffffff">White</Radio.Button>
                  <Radio.Button value="#000000">Black</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Profile
                </label>
                <Select
                  style={{ width: '100%' }}
                  value={keycapStyle.profile}
                  onChange={(value) => handleStyleChange('profile', value)}
                >
                  <Option value="DSA">DSA</Option>
                  <Option value="SA">SA</Option>
                  <Option value="Cherry">Cherry</Option>
                  <Option value="OEM">OEM</Option>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Thickness: {keycapStyle.thickness}mm
                </label>
                <Slider
                  min={2}
                  max={8}
                  step={0.5}
                  value={keycapStyle.thickness}
                  onChange={(value) => handleStyleChange('thickness', value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  Font Size: {keycapStyle.fontSize}px
                </label>
                <Slider
                  min={8}
                  max={24}
                  step={1}
                  value={keycapStyle.fontSize}
                  onChange={(value) => handleStyleChange('fontSize', value)}
                />
              </div>
            </Space>
          </Card>

          <Card title="Switch Settings" size="small" style={{ marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                Select Switch
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select switch"
                onChange={handleSwitchSelect}
                allowClear
              >
                {componentLibrary.switches.map(sw => (
                  <Option key={sw.id} value={sw.id}>
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        backgroundColor: sw.color,
                        borderRadius: '2px',
                        display: 'inline-block',
                        marginRight: '8px'
                      }}
                    />
                    {sw.name}
                  </Option>
                ))}
              </Select>
            </div>

            {selectedSwitch && (
              <div style={{ marginTop: '16px' }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Brand">{selectedSwitch.brand}</Descriptions.Item>
                  <Descriptions.Item label="Type">
                    <Tag color={getSwitchTypeColor(selectedSwitch.type)}>
                      {getSwitchTypeText(selectedSwitch.type)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Actuation Force">
                    {selectedSwitch.force}g
                  </Descriptions.Item>
                  <Descriptions.Item label="Travel Distance">
                    {selectedSwitch.travel}mm
                  </Descriptions.Item>
                  <Descriptions.Item label="Feel Score">
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                      {selectedSwitch.feelScore}/10
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KeycapPreview;
