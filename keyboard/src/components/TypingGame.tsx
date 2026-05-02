import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Progress,
  Alert,
  Typography,
  Input,
  Select
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useKeyboardStore } from '../store';
import type { TypingStats } from '../types';
import './TypingGame.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice.",
  "Programming is the art of telling a computer what to do through a set of instructions called code. Good programmers write code that humans can understand.",
  "Mechanical keyboards offer a superior typing experience with their individual switches. Each key has its own mechanism, providing tactile feedback and satisfying sounds.",
  "Practice makes perfect. The more you type, the better you become. Focus on accuracy first, then speed will follow naturally over time.",
  "Technology is best when it brings people together. Great tools empower creativity and enable us to achieve things we never thought possible."
];

const fingerKeyMapping: Record<string, string> = {
  'q': 'left_pinky', 'a': 'left_pinky', 'z': 'left_pinky',
  'w': 'left_ring', 's': 'left_ring', 'x': 'left_ring',
  'e': 'left_middle', 'd': 'left_middle', 'c': 'left_middle',
  'r': 'left_index', 'f': 'left_index', 'v': 'left_index', 't': 'left_index', 'g': 'left_index', 'b': 'left_index',
  'y': 'right_index', 'h': 'right_index', 'n': 'right_index', 'u': 'right_index', 'j': 'right_index', 'm': 'right_index',
  'i': 'right_middle', 'k': 'right_middle', ',': 'right_middle',
  'o': 'right_ring', 'l': 'right_ring', '.': 'right_ring',
  'p': 'right_pinky', ';': 'right_pinky', '/': 'right_pinky',
  ' ': 'thumb'
};

const fingerNames: Record<string, string> = {
  left_pinky: 'Left Pinky',
  left_ring: 'Left Ring',
  left_middle: 'Left Middle',
  left_index: 'Left Index',
  thumb: 'Thumb',
  right_index: 'Right Index',
  right_middle: 'Right Middle',
  right_ring: 'Right Ring',
  right_pinky: 'Right Pinky'
};

const fingerColors: Record<string, string> = {
  left_pinky: '#ff6b6b',
  left_ring: '#ffa94d',
  left_middle: '#ffd43b',
  left_index: '#69db7c',
  thumb: '#74c0fc',
  right_index: '#69db7c',
  right_middle: '#ffd43b',
  right_ring: '#ffa94d',
  right_pinky: '#ff6b6b'
};

