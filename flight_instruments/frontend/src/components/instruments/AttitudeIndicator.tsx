import { Group, Circle, Line, Text, Rect, Arc } from 'react-konva';

interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
}

const CENTER = 150;
const RADIUS = 130;
const INNER_RADIUS = 100;

export function AttitudeIndicator({ pitch, roll }: AttitudeIndicatorProps) {
  const clampedPitch = Math.max(-90, Math.min(90, pitch));
  const clampedRoll = Math.max(-180, Math.min(180, roll));

  const renderSkyAndGround = () => {
    const pitchOffset = clampedPitch * 1.5;
    
    return (
      <Group rotation={clampedRoll} y={pitchOffset}>
        <Circle
          x={CENTER}
          y={CENTER}
          radius={RADIUS}
          fill="#1a4a8a"
        />
        
        <Rect
          x={CENTER - RADIUS}
          y={CENTER}
          width={RADIUS * 2}
          height={RADIUS}
          fill="#6b4a2a"
        />
        
        <Line
          points={[CENTER - RADIUS, CENTER, CENTER + RADIUS, CENTER]}
          stroke="#ffffff"
          strokeWidth={3}
        />
        
        {renderPitchMarks()}
      </Group>
    );
  };

  const renderPitchMarks = () => {
    const marks = [];
    
    const pitchValues = [-30, -20, -10, 0, 10, 20, 30];
    
    pitchValues.forEach((value) => {
      const yOffset = value * 1.5;
      const y = CENTER + yOffset;
      
      const isMajor = value % 10 === 0 && value !== 0;
      const markLength = isMajor ? 40 : 20;
      const markWidth = isMajor ? 2 : 1;
      
      marks.push(
        <Line
          key={`pitch-mark-${value}`}
          points={[
            CENTER - markLength,
            y,
            CENTER + markLength,
            y,
          ]}
          stroke="#ffffff"
          strokeWidth={markWidth}
        />
      );
      
      if (isMajor) {
        marks.push(
          <Text
            key={`pitch-label-left-${value}`}
            x={CENTER - markLength - 25}
            y={y - 8}
            text={Math.abs(value).toString()}
            fill="#ffffff"
            fontSize={10}
            align="right"
            width={20}
          />
        );
        marks.push(
          <Text
            key={`pitch-label-right-${value}`}
            x={CENTER + markLength + 5}
            y={y - 8}
            text={Math.abs(value).toString()}
            fill="#ffffff"
            fontSize={10}
          />
        );
      }
    });
    
    return marks;
  };

  const renderRollMarks = () => {
    const marks = [];
    
    const rollValues = [-60, -45, -30, -10, 0, 10, 30, 45, 60];
    
    rollValues.forEach((value) => {
      const angle = 90 + value;
      const radian = (angle * Math.PI) / 180;
      
      const isMajor = [0, 30, 45, 60, -30, -45, -60].includes(value);
      const isZero = value === 0;
      const markLength = isZero ? 25 : (isMajor ? 15 : 8);
      const markWidth = isZero ? 3 : (isMajor ? 2 : 1);
      
      const outerX = CENTER + (RADIUS + 5) * Math.cos(radian);
      const outerY = CENTER + (RADIUS + 5) * Math.sin(radian);
      const innerX = CENTER + (RADIUS + 5 - markLength) * Math.cos(radian);
      const innerY = CENTER + (RADIUS + 5 - markLength) * Math.sin(radian);
      
      marks.push(
        <Line
          key={`roll-mark-${value}`}
          points={[outerX, outerY, innerX, innerY]}
          stroke={isZero ? '#ffb800' : '#ffffff'}
          strokeWidth={markWidth}
        />
      );
      
      if (isZero) {
        marks.push(
          <Group key={`roll-triangle-${value}`} rotation={clampedRoll}>
            <Line
              points={[
                CENTER,
                CENTER + RADIUS + 5,
                CENTER - 8,
                CENTER + RADIUS + 20,
                CENTER + 8,
                CENTER + RADIUS + 20,
              ]}
              fill="#ffb800"
              stroke="#ffffff"
              strokeWidth={1}
              closed={true}
            />
          </Group>
        );
      }
    });
    
    return marks;
  };

  const renderFixedAircraftSymbol = () => {
    return (
      <Group>
        <Line
          points={[CENTER - 40, CENTER, CENTER + 40, CENTER]}
          stroke="#ffb800"
          strokeWidth={4}
        />
        
        <Line
          points={[CENTER - 15, CENTER + 15, CENTER + 15, CENTER + 15]}
          stroke="#ffb800"
          strokeWidth={4}
        />
        
        <Circle
          x={CENTER}
          y={CENTER}
          radius={6}
          fill="#000000"
          stroke="#ffb800"
          strokeWidth={2}
        />
        
        <Line
          points={[
            CENTER - 30,
            CENTER,
            CENTER - 20,
            CENTER - 10,
          ]}
          stroke="#ffb800"
          strokeWidth={4}
          lineCap="round"
        />
        <Line
          points={[
            CENTER + 30,
            CENTER,
            CENTER + 20,
            CENTER - 10,
          ]}
          stroke="#ffb800"
          strokeWidth={4}
          lineCap="round"
        />
      </Group>
    );
  };

  const renderSlipIndicator = () => {
    return (
      <Group>
        <Rect
          x={CENTER - 50}
          y={CENTER + RADIUS + 30}
          width={100}
          height={20}
          fill="#1a1a1a"
          stroke="#3a3a3a"
          strokeWidth={2}
          cornerRadius={3}
        />
        
        <Line
          points={[
            CENTER - 40,
            CENTER + RADIUS + 30,
            CENTER - 40,
            CENTER + RADIUS + 50,
          ]}
          stroke="#ffffff"
          strokeWidth={2}
        />
        <Line
          points={[
            CENTER,
            CENTER + RADIUS + 30,
            CENTER,
            CENTER + RADIUS + 50,
          ]}
          stroke="#ffffff"
          strokeWidth={2}
        />
        <Line
          points={[
            CENTER + 40,
            CENTER + RADIUS + 30,
            CENTER + 40,
            CENTER + RADIUS + 50,
          ]}
          stroke="#ffffff"
          strokeWidth={2}
        />
        
        <Circle
          x={CENTER}
          y={CENTER + RADIUS + 40}
          radius={8}
          fill="#000000"
          stroke="#ffffff"
          strokeWidth={2}
        />
        
        <Text
          x={CENTER}
          y={CENTER + RADIUS + 55}
          text="SLIP"
          fill="#ffffff"
          fontSize={8}
          align="center"
          offsetX={15}
        />
      </Group>
    );
  };

  return (
    <Group>
      <Circle
        x={CENTER}
        y={CENTER}
        radius={RADIUS + 10}
        fill="linear-gradient(145deg, #3a3a3a, #1a1a1a)"
        stroke="#000000"
        strokeWidth={4}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={RADIUS + 5}
        fill="#1a1a1a"
        stroke="#3a3a3a"
        strokeWidth={2}
        clipFunc={(ctx) => {
          ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
        }}
      />
      
      {renderSkyAndGround()}
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={RADIUS}
        stroke="#3a3a3a"
        strokeWidth={2}
        fillEnabled={false}
      />
      
      {renderRollMarks()}
      
      {renderFixedAircraftSymbol()}
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={INNER_RADIUS}
        stroke="#666666"
        strokeWidth={2}
        fillEnabled={false}
        dash={[10, 5]}
      />
      
      <Text
        x={CENTER}
        y={CENTER - 60}
        text={`P: ${clampedPitch.toFixed(1)}°`}
        fill="#ffb800"
        fontSize={12}
        fontStyle="bold"
        align="center"
        width={60}
        offsetX={30}
        offsetY={6}
      />
      
      <Text
        x={CENTER}
        y={CENTER + 60}
        text={`R: ${clampedRoll.toFixed(1)}°`}
        fill="#ffb800"
        fontSize={12}
        fontStyle="bold"
        align="center"
        width={60}
        offsetX={30}
        offsetY={6}
      />
      
      {renderSlipIndicator()}
    </Group>
  );
}
