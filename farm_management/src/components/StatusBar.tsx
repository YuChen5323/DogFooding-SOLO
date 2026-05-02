import {
  HStack,
  VStack,
  Text,
  Box,
  Badge,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import { useAppSelector } from '../store';
import { SEASON_NAMES, SEASON_COLORS } from '../data/achievements';
import { TIME_OF_DAY_NAMES } from '../data/achievements';

const StatusBar = () => {
  const time = useAppSelector((state) => state.time);
  const stats = useAppSelector((state) => state.stats);
  const selectedTool = useAppSelector((state) => state.ui.selectedTool);

  const getSeasonEmoji = () => {
    switch (time.season) {
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'autumn': return '🍂';
      case 'winter': return '❄️';
      default: return '🌸';
    }
  };

  const getTimeEmoji = () => {
    if (time.hour >= 5 && time.hour < 7) return '🌅';
    if (time.hour >= 7 && time.hour < 10) return '🌞';
    if (time.hour >= 10 && time.hour < 14) return '☀️';
    if (time.hour >= 14 && time.hour < 18) return '🌤️';
    if (time.hour >= 18 && time.hour < 21) return '🌅';
    return '🌙';
  };

  const formatTime = () => {
    const hour = time.hour.toString().padStart(2, '0');
    const minute = Math.floor(time.minute).toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const getToolName = () => {
    switch (selectedTool) {
      case 'hoe': return { name: '锄头', emoji: '⛏️' };
      case 'watering_can': return { name: '水壶', emoji: '💧' };
      case 'seed': return { name: '种子', emoji: '🌱' };
      case 'hammer': return { name: '锤子', emoji: '🔨' };
      default: return { name: '锄头', emoji: '⛏️' };
    }
  };

  const toolInfo = getToolName();

  return (
    <Box
      w="100%"
      maxW="6xl"
      mx="auto"
      bg="pixel.50"
      border="4px solid"
      borderColor="pixel.500"
      boxShadow="4px 4px 0px #00000040"
      p={3}
      pointerEvents="auto"
    >
      <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
        <HStack spacing={4}>
          <Tooltip label={`${SEASON_NAMES[time.season]} - 第${time.year}年`}>
            <Badge
              bg={SEASON_COLORS[time.season]}
              color="pixel.900"
              fontSize="xs"
              p={2}
              border="2px solid"
              borderColor="pixel.600"
            >
              {getSeasonEmoji()} 第{time.year}年 {time.month}月 {time.day}日
            </Badge>
          </Tooltip>

          <Tooltip label={`${TIME_OF_DAY_NAMES[time.timeOfDay]}`}>
            <Badge
              bg="pixel.300"
              color="pixel.800"
              fontSize="xs"
              p={2}
              border="2px solid"
              borderColor="pixel.500"
            >
              {getTimeEmoji()} {formatTime()}
            </Badge>
          </Tooltip>
        </HStack>

        <HStack spacing={4}>
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="bold" color="pixel.700">
                💰 金币:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="grass.600">
                {stats.money.toLocaleString()}
              </Text>
            </HStack>
          </VStack>

          <VStack align="start" spacing={1} w="120px">
            <HStack spacing={2}>
              <Text fontSize="xs" color="pixel.700">
                ⚡ 体力:
              </Text>
              <Text fontSize="xs" color="pixel.700">
                {Math.floor(stats.stamina)}/{stats.maxStamina}
              </Text>
            </HStack>
            <Progress
              value={(stats.stamina / stats.maxStamina) * 100}
              size="sm"
              bg="pixel.200"
              border="2px solid"
              borderColor="pixel.400"
              borderRadius={0}
              sx={{
                '& > div': {
                  bg: stats.stamina > stats.maxStamina * 0.3 ? 'grass.500' : 'red.500',
                },
              }}
            />
          </VStack>
        </HStack>

        <HStack spacing={2}>
          <Tooltip label="当前工具">
            <Box
              bg="pixel.200"
              border="3px solid"
              borderColor="pixel.500"
              p={2}
              boxShadow="2px 2px 0px #00000030"
            >
              <HStack spacing={2}>
                <Text fontSize="lg">{toolInfo.emoji}</Text>
                <Text fontSize="xs" color="pixel.700" fontWeight="bold">
                  {toolInfo.name}
                </Text>
              </HStack>
            </Box>
          </Tooltip>

          {time.isPaused && (
            <Badge
              bg="yellow.300"
              color="pixel.800"
              fontSize="sm"
              p={2}
              border="2px solid"
              borderColor="yellow.500"
            >
              ⏸️ 暂停
            </Badge>
          )}

          {time.festivalActive && (
            <Badge
              bg="purple.300"
              color="white"
              fontSize="sm"
              p={2}
              border="2px solid"
              borderColor="purple.500"
            >
              🎉 祭典
            </Badge>
          )}
        </HStack>
      </HStack>
    </Box>
  );
};

export default StatusBar;
