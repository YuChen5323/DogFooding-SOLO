import { Group, Circle, Line, Text, Arc, Wedge } from 'react-konva';

interface HSIProps {
  heading: number;
  course: number;
  deviation: number;
  distance: number | null;
}

const CENTER = 150;
const RADIUS = 130;
const INNER_RADIUS = 100;
const CENTER_RADIUS = 30;

export function HSI({ heading, course, deviation, distance }: HSIProps) {
  const normalizedHeading = heading % 360;
  const normalizedCourse = course % 360;
  const clampedDeviation = Math.max(-10, Math.min(10, deviation));

  const renderCompassRose = () => {
    const rose = [];
    
    for (let i = 0; i < 360; i += 10) {
      const angle = i - normalizedHeading;
      const radian = (angle * Math.PI) / 180;
      
      const isMajor = i % 30 === 0;
      const markLength = isMajor ? 20 : 10;
      const markWidth = isMajor ? 2 : 1;
      
      const outerX = CENTER + RADIUS * Math.cos(radian);
      const outerY = CENTER + RADIUS * Math.sin(radian);
      const innerX = CENTER + (RADIUS - markLength) * Math.cos(radian);
      const innerY = CENTER + (RADIUS - markLength) * Math.sin(radian);
      
      rose.push(
        <Line
          key={`rose-mark-${i}`}
          points={[outerX, outerY, innerX, innerY]}
          stroke="#ffffff"
          strokeWidth={markWidth}
        />
      );
      
      if (isMajor) {
        const labelX = CENTER + (RADIUS - 30) * Math.cos(radian);
        const labelY = CENTER + (RADIUS - 30) * Math.sin(radian);
        
        let label = '';
        switch (i) {
          case 0: label = 'N'; break;
          case 90: label = 'E'; break;
          case 180: label = 'S'; break;
          case 270: label = 'W'; break;
          default: label = (i / 10).toString();
        }
        
        rose.push(
          <Text
            key={`rose-label-${i}`}
            x={labelX - 10}
            y={labelY - 8}
            text={label}
            fill="#ffb800"
            fontSize={12}
            fontStyle="bold"
          />
        );
      }
    }
    
    return rose;
  };

  const renderHeadingBug = () => {
    const angle = 0;
    const radian = (angle * Math.PI) / 180;
    
    return (
      <Group>
        <Line
          points={[
            CENTER + (RADIUS + 10) * Math.cos(radian),
            CENTER + (RADIUS + 10) * Math.sin(radian),
            CENTER + (RADIUS - 20) * Math.cos(radian),
            CENTER + (RADIUS - 20) * Math.sin(radian),
          ]}
          stroke="#ff0000"
          strokeWidth={3}
        />
        
        <Wedge
          x={CENTER}
          y={CENTER}
          radius={RADIUS + 15}
          angle={20}
          rotation={-10}
          fill="#ff0000"
          stroke="#ff0000"
          strokeWidth={2}
        />
      </Group>
    );
  };

  const renderCourseDeviation = () => {
    const courseRelative = normalizedCourse - normalizedHeading;
    const courseAngle = courseRelative;
    const courseRadian = (courseAngle * Math.PI) / 180;
    
    const deviationOffset = (clampedDeviation / 10) * 40;
    
    return (
      <Group>
        <Line
          points={[
            CENTER + INNER_RADIUS * Math.cos(courseRadian),
            CENTER + INNER_RADIUS * Math.sin(courseRadian),
            CENTER - INNER_RADIUS * Math.cos(courseRadian),
            CENTER - INNER_RADIUS * Math.sin(courseRadian),
          ]}
          stroke="#00ff00"
          strokeWidth={3}
          dash={[10, 5]}
        />
        
        <Wedge
          x={CENTER}
          y={CENTER}
          radius={INNER_RADIUS + 5}
          angle={30}
          rotation={courseAngle - 15}
          fill="rgba(0, 255, 0, 0.3)"
          stroke="transparent"
        />
        
        <Wedge
          x={CENTER}
          y={CENTER}
          radius={INNER_RADIUS + 5}
          angle={30}
          rotation={courseAngle + 165}
          fill="rgba(0, 255, 0, 0.3)"
          stroke="transparent"
        />
        
        <Line
          points={[
            CENTER,
            CENTER - INNER_RADIUS,
            CENTER - deviationOffset,
            CENTER,
            CENTER - deviationOffset,
            CENTER + INNER_RADIUS,
            CENTER,
            CENTER,
          ]}
          fill="#00ff00"
          stroke="#ffffff"
          strokeWidth={1}
          closed={true}
        />
        
        {[-10, -5, 0, 5, 10].map((value, index) => {
          const offset = (value / 10) * 40;
          const isZero = value === 0;
          return (
            <Line
              key={`cdi-mark-${index}`}
              points={[
                CENTER + offset - (isZero ? 8 : 5),
                CENTER,
                CENTER + offset + (isZero ? 8 : 5),
                CENTER,
              ]}
              stroke={isZero ? '#ffb800' : '#ffffff'}
              strokeWidth={isZero ? 3 : 2}
            />
          );
        })}
      </Group>
    );
  };

  const renderDistanceIndicator = () => {
    if (distance === null) {
      return (
        <Group>
          <Text
            x={CENTER}
            y={CENTER + INNER_RADIUS + 20}
            text="DME: ---"
            fill="#6a6a6a"
            fontSize={12}
            fontStyle="italic"
            align="center"
            offsetX={30}
            offsetY={6}
          />
        </Group>
      );
    }
    
    return (
      <Group>
        <Text
          x={CENTER}
          y={CENTER + INNER_RADIUS + 20}
          text={`DME: ${distance.toFixed(1)} NM`}
          fill="#00ff00"
          fontSize={12}
          fontStyle="bold"
          align="center"
          offsetX={40}
          offsetY={6}
        />
      </Group>
    );
  };

  const renderAircraftSymbol = () => {
    return (
      <Group>
        <Line
          points={[
            CENTER,
            CENTER - 20,
            CENTER - 15,
            CENTER - 5,
            CENTER - 10,
            CENTER - 5,
            CENTER + 10,
            CENTER - 5,
            CENTER + 15,
            CENTER - 5,
            CENTER + 20,
            CENTER - 20,
          ]}
          fill="#ffb800"
          stroke="#000000"
          strokeWidth={1}
          closed={true}
        />
        
        <Circle
          x={CENTER}
          y={CENTER}
          radius={4}
          fill="#000000"
          stroke="#ffb800"
          strokeWidth={2}
        />
      </Group>
    );
  };

  return (
    <Group>
      <Circle
        x={CENTER}
        y={CENTER}
        radius={RADIUS + 15}
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
        dash={[5, 3]}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={CENTER_RADIUS}
        fill="#3a3a3a"
        stroke="#4a4a4a"
        strokeWidth={1}
      />
      
      {renderCompassRose()}
      {renderCourseDeviation()}
      
      {renderAircraftSymbol()}
      {renderHeadingBug()}
      
      <Text
        x={CENTER}
        y={CENTER - 80}
        text={`HDG: ${Math.round(normalizedHeading)}°`}
        fill="#ffb800"
        fontSize={14}
        fontStyle="bold"
        align="center"
        width={80}
        offsetX={40}
        offsetY={7}
      />
      
      <Text
        x={CENTER}
        y={CENTER + 80}
        text={`CRS: ${Math.round(normalizedCourse)}°`}
        fill="#00ff00"
        fontSize={14}
        fontStyle="bold"
        align="center"
        width={80}
        offsetX={40}
        offsetY={7}
      />
      
      <Text
        x={CENTER}
        y={CENTER + 50}
        text={`DEV: ${clampedDeviation > 0 ? 'R' : clampedDeviation < 0 ? 'L' : 'C'} ${Math.abs(clampedDeviation)}`}
        fill="#ffffff"
        fontSize={10}
        fontStyle="italic"
        align="center"
        width={80}
        offsetX={40}
        offsetY={5}
      />
      
      {renderDistanceIndicator()}
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={8}
        fill="linear-gradient(145deg, #4a4a4a, #2a2a2a)"
        stroke="#1a1a1a"
        strokeWidth={2}
      />
      
      <Circle
        x={CENTER}
        y={CENTER}
        radius={3}
        fill="#ffb800"
        stroke="#000000"
        strokeWidth={1}
      />
    </Group>
  );
}
