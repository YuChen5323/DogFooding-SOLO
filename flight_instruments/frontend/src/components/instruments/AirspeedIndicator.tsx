import { Group, Circle, Arc, Text, Line } from 'react-konva';

interface AirspeedIndicatorProps {
  airspeed: number;
}

const CENTER = 150;
const RADIUS = 130;
const INNER_RADIUS = 110;

export function AirspeedIndicator({ airspeed }: AirspeedIndicatorProps) {
  const clampedAirspeed = Math.max(0, Math.min(500, airspeed));
  
  const getAngle = (speed: number) => {
    const normalizedSpeed = speed / 500;
    return -135 + normalizedSpeed * 270;
  };

  const renderSpeedMarks = () => {
    const marks = [];
    const speeds = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    
    speeds.forEach((speed, index) => {
      const angle = getAngle(speed);
      const radian = (angle * Math.PI) / 180;
      
      const isMajor = index % 2 === 0;
      const markLength = isMajor ? 20 : 10;
      const markWidth = isMajor ? 2 : 1;
      
      const outerX = CENTER + RADIUS * Math.cos(radian);
      const outerY = CENTER + RADIUS * Math.sin(radian);
      const innerX = CENTER + (RADIUS - markLength) * Math.cos(radian);
      const innerY = CENTER + (RADIUS - markLength) * Math.sin(radian);
      
      marks.push(
        <Line
          key={`mark-${speed}`}
          points={[outerX, outerY, innerX, innerY]}
          stroke="#ffffff"
          strokeWidth={markWidth}
        />
      );
      
      if (isMajor) {
        const labelX = CENTER + (RADIUS - 30) * Math.cos(radian);
        const labelY = CENTER + (RADIUS - 30) * Math.sin(radian);
        
        marks.push(
          <Text
            key={`label-${speed}`}
            x={labelX - 12}
            y={labelY - 8}
            text={speed.toString()}
            fill="#ffffff"
            fontSize={14}
            fontStyle="bold"
          />
        );
      }
    });
    
    return marks;
  };

  const renderColorZones = () => {
    const zones = [
      { min: 0, max: 100, color: 'rgba(255, 255, 0, 0.3)' },
      { min: 100, max: 200, color: 'rgba(0, 255, 0, 0.3)' },
      { min: 200, max: 350, color: 'rgba(255, 255, 0, 0.3)' },
      { min: 350, max: 500, color: 'rgba(255, 0, 0, 0.3)' },
    ];
    
    return zones.map((zone, index) => {
      const startAngle = getAngle(zone.min);
      const endAngle = getAngle(zone.max);
      
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

  const renderNeedle = () => {
    const angle = getAngle(clampedAirspeed);
    const radian = (angle * Math.PI) / 180;
    
    const tipX = CENTER + (RADIUS - 15) * Math.cos(radian);
    const tipY = CENTER + (RADIUS - 15) * Math.sin(radian);
    
    const baseAngle1 = (angle - 100) * Math.PI / 180;
    const baseAngle2 = (angle + 100) * Math.PI / 180;
    const baseX1 = CENTER + 20 * Math.cos(baseAngle1);
    const baseY1 = CENTER + 20 * Math.sin(baseAngle1);
    const baseX2 = CENTER + 20 * Math.cos(baseAngle2);
    const baseY2 = CENTER + 20 * Math.sin(baseAngle2);
    
    return (
      <Group>
        <Line
          points={[baseX1, baseY1, tipX, tipY, baseX2, baseY2]}
          fill="#ff0000"
          stroke="#ffffff"
          strokeWidth={1}
          closed={true}
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
      
      {renderColorZones()}
      {renderSpeedMarks()}
      
      <Text
        x={CENTER}
        y={CENTER + 40}
        text="knots"
        fill="#ffffff"
        fontSize={12}
        fontStyle="italic"
        align="center"
        width={60}
        offsetX={30}
        offsetY={6}
      />
      
      {renderNeedle()}
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={15}
        fill="linear-gradient(145deg, #4a4a4a, #2a2a2a)"
        stroke="#1a1a1a"
        strokeWidth={2}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={5}
        fill="#ffb800"
        stroke="#000000"
        strokeWidth={1}
      />
      
      <Text
        x={CENTER}
        y={CENTER - 80}
        text={Math.round(clampedAirspeed).toString()}
        fill="#ffb800"
        fontSize={24}
        fontStyle="bold"
        align="center"
        width={80}
        offsetX={40}
        offsetY={12}
      />
    </Group>
  );
}
