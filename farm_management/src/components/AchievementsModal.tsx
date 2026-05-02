import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Box,
  Badge,
  Progress,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { clearAllNotifications } from '../store/slices/achievementSlice';
import { ACHIEVEMENTS, SEASON_NAMES, TIME_OF_DAY_NAMES } from '../data/achievements';
import { Achievement } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, string> = {
  harvest: '🌾',
  sell: '💰',
  days: '📅',
  animals: '🐄',
  crops: '🌱',
};

const categoryNames: Record<string, string> = {
  harvest: '收获',
  sell: '出售',
  days: '天数',
  animals: '动物',
  crops: '种植',
};

const formatUnlockedAt = (time: Achievement['unlockedAt']): string => {
  if (!time) return '未解锁';
  const seasonName = SEASON_NAMES[time.season] || time.season;
  const timeOfDayName = TIME_OF_DAY_NAMES[time.timeOfDay] || time.timeOfDay;
  return `第${time.year}年 ${seasonName} 第${time.day}天 ${timeOfDayName}`;
};

const AchievementsModal = ({ isOpen, onClose }: AchievementsModalProps) => {
  const dispatch = useAppDispatch();
  const achievements = useAppSelector((state) => state.achievements.achievements);
  const notifications = useAppSelector((state) => state.achievements.notifications);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const achievementsByCategory = (() => {
    const result: Record<string, typeof achievements> = {
      all: achievements,
    };
    for (const achievement of achievements) {
      const type = achievement.condition.type;
      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(achievement);
    }
    return result;
  })();

  const categories = ['all', ...Object.keys(categoryNames)];

  const filteredAchievements = achievementsByCategory[selectedCategory] || [];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const handleClearNotifications = () => {
    dispatch(clearAllNotifications());
  };

  const getDifficultyColor = (target: number): string => {
    if (target <= 10) return 'grass.500';
    if (target <= 100) return 'pixel.500';
    if (target <= 1000) return 'orange.500';
    return 'purple.500';
  };

  const getDifficultyLabel = (target: number): string => {
    if (target <= 10) return '简单';
    if (target <= 100) return '普通';
    if (target <= 1000) return '困难';
    return '传说';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg="pixel.50"
        border="6px solid"
        borderColor="pixel.600"
        boxShadow="8px 8px 0px #00000040"
        borderRadius={0}
        maxH="85vh"
      >
        <ModalHeader
          bg="pixel.200"
          borderBottom="4px solid"
          borderColor="pixel.500"
          p={4}
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" align="center">
              <HStack>
                <Text fontSize="2xl">🏆</Text>
                <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                  成就系统
                </Text>
              </HStack>
              <HStack>
                {notifications.length > 0 && (
                  <Tooltip label="点击清除新成就通知">
                    <Badge
                      bg="grass.400"
                      color="white"
                      fontSize="sm"
                      p={2}
                      border="2px solid"
                      borderColor="grass.600"
                      cursor="pointer"
                      onClick={handleClearNotifications}
                    >
                      🎉 新成就: {notifications.length}
                    </Badge>
                  </Tooltip>
                )}
                <Badge
                  bg="pixel.300"
                  color="pixel.800"
                  fontSize="sm"
                  p={2}
                  border="2px solid"
                  borderColor="pixel.500"
                >
                  {unlockedCount}/{totalCount} 已解锁
                </Badge>
              </HStack>
            </HStack>

            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="pixel.600">
                  完成进度
                </Text>
                <Text fontSize="xs" color="pixel.700" fontWeight="bold">
                  {completionRate.toFixed(1)}%
                </Text>
              </HStack>
              <Progress
                value={completionRate}
                h="12px"
                bg="pixel.200"
                border="2px solid"
                borderColor="pixel.400"
                borderRadius={0}
                sx={{
                  '> div': {
                    bg: completionRate >= 100 ? 'grass.500' : 'pixel.500',
                    borderRadius: 0,
                  },
                }}
              />
            </Box>
          </VStack>
        </ModalHeader>

        <ModalCloseButton size="lg" top={3} right={3} />

        <ModalBody p={0}>
          <Tabs variant="enclosed">
            <TabList
              bg="pixel.100"
              borderBottom="4px solid"
              borderColor="pixel.400"
              px={4}
              pt={2}
              overflowX="auto"
            >
              {categories.map((category) => {
                const categoryAchievements = achievementsByCategory[category] || [];
                const categoryUnlocked = categoryAchievements.filter((a) => a.unlocked).length;
                const isAll = category === 'all';

                return (
                  <Tab
                    key={category}
                    _selected={{
                      bg: 'pixel.300',
                      borderColor: 'pixel.500',
                      borderBottom: 'none',
                    }}
                    border="3px solid"
                    borderColor="pixel.300"
                    borderBottom="none"
                    borderRadius={0}
                    mx={1}
                    whiteSpace="nowrap"
                  >
                    <HStack>
                      <Text>{isAll ? '📋' : categoryIcons[category]}</Text>
                      <Text fontSize="xs">
                        {isAll ? '全部' : categoryNames[category]}
                      </Text>
                      <Badge
                        bg={categoryUnlocked > 0 ? 'grass.400' : 'pixel.400'}
                        color="white"
                        fontSize="xs"
                        ml={1}
                      >
                        {categoryUnlocked}/{categoryAchievements.length}
                      </Badge>
                    </HStack>
                  </Tab>
                );
              })}
            </TabList>

            <TabPanels>
              {categories.map((category) => {
                const categoryAchievements = achievementsByCategory[category] || [];
                
                return (
                  <TabPanel key={category} p={4}>
                    {categoryAchievements.length === 0 ? (
                      <VStack justify="center" align="center" py={12} spacing={4}>
                        <Text fontSize="5xl">🔒</Text>
                        <Text fontSize="sm" color="pixel.600">
                          暂无此类别的成就
                        </Text>
                      </VStack>
                    ) : (
                      <Grid
                        templateColumns={{
                          base: 'repeat(1, 1fr)',
                          md: 'repeat(2, 1fr)',
                        }}
                        gap={4}
                      >
                        {categoryAchievements.map((achievement) => {
                          const progress = achievement.condition.current;
                          const target = achievement.condition.target;
                          const progressPercent = Math.min(100, (progress / target) * 100);
                          const isNew = notifications.some((n) => n.id === achievement.id);

                          return (
                            <GridItem key={achievement.id}>
                              <Box
                                bg={achievement.unlocked ? 'grass.50' : 'pixel.100'}
                                border="4px solid"
                                borderColor={achievement.unlocked ? 'grass.400' : 'pixel.300'}
                                borderRadius={0}
                                p={4}
                                opacity={achievement.unlocked ? 1 : 0.8}
                                position="relative"
                              >
                                {isNew && (
                                  <Badge
                                    position="absolute"
                                    top={-2}
                                    right={-2}
                                    bg="grass.500"
                                    color="white"
                                    fontSize="xs"
                                    p={1}
                                    zIndex={1}
                                  >
                                    新!
                                  </Badge>
                                )}

                                <VStack align="stretch" spacing={3}>
                                  <HStack justify="space-between" align="start">
                                    <HStack>
                                      <Text
                                        fontSize="3xl"
                                        opacity={achievement.unlocked ? 1 : 0.5}
                                      >
                                        {achievement.icon}
                                      </Text>
                                      <VStack align="start" spacing={0}>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="bold"
                                          color={achievement.unlocked ? 'grass.700' : 'pixel.700'}
                                        >
                                          {achievement.name}
                                        </Text>
                                        <Text fontSize="xs" color="pixel.500">
                                          {achievement.description}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge
                                      bg={getDifficultyColor(target)}
                                      color="white"
                                      fontSize="xs"
                                      p={1}
                                    >
                                      {getDifficultyLabel(target)}
                                    </Badge>
                                  </HStack>

                                  <Box>
                                    <HStack justify="space-between" mb={1}>
                                      <Text fontSize="xs" color="pixel.600">
                                        进度
                                      </Text>
                                      <Text
                                        fontSize="xs"
                                        color={achievement.unlocked ? 'grass.600' : 'pixel.700'}
                                        fontWeight="bold"
                                      >
                                        {progress.toLocaleString()}/{target.toLocaleString()}
                                      </Text>
                                    </HStack>
                                    <Progress
                                      value={progressPercent}
                                      h="10px"
                                      bg="pixel.200"
                                      border="2px solid"
                                      borderColor={achievement.unlocked ? 'grass.400' : 'pixel.400'}
                                      borderRadius={0}
                                      sx={{
                                        '> div': {
                                          bg: achievement.unlocked ? 'grass.500' : 'pixel.500',
                                          borderRadius: 0,
                                        },
                                      }}
                                    />
                                  </Box>

                                  {achievement.unlocked && achievement.unlockedAt && (
                                    <HStack justify="space-between">
                                      <Badge
                                        bg="grass.300"
                                        color="grass.800"
                                        fontSize="xs"
                                        p={1}
                                      >
                                        ✓ 已解锁
                                      </Badge>
                                      <Text fontSize="xs" color="pixel.500">
                                        {formatUnlockedAt(achievement.unlockedAt)}
                                      </Text>
                                    </HStack>
                                  )}

                                  {!achievement.unlocked && (
                                    <HStack justify="space-between">
                                      <Badge
                                        bg="pixel.300"
                                        color="pixel.700"
                                        fontSize="xs"
                                        p={1}
                                      >
                                        🔒 未解锁
                                      </Badge>
                                      <Text fontSize="xs" color="pixel.500">
                                        还需 {(target - progress).toLocaleString()}
                                      </Text>
                                    </HStack>
                                  )}
                                </VStack>
                              </Box>
                            </GridItem>
                          );
                        })}
                      </Grid>
                    )}
                  </TabPanel>
                );
              })}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter
          bg="pixel.100"
          borderTop="4px solid"
          borderColor="pixel.400"
          p={4}
          justify="space-between"
        >
          <Text fontSize="xs" color="pixel.600">
            💡 提示：继续游戏以解锁更多成就！
          </Text>
          <Button
            onClick={onClose}
            bg="pixel.400"
            color="white"
            border="4px solid"
            borderColor="pixel.600"
            borderRadius={0}
            _hover={{
              bg: 'pixel.500',
            }}
          >
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AchievementsModal;
