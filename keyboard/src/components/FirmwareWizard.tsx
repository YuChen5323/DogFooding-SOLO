import { useState } from 'react';
import {
  Steps,
  Card,
  Select,
  Input,
  Button,
  Switch,
  Slider,
  Row,
  Col,
  Space,
  message,
  Divider,
  Typography,
  Descriptions,
  Progress,
  Alert,
  Tag
} from 'antd';
import {
  ThunderboltOutlined,
  SettingOutlined,
  CodeOutlined,
  DownloadOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useKeyboardStore } from '../store';
import type { MCU, MatrixConfig, FirmwareConfig } from '../types';
import { firmwareApi } from '../api';
import './FirmwareWizard.css';

const { Option } = Select;
const { Title, Text } = Typography;

export const FirmwareWizard: React.FC = () => {
  const { componentLibrary, firmwareConfig, setFirmwareConfig, layout } = useKeyboardStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generatedHex, setGeneratedHex] = useState<string | null>(null);

  const [selectedMCU, setSelectedMCU] = useState<MCU>(firmwareConfig?.mcu || componentLibrary.mcus[0]);
  const [matrixConfig, setMatrixConfig] = useState<MatrixConfig>(
    firmwareConfig?.matrix || {
      rows: 6,
      cols: 15,
      rowPins: ['D0', 'D1', 'D2', 'D3', 'D4', 'C6'],
      colPins: ['D7', 'E6', 'B4', 'B5', 'B6', 'B2', 'B3', 'B1', 'F7', 'F6', 'F5', 'F4', 'F1', 'F0', 'D5'],
    }
  );
  const [features, setFeatures] = useState({
    rgb: firmwareConfig?.features.rgb || false,
    oled: firmwareConfig?.features.oled || false,
    encoder: firmwareConfig?.features.encoder || false,
    audio: firmwareConfig?.features.audio || false,
  });
  const [diodeDirection, setDiodeDirection] = useState<'COL2ROW' | 'ROW2COL'>(
    firmwareConfig?.diodeDirection || 'COL2ROW'
  );
  const [layerCount, setLayerCount] = useState(firmwareConfig?.keymapLayers || 2);

  const steps = [
    { title: 'MCU Selection', icon: <ThunderboltOutlined /> },
    { title: 'Matrix Config', icon: <SettingOutlined /> },
    { title: 'Features', icon: <CodeOutlined /> },
    { title: 'Generate', icon: <DownloadOutlined /> },
  ];

  const handleRowPinChange = (index: number, pin: string) => {
    const newRowPins = [...matrixConfig.rowPins];
    newRowPins[index] = pin;
    setMatrixConfig(prev => ({ ...prev, rowPins: newRowPins }));
  };

  const handleColPinChange = (index: number, pin: string) => {
    const newColPins = [...matrixConfig.colPins];
    newColPins[index] = pin;
    setMatrixConfig(prev => ({ ...prev, colPins: newColPins }));
  };

  const handleRowCountChange = (value: number) => {
    const newRowCount = value;
    const newRowPins = [...matrixConfig.rowPins];
    
    while (newRowPins.length < newRowCount) {
      newRowPins.push(selectedMCU.pins[newRowPins.length] || '');
    }
    while (newRowPins.length > newRowCount) {
      newRowPins.pop();
    }

    setMatrixConfig(prev => ({
      ...prev,
      rows: newRowCount,
      rowPins: newRowPins,
    }));
  };

  const handleColCountChange = (value: number) => {
    const newColCount = value;
    const newColPins = [...matrixConfig.colPins];
    
    while (newColPins.length < newColCount) {
      newColPins.push(selectedMCU.pins[newColPins.length + matrixConfig.rows] || '');
    }
    while (newColPins.length > newColCount) {
      newColPins.pop();
    }

    setMatrixConfig(prev => ({
      ...prev,
      cols: newColCount,
      colPins: newColPins,
    }));
  };

  const handleFeatureToggle = (feature: keyof typeof features, checked: boolean) => {
    setFeatures(prev => ({ ...prev, [feature]: checked }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!selectedMCU) {
          message.error('Please select an MCU');
          return false;
        }
        return true;
      case 1:
        if (matrixConfig.rows < 1 || matrixConfig.cols < 1) {
          message.error('Matrix must have at least 1 row and 1 column');
          return false;
        }
        if (matrixConfig.rowPins.some(pin => !pin) || matrixConfig.colPins.some(pin => !pin)) {
          message.error('All pins must be assigned');
          return false;
        }
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGenerateFirmware = async () => {
    if (!layout) {
      message.error('No keyboard layout found. Please create or load a layout first.');
      return;
    }

    const config: FirmwareConfig = {
      mcu: selectedMCU,
      matrix: matrixConfig,
      diodeDirection,
      features,
      keymapLayers: layerCount,
    };

    setIsGenerating(true);
    setGenerateProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const result = await firmwareApi.generateHex(config, layout);
      
      clearInterval(progressInterval);
      setGenerateProgress(100);

      if (result) {
        const reader = new FileReader();
        reader.onload = () => {
          setGeneratedHex(reader.result as string);
        };
        reader.readAsText(result);
        
        message.success('Firmware generated successfully!');
        
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keyboard_firmware_${Date.now()}.hex`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Firmware generation failed:', error);
      setGeneratedHex('// Mock firmware file\n:100000000C9435000C944D000C944D000C944D0074\n:100010000C944D000C944D000C944D000C944D0058\n:00000001FF');
      message.info('Using mock firmware - backend not connected');
      setGenerateProgress(100);
    } finally {
      setIsGenerating(false);
    }

    setFirmwareConfig(config);
  };

  const renderMCUStep = () => (
    <Card>
      <Title level={4}>Select Microcontroller</Title>
      <Divider />
      
      <Row gutter={[16, 16]}>
        {componentLibrary.mcus.map(mcu => (
          <Col xs={24} md={12} key={mcu.id}>
            <Card
              hoverable
              style={{
                cursor: 'pointer',
                border: selectedMCU.id === mcu.id ? '2px solid #1890ff' : '1px solid #333',
                backgroundColor: '#1f1f1f',
              }}
              onClick={() => setSelectedMCU(mcu)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                    {mcu.name}
                  </Text>
                  {selectedMCU.id === mcu.id && (
                    <CheckCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                  )}
                </div>
                
                <Tag color={mcu.supported ? 'success' : 'default'}>
                  {mcu.supported ? 'Supported' : 'Experimental'}
                </Tag>
                
                <Descriptions size="small" column={1} style={{ marginTop: '8px' }}>
                  <Descriptions.Item label="Firmware Type">{mcu.firmwareType}</Descriptions.Item>
                  <Descriptions.Item label="Available Pins">{mcu.pins.length}</Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedMCU && (
        <div style={{ marginTop: '24px' }}>
          <Title level={5}>Selected MCU: {selectedMCU.name}</Title>
          <Alert
            message={selectedMCU.firmwareType === 'QMK' ? 'QMK Firmware' : 'ZMK Firmware'}
            description={`This MCU uses ${selectedMCU.firmwareType} firmware. ${selectedMCU.pins.length} GPIO pins available.`}
            type="info"
            showIcon
          />
        </div>
      )}
    </Card>
  );

  const renderMatrixStep = () => (
    <Card>
      <Title level={4}>Matrix Configuration</Title>
      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
              Number of Rows: {matrixConfig.rows}
            </label>
            <Slider
              min={1}
              max={16}
              value={matrixConfig.rows}
              onChange={handleRowCountChange}
              marks={{ 1: '1', 4: '4', 8: '8', 12: '12', 16: '16' }}
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
              Number of Columns: {matrixConfig.cols}
            </label>
            <Slider
              min={1}
              max={20}
              value={matrixConfig.cols}
              onChange={handleColCountChange}
              marks={{ 1: '1', 5: '5', 10: '10', 15: '15', 20: '20' }}
            />
          </div>
        </Col>
      </Row>

      <Divider />

      <div>
        <Title level={5}>Diode Direction</Title>
        <Select
          style={{ width: 200 }}
          value={diodeDirection}
          onChange={(value: 'COL2ROW' | 'ROW2COL') => setDiodeDirection(value)}
        >
          <Option value="COL2ROW">Column to Row (COL2ROW)</Option>
          <Option value="ROW2COL">Row to Column (ROW2COL)</Option>
        </Select>
        <Text type="secondary" style={{ marginLeft: '16px' }}>
          {diodeDirection === 'COL2ROW' 
            ? 'Diodes point from columns to rows (most common)'
            : 'Diodes point from rows to columns'}
        </Text>
      </div>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Title level={5}>Row Pins</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: matrixConfig.rows }).map((_, index) => (
              <Select
                key={`row-${index}`}
                value={matrixConfig.rowPins[index] || ''}
                onChange={(value) => handleRowPinChange(index, value)}
                placeholder={`Select pin for Row ${index}`}
                allowClear
              >
                {selectedMCU.pins.map(pin => (
                  <Option key={pin} value={pin}>{pin}</Option>
                ))}
              </Select>
            ))}
          </div>
        </Col>
        
        <Col xs={24} md={12}>
          <Title level={5}>Column Pins</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: matrixConfig.cols }).map((_, index) => (
              <Select
                key={`col-${index}`}
                value={matrixConfig.colPins[index] || ''}
                onChange={(value) => handleColPinChange(index, value)}
                placeholder={`Select pin for Column ${index}`}
                allowClear
              >
                {selectedMCU.pins.map(pin => (
                  <Option key={pin} value={pin}>{pin}</Option>
                ))}
              </Select>
            ))}
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderFeaturesStep = () => (
    <Card>
      <Title level={4}>Feature Configuration</Title>
      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>RGB Lighting</Text>
                <Switch
                  checked={features.rgb}
                  onChange={(checked) => handleFeatureToggle('rgb', checked)}
                />
              </div>
              {features.rgb && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Enable RGB underglow and per-key RGB lighting
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>OLED Display</Text>
                <Switch
                  checked={features.oled}
                  onChange={(checked) => handleFeatureToggle('oled', checked)}
                />
              </div>
              {features.oled && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Support for 128x32 or 128x64 OLED displays
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Rotary Encoder</Text>
                <Switch
                  checked={features.encoder}
                  onChange={(checked) => handleFeatureToggle('encoder', checked)}
                />
              </div>
              {features.encoder && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Support for EC11 rotary encoders (volume control, etc.)
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Audio / Speaker</Text>
                <Switch
                  checked={features.audio}
                  onChange={(checked) => handleFeatureToggle('audio', checked)}
                />
              </div>
              {features.audio && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Buzzer or speaker for audio feedback and melodies
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <div>
        <Title level={5}>Keymap Layers</Title>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
            Number of Layers: {layerCount}
          </label>
          <Slider
            min={1}
            max={8}
            value={layerCount}
            onChange={setLayerCount}
            marks={{ 1: '1', 2: '2', 4: '4', 6: '6', 8: '8' }}
          />
          <Text type="secondary">
            Most keyboards use 2-4 layers. Layer 0 is the base layer.
          </Text>
        </div>
      </div>

      <Divider />

      <Card size="small" title="Configuration Summary" style={{ backgroundColor: '#1f1f1f' }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="MCU">{selectedMCU.name}</Descriptions.Item>
          <Descriptions.Item label="Firmware">{selectedMCU.firmwareType}</Descriptions.Item>
          <Descriptions.Item label="Matrix">
            {matrixConfig.rows}x{matrixConfig.cols}
          </Descriptions.Item>
          <Descriptions.Item label="Diode">{diodeDirection}</Descriptions.Item>
          <Descriptions.Item label="Layers">{layerCount}</Descriptions.Item>
          <Descriptions.Item label="Features">
            {[
              features.rgb && 'RGB',
              features.oled && 'OLED',
              features.encoder && 'Encoder',
              features.audio && 'Audio'
            ].filter(Boolean).join(', ') || 'None'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Card>
  );

  const renderGenerateStep = () => (
    <Card>
      <Title level={4}>Generate Firmware</Title>
      <Divider />

      <Card size="small" title="Final Configuration" style={{ marginBottom: '16px', backgroundColor: '#1f1f1f' }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="MCU">{selectedMCU.name}</Descriptions.Item>
          <Descriptions.Item label="Matrix">{matrixConfig.rows} x {matrixConfig.cols}</Descriptions.Item>
          <Descriptions.Item label="Diode Direction">{diodeDirection}</Descriptions.Item>
          <Descriptions.Item label="Layers">{layerCount}</Descriptions.Item>
          <Descriptions.Item label="Features">
            {[
              features.rgb && 'RGB',
              features.oled && 'OLED',
              features.encoder && 'Encoder',
              features.audio && 'Audio'
            ].filter(Boolean).join(', ') || 'Basic'}
          </Descriptions.Item>
          <Descriptions.Item label="Layout Keys">{layout?.keys.length || 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      {isGenerating && (
        <div style={{ marginBottom: '16px' }}>
          <Text>Generating firmware...</Text>
          <Progress percent={Math.round(generateProgress)} status="active" />
        </div>
      )}

      {generatedHex && (
        <Alert
          message="Firmware Generated Successfully"
          description="Your firmware hex file has been generated and downloaded. You can flash it to your keyboard using QMK Toolbox or similar tools."
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Space>
        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          onClick={handleGenerateFirmware}
          loading={isGenerating}
          disabled={isGenerating}
        >
          {generatedHex ? 'Regenerate Firmware' : 'Generate & Download Firmware'}
        </Button>
        
        <Button
          size="large"
          icon={<SaveOutlined />}
          onClick={() => {
            setFirmwareConfig({
              mcu: selectedMCU,
              matrix: matrixConfig,
              diodeDirection,
              features,
              keymapLayers: layerCount,
            });
            message.success('Configuration saved');
          }}
        >
          Save Configuration
        </Button>
      </Space>

      {generatedHex && (
        <div style={{ marginTop: '24px' }}>
          <Title level={5}>Generated HEX Preview (first 500 chars)</Title>
          <Input.TextArea
            value={generatedHex.substring(0, 500) + '...'}
            readOnly
            rows={6}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
        </div>
      )}
    </Card>
  );

  return (
    <div className="firmware-wizard-container">
      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
        
        <div style={{ minHeight: '400px' }}>
          {currentStep === 0 && renderMCUStep()}
          {currentStep === 1 && renderMatrixStep()}
          {currentStep === 2 && renderFeaturesStep()}
          {currentStep === 3 && renderGenerateStep()}
        </div>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default FirmwareWizard;
