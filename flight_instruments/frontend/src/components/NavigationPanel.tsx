import { Box, Button, Group, Select, Slider, Text, Title } from '@mantine/core';
import { useState, useEffect } from 'react';
import { FlightDataType, NavigationStation, NavigationExercise, ExerciseScore } from '../types/flight';

interface NavigationPanelProps {
  selectedMode: 'free' | 'navigation' | 'replay';
  onModeChange: (mode: 'free' | 'navigation' | 'replay') => void;
  flightData: FlightDataType;
}

export function NavigationPanel({ selectedMode, onModeChange, flightData }: NavigationPanelProps) {
  const [stations, setStations] = useState<NavigationStation[]>([]);
  const [exercises, setExercises] = useState<NavigationExercise[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [targetRadial, setTargetRadial] = useState(0);
  const [score, setScore] = useState<ExerciseScore | null>(null);

  useEffect(() => {
    loadNavigationData();
  }, []);

  const loadNavigationData = async () => {
    try {
      const stationsResponse = await fetch('/api/navigation/stations');
      if (stationsResponse.ok) {
        const data = await stationsResponse.json();
        setStations(data);
      }

      const exercisesResponse = await fetch('/api/navigation/exercises');
      if (exercisesResponse.ok) {
        const data = await exercisesResponse.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Failed to load navigation data:', error);
    }
  };

  const calculateRadial = (station: NavigationStation, lat: number, lng: number) => {
    const dLat = (lat - station.lat) * (Math.PI / 180);
    const dLng = (lng - station.lng) * (Math.PI / 180);
    
    let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    return angle;
  };

  const calculateDistance = (station: NavigationStation, lat: number, lng: number) => {
    const R = 3440.069;
    const dLat = (lat - station.lat) * (Math.PI / 180);
    const dLng = (lng - station.lng) * (Math.PI / 180);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(station.lat * (Math.PI / 180)) *
        Math.cos(lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  };

  const calculateScore = () => {
    if (!selectedStation) return;
    
    const station = stations.find(s => s.id.toString() === selectedStation);
    if (!station) return;
    
    const currentRadial = calculateRadial(station, flightData.lat, flightData.lng);
    const radialError = Math.abs(currentRadial - targetRadial);
    const normalizedError = Math.min(radialError, 360 - radialError) / 180;
    
    const accuracy = 100 * (1 - normalizedError);
    const time = 0;
    const totalScore = accuracy * 0.8 + (100 - time * 0.1);
    
    setScore({
      accuracy: Math.round(accuracy),
      time: Math.round(time),
      totalScore: Math.round(totalScore),
    });
  };

  const currentStation = selectedStation 
    ? stations.find(s => s.id.toString() === selectedStation) 
    : null;
  
  const currentRadial = currentStation 
    ? calculateRadial(currentStation, flightData.lat, flightData.lng) 
    : 0;
  
  const currentDistance = currentStation 
    ? calculateDistance(currentStation, flightData.lat, flightData.lng) 
    : 0;

  return (
    <Box
      style={{
        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        border: '2px solid #3a3a3a',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <Title order={4} mb="md" style={{ color: '#ffb800' }}>
        导航练习
      </Title>

      <Group grow mb="md">
        <Button
          variant={selectedMode === 'free' ? 'filled' : 'outline'}
          color="metalYellow"
          onClick={() => onModeChange('free')}
        >
          自由飞行
        </Button>
        <Button
          variant={selectedMode === 'navigation' ? 'filled' : 'outline'}
          color="metalYellow"
          onClick={() => onModeChange('navigation')}
        >
          导航练习
        </Button>
      </Group>

      {selectedMode === 'navigation' && (
        <Box>
          <Group grow mb="md">
            <Select
              label="导航台"
              placeholder="选择导航台"
              data={stations.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.frequency})` }))}
              value={selectedStation}
              onChange={setSelectedStation}
            />
            
            <Select
              label="练习场景"
              placeholder="选择练习"
              data={exercises.map(e => ({ value: e.id.toString(), label: e.name }))}
              value={selectedExercise}
              onChange={setSelectedExercise}
            />
          </Group>

          {selectedStation && (
            <Box mb="md">
              <Text mb="sm" style={{ color: '#ffffff' }}>
                目标径向线: {targetRadial}°
              </Text>
              <Slider
                value={targetRadial}
                onChange={setTargetRadial}
                min={0}
                max={360}
                step={1}
                color="metalYellow"
                marks={[
                  { value: 0, label: '0°' },
                  { value: 90, label: '90°' },
                  { value: 180, label: '180°' },
                  { value: 270, label: '270°' },
                  { value: 360, label: '360°' },
                ]}
              />
            </Box>
          )}

          {currentStation && (
            <Box
              style={{
                background: '#0a0a0a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '15px',
              }}
            >
              <Text mb="sm" style={{ color: '#ffb800', fontWeight: 'bold' }}>
                当前状态
              </Text>
              <Group grow>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    径向线
                  </Text>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {currentRadial.toFixed(1)}°
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    距离
                  </Text>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {currentDistance.toFixed(1)} NM
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    偏差
                  </Text>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {Math.min(Math.abs(currentRadial - targetRadial), 360 - Math.abs(currentRadial - targetRadial)).toFixed(1)}°
                  </Text>
                </Box>
              </Group>
            </Box>
          )}

          {score && (
            <Box
              style={{
                background: '#0a0a0a',
                border: '1px solid #ffb800',
                borderRadius: '4px',
                padding: '15px',
              }}
            >
              <Text mb="sm" style={{ color: '#ffb800', fontWeight: 'bold' }}>
                练习评分
              </Text>
              <Group grow>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    精确度
                  </Text>
                  <Text style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '24px' }}>
                    {score.accuracy}%
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    用时
                  </Text>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '24px' }}>
                    {score.time}s
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    总分
                  </Text>
                  <Text style={{ color: '#ffb800', fontWeight: 'bold', fontSize: '24px' }}>
                    {score.totalScore}
                  </Text>
                </Box>
              </Group>
            </Box>
          )}

          <Group grow>
            <Button
              color="metalYellow"
              onClick={calculateScore}
              disabled={!selectedStation}
            >
              计算评分
            </Button>
            <Button
              variant="outline"
              color="metalYellow"
              onClick={() => {
                setScore(null);
                setSelectedStation(null);
                setSelectedExercise(null);
              }}
            >
              重置练习
            </Button>
          </Group>
        </Box>
      )}
    </Box>
  );
}
