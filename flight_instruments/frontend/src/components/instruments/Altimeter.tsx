import { Group, Circle, Arc, Text, Line, Rect } from 'react-konva';

interface AltimeterProps {
  altitude: number;
  verticalSpeed: number;
}

const CENTER = 150;
const RADIUS = 130;
const INNER_RADIUS = 90;
const CENTER_RADIUS = 50;

export function Altimeter({ altitude, verticalSpeed }: AltimeterProps) {
  const clampedAltitude = Math.max(0, Math.min(50000, altitude));
  const feet = Math.round(clampedAltitude);
  
  const hundreds = feet % 1000;
  const thousands = Math.floor(feet / 1000);
  
  const getAngle = (value: number, maxValue: number) => {
    const normalizedValue = value / maxValue;
    return -135 + normalizedValue * 270;
  };

  const renderAltitudeMarks = () => {
    const marks = [];
    
    for (let i = 0; i <= 10; i++) {
      const angle = getAngle(i, 10);
      const radian = (angle * Math.PI) / 180;
      
      const isMajor = i % 2 === 0;
      const markLength = isMajor ? 25 : 12;
      const markWidth = isMajor ? 2 : 1;
      
      const outerX = CENTER + RADIUS * Math.cos(radian);
      const outerY = CENTER + RADIUS * Math.sin(radian);
      const innerX = CENTER + (RADIUS - markLength) * Math.cos(radian);
      const innerY = CENTER + (RADIUS - markLength) * Math.sin(radian);
      
      marks.push(
        <Line
          key={`mark-${i}`}
          points={[outerX, outerY, innerX, innerY]}
          stroke="#ffffff"
          strokeWidth={markWidth}
        />
      );
      
      if (isMajor) {
        const labelX = CENTER + (RADIUS - 35) * Math.cos(radian);
        const labelY = CENTER + (RADIUS - 35) * Math.sin(radian);
        
        marks.push(
          <Text
            key={`label-${i}`}
            x={labelX - 8}
            y={labelY - 8}
            text={(i * 2).toString()}
            fill="#ffffff"
            fontSize={14}
            fontStyle="bold"
          />
        );
      }
    }
    
    for (let i = 0; i <= 10; i += 2) {
      const angle = getAngle(i, 10);
      const radian = (angle * Math.PI) / 180;
      
      const outerX = CENTER + INNER_RADIUS * Math.cos(radian);
      const outerY = CENTER + INNER_RADIUS * Math.sin(radian);
      const innerX = CENTER + (INNER_RADIUS - 15) * Math.cos(radian);
      const innerY = CENTER + (INNER_RADIUS - 15) * Math.sin(radian);
      
      marks.push(
        <Line
          key={`inner-mark-${i}`}
          points={[outerX, outerY, innerX, innerY]}
          stroke="#ffffff"
          strokeWidth={2}
        />
      );
    }
    
    return marks;
  };

  const renderColorZones = () => {
    const zones = [
      { min: 0, max: 10, color: 'rgba(0, 255, 0, 0.3)' },
      { min: 10, max: 8, color: 'rgba(255, 255, 0, 0.3)' },
    ];
    
    return zones.map((zone, index) => {
      const startAngle = getAngle(zone.min, 10);
      const endAngle = getAngle(zone.max, 10);
      
      return (
        <Arc
          key={`zone-${index}`}
          x={CENTER}
          y={CENTER}
          innerRadius={RADIUS - 5}
          outerRadius={RADIUS}
          angle={endAngle - startAngle}
          rotation={startAngle}
          fill={zone.color}
          stroke="transparent"
        />
      );
    });
  };

  const renderThousandsNeedle = () => {
    const angle = getAngle(thousands % 10, 10);
    const radian = (angle * Math.PI) / 180;
    
    const tipX = CENTER + (RADIUS - 20) * Math.cos(radian);
    const tipY = CENTER + (RADIUS - 20) * Math.sin(radian);
    
    const baseAngle1 = (angle - 170) * Math.PI / 180;
    const baseAngle2 = (angle + 170) * Math.PI / 180;
    const baseX1 = CENTER + 25 * Math.cos(baseAngle1);
    const baseY1 = CENTER + 25 * Math.sin(baseAngle1);
    const baseX2 = CENTER + 25 * Math.cos(baseAngle2);
    const baseY2 = CENTER + 25 * Math.sin(baseAngle2);
    
    return (
      <Line
        points={[baseX1, baseY1, tipX, tipY, baseX2, baseY2]}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={1}
        closed={true}
      />
    );
  };

  const renderHundredsNeedle = () => {
    const angle = getAngle(hundreds / 100, 10);
    const radian = (angle * Math.PI) / 180;
    
    const tipX = CENTER + (INNER_RADIUS - 10) * Math.cos(radian);
    const tipY = CENTER + (INNER_RADIUS - 10) * Math.sin(radian);
    
    const baseAngle1 = (angle - 170) * Math.PI / 180;
    const baseAngle2 = (angle + 170) * Math.PI / 180;
    const baseX1 = CENTER + 15 * Math.cos(baseAngle1);
    const baseY1 = CENTER + 15 * Math.sin(baseAngle1);
    const baseX2 = CENTER + 15 * Math.cos(baseAngle2);
    const baseY2 = CENTER + 15 * Math.sin(baseAngle2);
    
    return (
      <Line
        points={[baseX1, baseY1, tipX, tipY, baseX2, baseY2]}
        fill="#ff0000"
        stroke="#ffffff"
        strokeWidth={1}
        closed={true}
      />
    );
  };

  const renderVerticalSpeedIndicator = () => {
    const clampedVS = Math.max(-6000, Math.min(6000, verticalSpeed));
    const vsRatio = clampedVS / 6000;
    const vsOffset = vsRatio * 40;
    
    return (
      <Group x={CENTER + RADIUS + 20} y={CENTER - 60}>
        <Rect
          x={0}
          y={0}
          width={30}
          height={120}
          fill="#1a1a1a"
          stroke="#3a3a3a"
          strokeWidth={2}
        />
        
        {[-6, -4, -2, 0, 2, 4, 6].map((value, index) => {
          const y = 60 - value * 10;
          return (
            <Group key={`vs-mark-${index}`}>
              <Line
                points={[5, y, 25, y]}
                stroke={value === 0 ? '#ffb800' : '#ffffff'}
                strokeWidth={value === 0 ? 2 : 1}
              />
              <Text
                x={35}
                y={y - 6}
                text={value.toString()}
                fill="#ffffff"
                fontSize={10}
              />
            </Group>
          );
        })}
        
        <Line
          points={[10, 60 + vsOffset, 20, 60 + vsOffset]}
          stroke="#ff0000"
          strokeWidth={3}
        />
        
        <Text
          x={15}
          y={130}
          text="FPM x 100"
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
        radius={RADIUS}
        fill="#1a1a1a"
        stroke="#3a3a3a"
        strokeWidth={2}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={INNER_RADIUS}
        fill="#2a2a2a"
        stroke="#3a3a3a"
        strokeWidth={1}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={CENTER_RADIUS}
        fill="#3a3a3a"
        stroke="#4a4a4a"
        strokeWidth={1}
      />
      
      {renderColorZones()}
      {renderAltitudeMarks()}
      
      <Text
        x={CENTER}
        y={CENTER + 70}
        text="1000 FT"
        fill="#ffffff"
        fontSize={10}
        fontStyle="italic"
        align="center"
        width={80}
        offsetX={40}
        offsetY={5}
      />
      
      <Rect
        x={CENTER - 40}
        y={CENTER - 10}
        width={80}
        height={20}
        fill="#000000"
        stroke="#3a3a3a"
        strokeWidth={1}
      />
      
      <Text
        x={CENTER}
        y={CENTER - 8}
        text={feet.toString().padStart(5, '0')}
        fill="#ffb800"
        fontSize={16}
        fontStyle="bold"
        align="center"
        width={80}
        offsetX={40}
        offsetY={0}
      />
      
      {renderThousandsNeedle()}
      {renderHundredsNeedle()}
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={12}
        fill="linear-gradient(145deg, #4a4a4a, #2a2a2a)"
        stroke="#1a1a1a"
        strokeWidth={2}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={4}
        fill="#ffb800"
        stroke="#000000"
        strokeWidth={1}
      />
      
      {renderVerticalSpeedIndicator()}
    </Group>
  );
}