export const TypingGame: React.FC = () => {
  const { setTypingStats } = useKeyboardStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [targetText, setTargetText] = useState(sampleTexts[0]);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [fingerHeatmap, setFingerHeatmap] = useState<Record<string, number>>({});
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showResults, setShowResults] = useState(false);
  
  const inputRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCurrentWPM = useCallback(() => {
    if (!startTime || elapsedTime === 0) return 0;
    const minutes = elapsedTime / 60;
    const words = correctChars / 5;
    return Math.round(words / minutes);
  }, [startTime, elapsedTime, correctChars]);

  const getAccuracy = useCallback(() => {
    if (totalCharsTyped === 0) return 100;
    return Math.round((correctChars / totalCharsTyped) * 100);
  }, [totalCharsTyped, correctChars]);

  const getFeelScore = useCallback(() => {
    const wpm = getCurrentWPM();
    const accuracy = getAccuracy();
    const wpmScore = Math.min(wpm / 80, 1) * 40;
    const accuracyScore = (accuracy / 100) * 40;
    
    const fingerUsage = Object.values(fingerHeatmap);
    const totalUsage = fingerUsage.reduce((a, b) => a + b, 0);
    let distributionScore = 20;
    if (totalUsage > 0) {
      const avgFinger = totalUsage / fingerUsage.length;
      const variance = fingerUsage.reduce((sum, usage) => sum + Math.pow(usage - avgFinger, 2), 0) / fingerUsage.length;
      const stdDev = Math.sqrt(variance);
      distributionScore = Math.max(0, 20 - (stdDev / avgFinger) * 10);
    }
    
    return Math.round(wpmScore + accuracyScore + distributionScore);
  }, [getCurrentWPM, getAccuracy, fingerHeatmap]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isPlaying || isPaused) return;

    const newValue = e.target.value;
    setUserInput(newValue);

    const charIndex = newValue.length - 1;
    if (charIndex >= 0 && charIndex < targetText.length) {
      const typedChar = newValue[charIndex];
      const expectedChar = targetText[charIndex];
      
      setTotalCharsTyped(prev => prev + 1);
      
      if (typedChar === expectedChar) {
        setCorrectChars(prev => prev + 1);
      } else {
        setErrors(prev => prev + 1);
      }

      const finger = fingerKeyMapping[typedChar.toLowerCase()] || 'thumb';
      setFingerHeatmap(prev => ({
        ...prev,
        [finger]: (prev[finger] || 0) + 1
      }));
    }

    if (newValue === targetText) {
      handleComplete();
    }
  }, [isPlaying, isPaused, targetText]);

  const handleStart = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
      setStartTime(Date.now());
      setUserInput('');
      setErrors(0);
      setTotalCharsTyped(0);
      setCorrectChars(0);
      setElapsedTime(0);
      setFingerHeatmap({});
      setShowResults(false);
      
      const texts = difficulty === 'easy' 
        ? sampleTexts.slice(0, 2)
        : difficulty === 'hard'
        ? sampleTexts.slice(3)
        : sampleTexts;
      
      const randomIndex = Math.floor(Math.random() * texts.length);
      setTargetText(texts[randomIndex]);
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setUserInput('');
    setErrors(0);
    setTotalCharsTyped(0);
    setCorrectChars(0);
    setElapsedTime(0);
    setStartTime(null);
    setFingerHeatmap({});
    setShowResults(false);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setShowResults(true);
    
    const stats: TypingStats = {
      wpm: getCurrentWPM(),
      accuracy: getAccuracy(),
      errors,
      totalChars: totalCharsTyped,
      timeElapsed: elapsedTime,
      fingerHeatmap: { ...fingerHeatmap }
    };
    
    setTypingStats(stats);
  };

  useEffect(() => {
    if (isPlaying && !isPaused && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, startTime]);

  const renderTextDisplay = () => {
    return (
      <div className="typing-text-display">
        {targetText.split('').map((char, index) => {
          let className = 'char-pending';
          let style: React.CSSProperties = {};

          if (index < userInput.length) {
            if (userInput[index] === char) {
              className = 'char-correct';
              style = { color: '#52c41a' };
            } else {
              className = 'char-incorrect';
              style = { color: '#ff4d4f', textDecoration: 'underline' };
            }
          } else if (index === userInput.length) {
            className = 'char-current';
            style = { 
              backgroundColor: '#1890ff', 
              color: '#fff',
              borderRadius: '2px',
              padding: '0 2px'
            };
          }

          return (
            <span key={index} className={className} style={style}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const renderFingerHeatmap = () => {
    const maxUsage = Math.max(...Object.values(fingerHeatmap), 1);
    
    return (
      <div className="finger-heatmap">
        <Title level={5} style={{ marginBottom: '16px', color: '#fff' }}>Finger Usage Heatmap</Title>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {Object.entries(fingerNames).map(([finger, name]) => {
            const usage = fingerHeatmap[finger] || 0;
            const intensity = Math.min(usage / maxUsage, 1);
            
            return (
              <div
                key={finger}
                className="finger-card"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: `rgba(24, 144, 255, ${0.1 + intensity * 0.4})`,
                  border: `1px solid ${intensity > 0.5 ? '#1890ff' : '#333'}`,
                  minWidth: '100px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {name}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: fingerColors[finger] || '#fff' }}>
                  {usage}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  {Math.round(intensity * 100)}% intensity
                </div>
              </div>
            );
          })}
        </div>

        <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
          <div style={{ position: 'relative', height: '200px', margin: '0 auto', maxWidth: '600px' }}>
            <svg viewBox="0 0 600 120" style={{ width: '100%', height: '100%' }}>
              <g transform="translate(50, 10)">
                <rect x="0" y="0" width="50" height="80" rx="4" fill={getFingerColor('left_pinky')} opacity={getFingerOpacity('left_pinky')} />
                <text x="25" y="95" textAnchor="middle" fill="#999" fontSize="10">Pinky</text>
                
                <rect x="60" y="0" width="50" height="80" rx="4" fill={getFingerColor('left_ring')} opacity={getFingerOpacity('left_ring')} />
                <text x="85" y="95" textAnchor="middle" fill="#999" fontSize="10">Ring</text>
                
                <rect x="120" y="0" width="50" height="80" rx="4" fill={getFingerColor('left_middle')} opacity={getFingerOpacity('left_middle')} />
                <text x="145" y="95" textAnchor="middle" fill="#999" fontSize="10">Middle</text>
                
                <rect x="180" y="0" width="50" height="80" rx="4" fill={getFingerColor('left_index')} opacity={getFingerOpacity('left_index')} />
                <text x="205" y="95" textAnchor="middle" fill="#999" fontSize="10">Index</text>
                
                <rect x="250" y="20" width="100" height="40" rx="4" fill={getFingerColor('thumb')} opacity={getFingerOpacity('thumb')} />
                <text x="300" y="75" textAnchor="middle" fill="#999" fontSize="10">Thumb</text>
                
                <rect x="370" y="0" width="50" height="80" rx="4" fill={getFingerColor('right_index')} opacity={getFingerOpacity('right_index')} />
                <text x="395" y="95" textAnchor="middle" fill="#999" fontSize="10">Index</text>
                
                <rect x="430" y="0" width="50" height="80" rx="4" fill={getFingerColor('right_middle')} opacity={getFingerOpacity('right_middle')} />
                <text x="455" y="95" textAnchor="middle" fill="#999" fontSize="10">Middle</text>
                
                <rect x="490" y="0" width="50" height="80" rx="4" fill={getFingerColor('right_ring')} opacity={getFingerOpacity('right_ring')} />
                <text x="515" y="95" textAnchor="middle" fill="#999" fontSize="10">Ring</text>
                
                <rect x="550" y="0" width="50" height="80" rx="4" fill={getFingerColor('right_pinky')} opacity={getFingerOpacity('right_pinky')} />
                <text x="575" y="95" textAnchor="middle" fill="#999" fontSize="10">Pinky</text>
              </g>
            </svg>
          </div>
        </Card>
      </div>
    );
  };

  function getFingerColor(finger: string): string {
    return fingerColors[finger] || '#666';
  }

  function getFingerOpacity(finger: string): number {
    const maxUsage = Math.max(...Object.values(fingerHeatmap), 1);
    const usage = fingerHeatmap[finger] || 0;
    return 0.3 + (usage / maxUsage) * 0.7;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="typing-game-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <TrophyOutlined />
                Typing Test & Feel Score
              </Space>
            }
            extra={
              <Space>
                <Select
                  value={difficulty}
                  onChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
                  disabled={isPlaying}
                  style={{ width: 120 }}
                >
                  <Option value="easy">Easy</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="hard">Hard</Option>
                </Select>
              </Space>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="WPM"
                  value={getCurrentWPM()}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Accuracy"
                  value={getAccuracy()}
                  suffix="%"
                  valueStyle={{ color: getAccuracy() >= 90 ? '#52c41a' : getAccuracy() >= 70 ? '#faad14' : '#ff4d4f' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Time"
                  value={formatTime(elapsedTime)}
                  valueStyle={{ color: '#fff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Feel Score"
                  value={getFeelScore()}
                  suffix="/100"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            <Progress 
              percent={totalCharsTyped > 0 ? Math.round((userInput.length / targetText.length) * 100) : 0} 
              status={showResults ? 'success' : 'active'}
              strokeColor="#1890ff"
              style={{ marginBottom: '16px' }}
            />

            <Card 
              size="small" 
              style={{ 
                marginBottom: '16px', 
                backgroundColor: '#1a1a1a',
                border: '1px solid #333'
              }}
            >
              <div style={{ fontSize: '18px', lineHeight: '1.8', letterSpacing: '0.5px' }}>
                {renderTextDisplay()}
              </div>
            </Card>

            <TextArea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              placeholder={isPlaying ? "Start typing..." : "Click Start to begin"}
              disabled={!isPlaying || isPaused}
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#333',
                color: '#fff',
                fontSize: '16px',
                marginBottom: '16px'
              }}
            />

            <Space style={{ justifyContent: 'center', display: 'flex' }}>
              {!isPlaying ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                >
                  {showResults ? 'Try Again' : 'Start Test'}
                </Button>
              ) : (
                <>
                  <Button
                    size="large"
                    icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                    onClick={handlePause}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    size="large"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>

        {showResults && (
          <Col span={24}>
            <Alert
              message={
                <Space>
                  <TrophyOutlined style={{ fontSize: '24px' }} />
                  <span style={{ fontSize: '18px' }}>
                    Test Complete! Feel Score: {getFeelScore()}/100
                  </span>
                </Space>
              }
              description={
                <div>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text strong>WPM: {getCurrentWPM()}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Accuracy: {getAccuracy()}%</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Errors: {errors}</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Time: {formatTime(elapsedTime)}</Text>
                    </Col>
                  </Row>
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          </Col>
        )}

        {(isPlaying || showResults) && (
          <Col span={24}>
            <Card title="Finger Usage Analysis">
              {renderFingerHeatmap()}
            </Card>
          </Col>
        )}

        {!isPlaying && !showResults && (
          <Col span={24}>
            <Card title="How It Works" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <ThunderboltOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                    <div><Text strong>Speed (WPM)</Text></div>
                    <Text type="secondary">Words Per Minute - standard typing speed metric</Text>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                    <div><Text strong>Accuracy</Text></div>
                    <Text type="secondary">Percentage of correct characters typed</Text>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <TrophyOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '8px' }} />
                    <div><Text strong>Feel Score</Text></div>
                    <Text type="secondary">Combined score of speed, accuracy, and finger distribution</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default TypingGame;
