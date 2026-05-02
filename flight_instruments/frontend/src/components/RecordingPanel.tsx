import { Box, Button, Group, List, Text, Title, Modal, Center, ActionIcon } from '@mantine/core';
import { useState, useEffect } from 'react';
import { FlightRecord } from '../types/flight';
import { IconPlayerPlay, IconPlayerStop, IconTrash } from '@tabler/icons-react';

interface RecordingPanelProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onReplayStart: (recordId: number) => void;
  onReplayStop: () => void;
  selectedMode: 'free' | 'navigation' | 'replay';
}

export function RecordingPanel({
  isRecording,
  onToggleRecording,
  onReplayStart,
  onReplayStop,
  selectedMode,
}: RecordingPanelProps) {
  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await fetch('/api/records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setRecords(records.filter(r => r.id !== recordId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = Math.floor(endTime - startTime);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

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
        飞行记录
      </Title>

      <Group grow mb="md">
        <Button
          color={isRecording ? 'red' : 'metalYellow'}
          leftSection={
            isRecording ? (
              <IconPlayerStop size={20} />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: isRecording ? '#ff0000' : '#ffb800',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            )
          }
          onClick={onToggleRecording}
          disabled={selectedMode === 'replay'}
        >
          {isRecording ? '停止录制' : '开始录制'}
        </Button>
        
        {selectedMode === 'replay' && (
          <Button
            color="red"
            leftSection={<IconPlayerStop size={20} />}
            onClick={onReplayStop}
          >
            停止回放
          </Button>
        )}
      </Group>

      {isRecording && (
        <Box
          mb="md"
          style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid #ff0000',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <Text style={{ color: '#ff0000', fontWeight: 'bold' }}>
            ● 正在录制中...
          </Text>
        </Box>
      )}

      <Title order={5} mb="sm" style={{ color: '#ffffff' }}>
        历史记录
      </Title>
      
      {records.length === 0 ? (
        <Text style={{ color: '#6a6a6a', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
          暂无飞行记录
        </Text>
      ) : (
        <List
          spacing="sm"
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {records.map((record) => (
            <List.Item
              key={record.id}
              style={{
                padding: '10px',
                backgroundColor: selectedRecord === record.id ? 'rgba(255, 184, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                border: selectedRecord === record.id ? '1px solid #ffb800' : '1px solid #3a3a3a',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Box style={{ flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {record.name}
                  </Text>
                  <Text size="sm" style={{ color: '#6a6a6a' }}>
                    时长: {formatDuration(record.startTime, record.endTime)} | 
                    数据点: {record.dataPoints.length}
                  </Text>
                </Box>
                
                {selectedMode !== 'replay' && (
                  <Group gap="xs">
                    <ActionIcon
                      color="metalYellow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplayStart(record.id);
                      }}
                    >
                      <IconPlayerPlay size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(record.id);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </List.Item>
          ))}
        </List>
      )}

      <Modal
        opened={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
        centered
      >
        <Text mb="md">
          确定要删除这条飞行记录吗？此操作无法撤销。
        </Text>
        <Group justify="flex-end">
          <Button
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
          >
            取消
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (deleteConfirm !== null) {
                handleDeleteRecord(deleteConfirm);
              }
            }}
          >
            删除
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
