import { Box, Group, Title } from '@mantine/core';
import { useState } from 'react';
import { InstrumentPanel } from './components/InstrumentPanel';
import { NavigationPanel } from './components/NavigationPanel';
import { RecordingPanel } from './components/RecordingPanel';
import { useFlightState } from './hooks/useFlightState';
import { FlightDataType } from './types/flight';

export function App() {
  const { flightData, controls, isRecording, toggleRecording, updateControls, resetFlight } = useFlightState();
  const [selectedMode, setSelectedMode] = useState<'free' | 'navigation' | 'replay'>('free');
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);

  const handleControlChange = (control: keyof typeof controls, value: number) => {
    updateControls({ [control]: value } as Partial<typeof controls>);
  };

  const handleReplayStart = (recordId: number) => {
    setSelectedMode('replay');
    setSelectedRecord(recordId);
  };

  const handleReplayStop = () => {
    setSelectedMode('free');
    setSelectedRecord(null);
    resetFlight();
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
        padding: '20px',
      }}
    >
      <Title order={1} mb="xl" style={{ textAlign: 'center' }}>
        飞行仪表模拟器
      </Title>

      <Group grow mb="xl">
        <RecordingPanel
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          onReplayStart={handleReplayStart}
          onReplayStop={handleReplayStop}
          selectedMode={selectedMode}
        />
        <NavigationPanel
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          flightData={flightData}
        />
      </Group>

      <InstrumentPanel
        flightData={flightData}
        controls={controls}
        onControlChange={handleControlChange}
        selectedMode={selectedMode}
        selectedRecord={selectedRecord}
        onReplayStop={handleReplayStop}
      />
    </Box>
  );
}
