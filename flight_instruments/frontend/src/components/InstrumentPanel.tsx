import { Box, Group, Slider, Text, Title } from '@mantine/core';
import { Stage, Layer } from 'react-konva';
import { Altimeter } from './instruments/Altimeter';
import { AirspeedIndicator } from './instruments/AirspeedIndicator';
import { AttitudeIndicator } from './instruments/AttitudeIndicator';
import { HSI } from './instruments/HSI';
import { FlightDataType, ControlsType } from '../types/flight';
import { useState, useEffect } from 'react';

interface InstrumentPanelProps {
  flightData: FlightDataType;
  controls: ControlsType;
  onControlChange: (control: keyof ControlsType, value: number) => void;
  selectedMode: 'free' | 'navigation' | 'replay';
  selectedRecord: number | null;
  onReplayStop: () => void;
}

export function InstrumentPanel({
  flightData,
  controls,
  onControlChange,
  selectedMode,
  selectedRecord,
  onReplayStop,
}: InstrumentPanelProps) {
  const [replayData, setReplayData] = useState<FlightDataType[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);

  useEffect(() => {
    if (selectedMode === 'replay' && selectedRecord !== null) {
      loadRecordedData(selectedRecord);
    }
  }, [selectedMode, selectedRecord]);

  useEffect(() => {
    if (selectedMode === 'replay' && replayData.length > 0) {
      const interval = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= replayData.length - 1) {
            onReplayStop();
            return 0;
          }
          return prev + 1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [selectedMode, replayData, onReplayStop]);

  const loadRecordedData = async (recordId: number) => {
    try {
      const response = await fetch(`/api/records/${recordId}`);
      if (response.ok) {
        const data = await response.json();
        setReplayData(data.dataPoints);
        setReplayIndex(0);
      }
    } catch (error) {
      console.error('Failed to load record:', error);
    }
  };

  const displayData = selectedMode === 'replay' && replayData[replayIndex]
    ? replayData[replayIndex]
    : flightData;

  const instrumentSize = 300;
  const padding = 20;

  return (
    <Box>
      <Title order={3} mb="md" style={{ color: '#ffb800' }}>
        座舱仪表板
        {selectedMode === 'replay' && (
          <Text span ml="md" style={{ color: '#6a6a6a' }}>
            (回放模式)
          </Text>
        )}
      </Title>

      <Group grow mb="xl">
        <Box
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            border: '2px solid #3a3a3a',
            borderRadius: '8px',
            padding: padding,
          }}
        >
          <Stage width={instrumentSize} height={instrumentSize}>
            <Layer>
              <AirspeedIndicator airspeed={displayData.airspeed} />
            </Layer>
          </Stage>
          <Text ta="center" mt="sm" style={{ color: '#ffb800' }}>
            空速表
          </Text>
        </Box>

        <Box
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            border: '2px solid #3a3a3a',
            borderRadius: '8px',
            padding: padding,
          }}
        >
          <Stage width={instrumentSize} height={instrumentSize}>
            <Layer>
              <AttitudeIndicator
                pitch={displayData.pitch}
                roll={displayData.roll}
              />
            </Layer>
          </Stage>
          <Text ta="center" mt="sm" style={{ color: '#ffb800' }}>
            姿态仪
          </Text>
        </Box>

        <Box
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            border: '2px solid #3a3a3a',
            borderRadius: '8px',
            padding: padding,
          }}
        >
          <Stage width={instrumentSize} height={instrumentSize}>
            <Layer>
              <Altimeter
                altitude={displayData.altitude}
                verticalSpeed={displayData.verticalSpeed}
              />
            </Layer>
          </Stage>
          <Text ta="center" mt="sm" style={{ color: '#ffb800' }}>
            高度表
          </Text>
        </Box>

        <Box
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            border: '2px solid #3a3a3a',
            borderRadius: '8px',
            padding: padding,
          }}
        >
          <Stage width={instrumentSize} height={instrumentSize}>
            <Layer>
              <HSI
                heading={displayData.heading}
                course={0}
                deviation={0}
                distance={null}
              />
            </Layer>
          </Stage>
          <Text ta="center" mt="sm" style={{ color: '#ffb800' }}>
            水平状态指示器
          </Text>
        </Box>
      </Group>

      {selectedMode === 'free' && (
        <Box
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            border: '2px solid #3a3a3a',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <Title order={4} mb="md" style={{ color: '#ffb800' }}>
            飞行控制
          </Title>
          <Group grow>
            <Box>
              <Text mb="sm" style={{ color: '#ffffff' }}>
                升降舵 (俯仰): {controls.elevator}
              </Text>
              <Slider
                value={controls.elevator}
                onChange={(value) => onControlChange('elevator', value)}
                min={-15}
                max={15}
                step={0.5}
                color="metalYellow"
              />
            </Box>
            <Box>
              <Text mb="sm" style={{ color: '#ffffff' }}>
                副翼 (滚转): {controls.aileron}
              </Text>
              <Slider
                value={controls.aileron}
                onChange={(value) => onControlChange('aileron', value)}
                min={-20}
                max={20}
                step={0.5}
                color="metalYellow"
              />
            </Box>
            <Box>
              <Text mb="sm" style={{ color: '#ffffff' }}>
                方向舵 (偏航): {controls.rudder}
              </Text>
              <Slider
                value={controls.rudder}
                onChange={(value) => onControlChange('rudder', value)}
                min={-20}
                max={20}
                step={0.5}
                color="metalYellow"
              />
            </Box>
            <Box>
              <Text mb="sm" style={{ color: '#ffffff' }}>
                油门: {controls.throttle}%
              </Text>
              <Slider
                value={controls.throttle}
                onChange={(value) => onControlChange('throttle', value)}
                min={0}
                max={100}
                step={1}
                color="metalYellow"
              />
            </Box>
          </Group>
        </Box>
      )}
    </Box>
  );
}
