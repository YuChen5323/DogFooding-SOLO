import { useState, useRef, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Slider, 
  Select, 
  Divider, 
  Row, 
  Col, 
  message,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  SettingOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useKeyboardStore } from '../store';
import type { KeyboardKey as KeyboardKeyType } from '../types';
import KeyboardKeyComponent from './KeyboardKey';
import './LayoutEditor.css';

const { Option } = Select;

export const LayoutEditor: React.FC = () => {
  const { 
    layout, 
    currentKey, 
    setCurrentKey, 
    updateKey, 
    addKey, 
    removeKey,
    resetLayout,
    setLayout
  } = useKeyboardStore();
  
  const [draggedKey, setDraggedKey] = useState<KeyboardKeyType | null>(null);
  const [layoutName, setLayoutName] = useState(layout?.name || 'New Layout');
  const [keySpacing, setKeySpacing] = useState(layout?.keySpacing || 2);
  const [unitSize, setUnitSize] = useState(layout?.unitSize || 44);
  const [gridVisible] = useState(true);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const handleKeySelect = useCallback((key: KeyboardKeyType) => {
    setCurrentKey(key);
  }, [setCurrentKey]);

  const handleDragStart = useCallback((e: React.DragEvent, key: KeyboardKeyType) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!editorRef.current || !draggedKey) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const snappedX = Math.round(x / (unitSize + keySpacing)) * (unitSize + keySpacing);
    const snappedY = Math.round(y / (unitSize + keySpacing)) * (unitSize + keySpacing);

    updateKey(draggedKey.id, {
      position: {
        ...draggedKey.position,
        x: snappedX,
        y: snappedY,
      },
    });

    setDraggedKey(null);
    message.success('Key position updated');
  }, [draggedKey, unitSize, keySpacing, updateKey]);

  const handleAddKey = () => {
    const newKey: KeyboardKeyType = {
      id: `key-${Date.now()}`,
      position: {
        row: 0,
        col: 0,
        x: 0,
        y: 0,
      },
      size: {
        width: unitSize,
        height: unitSize,
      },
      label: 'New',
      keycode: 'KC_NEW',
      style: {
        color: '#3a3a3a',
        textColor: '#ffffff',
        fontFamily: 'Arial',
        fontSize: 12,
        thickness: 4,
        profile: 'Cherry',
      },
    };

    addKey(newKey);
    message.success('New key added');
  };

  const handleRemoveKey = () => {
    if (currentKey) {
      removeKey(currentKey.id);
      setCurrentKey(null);
      message.success('Key removed');
    }
  };

  const handleSaveLayout = () => {
    if (layout) {
      setLayout({
        ...layout,
        name: layoutName,
        keySpacing,
        unitSize,
      });
      message.success('Layout saved');
    }
  };

  const handleResetLayout = () => {
    resetLayout();
    setLayoutName('Default 60% Layout');
    setKeySpacing(2);
    setUnitSize(44);
    message.info('Layout reset to default');
  };

  const handleKeyLabelChange = (value: string) => {
    if (currentKey) {
      updateKey(currentKey.id, { label: value });
    }
  };

  const handleKeycodeChange = (value: string) => {
    if (currentKey) {
      updateKey(currentKey.id, { keycode: value });
    }
  };

  const handleKeyColorChange = (value: string) => {
    if (currentKey) {
      updateKey(currentKey.id, {
        style: {
          ...currentKey.style,
          color: value,
        },
      });
    }
  };

  const handleKeyWidthChange = (value: number) => {
    if (currentKey) {
      updateKey(currentKey.id, {
        size: {
          ...currentKey.size,
          width: value * unitSize + (value - 1) * keySpacing,
        },
      });
    }
  };

  const handleKeyHeightChange = (value: number) => {
    if (currentKey) {
      updateKey(currentKey.id, {
        size: {
          ...currentKey.size,
          height: value * unitSize + (value - 1) * keySpacing,
        },
      });
    }
  };

  const handleSpacingChange = (value: number) => {
    setKeySpacing(value);
    if (layout) {
      setLayout({
        ...layout,
        keySpacing: value,
      });
    }
  };

  const handleUnitSizeChange = (value: number) => {
    setUnitSize(value);
    if (layout) {
      setLayout({
        ...layout,
        unitSize: value,
      });
    }
  };

  const generateKeyMatrix = () => {
    if (!layout) return;
    
    const rows = Math.max(...layout.keys.map(k => k.position.row)) + 1;
    const cols = Math.max(...layout.keys.map(k => k.position.col)) + 1;
    
    const matrix: (string | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    layout.keys.forEach(key => {
      if (key.matrixRow !== undefined && key.matrixCol !== undefined) {
        matrix[key.matrixRow][key.matrixCol] = key.keycode;
      }
    });
    
    console.log('Key Matrix:', matrix);
    message.success('Key matrix generated and logged to console');
  };

  if (!layout) {
    return (
      <div className="layout-editor-container">
        <Card>
          <p>No layout loaded. Please create or load a layout.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="layout-editor-container">
      <Row gutter={16}>
        <Col span={18}>
          <Card 
            title={
              <Space>
                <SettingOutlined />
                <Input 
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  style={{ width: 200 }}
                  bordered={false}
                />
              </Space>
            }
            extra={
              <Space>
                <Button 
                  icon={<SwapOutlined />} 
                  onClick={generateKeyMatrix}
                >
                  Generate Matrix
                </Button>
                <Button 
                  icon={<SaveOutlined />} 
                  type="primary"
                  onClick={handleSaveLayout}
                >
                  Save Layout
                </Button>
                <Popconfirm
                  title="Reset Layout?"
                  description="This will reset to the default layout. Are you sure?"
                  onConfirm={handleResetLayout}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button icon={<ReloadOutlined />}>Reset</Button>
                </Popconfirm>
              </Space>
            }
          >
            <div 
              ref={editorRef}
              className="layout-editor"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                minHeight: '400px',
                background: gridVisible ? `
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)
                ` : 'transparent',
                backgroundSize: `${unitSize + keySpacing}px ${unitSize + keySpacing}px`,
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                padding: '20px',
                overflow: 'auto',
              }}
            >
              {layout.keys.map((key) => (
                <KeyboardKeyComponent
                  key={key.id}
                  keyData={key}
                  isSelected={currentKey?.id === key.id}
                  onSelect={handleKeySelect}
                  onDragStart={handleDragStart}
                  draggable={true}
                />
              ))}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card title="Toolbar" size="small" className="editor-toolbar">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                icon={<PlusOutlined />} 
                block
                onClick={handleAddKey}
              >
                Add Key
              </Button>
              
              <Button 
                icon={<DeleteOutlined />} 
                block
                danger
                disabled={!currentKey}
                onClick={handleRemoveKey}
              >
                Remove Selected Key
              </Button>

              <Divider />

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#999' }}>
                  Key Spacing: {keySpacing}px
                </label>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={keySpacing}
                  onChange={handleSpacingChange}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#999' }}>
                  Unit Size: {unitSize}px
                </label>
                <Slider
                  min={30}
                  max={60}
                  step={2}
                  value={unitSize}
                  onChange={handleUnitSizeChange}
                />
              </div>

              <Divider />

              {currentKey && (
                <div className="key-properties">
                  <h4 style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
                    Key Properties: {currentKey.label}
                  </h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      Label
                    </label>
                    <Input
                      value={currentKey.label}
                      onChange={(e) => handleKeyLabelChange(e.target.value)}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      Keycode
                    </label>
                    <Input
                      value={currentKey.keycode}
                      onChange={(e) => handleKeycodeChange(e.target.value)}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      Color
                    </label>
                    <Select
                      value={currentKey.style.color}
                      onChange={handleKeyColorChange}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      <Option value="#3a3a3a">Dark Gray</Option>
                      <Option value="#2D2D2D">Charcoal</Option>
                      <Option value="#E8E8E8">Light Gray</Option>
                      <Option value="#1B3A4B">Navy</Option>
                      <Option value="#E63946">Red</Option>
                      <Option value="#000000">Black</Option>
                      <Option value="#FFFFFF">White</Option>
                    </Select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      Width (units): {Math.round(currentKey.size.width / (unitSize + keySpacing))}
                    </label>
                    <Slider
                      min={1}
                      max={6.25}
                      step={0.25}
                      value={currentKey.size.width / (unitSize + keySpacing)}
                      onChange={handleKeyWidthChange}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      Height (units): {Math.round(currentKey.size.height / (unitSize + keySpacing))}
                    </label>
                    <Slider
                      min={1}
                      max={2}
                      step={0.25}
                      value={currentKey.size.height / (unitSize + keySpacing)}
                      onChange={handleKeyHeightChange}
                    />
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LayoutEditor;
