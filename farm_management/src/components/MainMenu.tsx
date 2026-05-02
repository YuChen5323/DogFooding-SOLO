import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Image,
  Center,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
}

const MainMenu = ({ onStartGame, onLoadGame }: MainMenuProps) => {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <Box
      w="100vw"
      h="100vh"
      bgGradient="linear(180deg, #90EE90 0%, #4CAF50 100%)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="10%"
        left="0"
        right="0"
        textAlign="center"
        pointerEvents="none"
      >
        <Text fontSize="6xl" opacity="0.3">
          🌾 🌻 🌾 🌻 🌾 🌻 🌾 🌻 🌾 🌻 🌾
        </Text>
      </Box>

      <Center w="100%" h="100%">
        <VStack spacing={8} maxW="md" w="100%" px={4}>
          <Card
            bg="pixel.50"
            border="6px solid"
            borderColor="pixel.600"
            boxShadow="8px 8px 0px #00000040"
            borderRadius="0"
            w="100%"
          >
            <CardBody p={8}>
              <VStack spacing={6} align="center">
                <Heading
                  as="h1"
                  size="2xl"
                  color="pixel.700"
                  textAlign="center"
                >
                  🌾 像素农场物语 🌾
                </Heading>
                <Text
                  fontSize="sm"
                  color="pixel.600"
                  textAlign="center"
                  px={4}
                >
                  Pixel Farm Story
                </Text>

                <Divider borderColor="pixel.400" />

                <VStack spacing={3} w="100%">
                  <Button
                    w="100%"
                    size="lg"
                    fontSize="lg"
                    onClick={onStartGame}
                    bg="pixel.400"
                    color="white"
                    border="4px solid"
                    borderColor="pixel.600"
                    boxShadow="4px 4px 0px #00000040"
                    _hover={{
                      bg: 'pixel.500',
                      transform: 'translate(-2px, -2px)',
                      boxShadow: '6px 6px 0px #00000040',
                    }}
                    _active={{
                      bg: 'pixel.600',
                      transform: 'translate(2px, 2px)',
                      boxShadow: '2px 2px 0px #00000040',
                    }}
                    leftIcon={<span>🌱</span>}
                  >
                    开始新游戏
                  </Button>

                  <Button
                    w="100%"
                    size="lg"
                    fontSize="lg"
                    onClick={onLoadGame}
                    bg="pixel.300"
                    color="pixel.800"
                    border="4px solid"
                    borderColor="pixel.500"
                    boxShadow="4px 4px 0px #00000040"
                    _hover={{
                      bg: 'pixel.400',
                      transform: 'translate(-2px, -2px)',
                      boxShadow: '6px 6px 0px #00000040',
                    }}
                    _active={{
                      bg: 'pixel.500',
                      transform: 'translate(2px, 2px)',
                      boxShadow: '2px 2px 0px #00000040',
                    }}
                    leftIcon={<span>💾</span>}
                  >
                    读取存档
                  </Button>

                  <Button
                    w="100%"
                    size="lg"
                    fontSize="lg"
                    onClick={() => setShowCredits(!showCredits)}
                    bg="transparent"
                    color="pixel.700"
                    border="4px solid"
                    borderColor="pixel.500"
                    _hover={{
                      bg: 'pixel.100',
                    }}
                    leftIcon={<span>📖</span>}
                  >
                    游戏说明
                  </Button>
                </VStack>

                {showCredits && (
                  <Box
                    w="100%"
                    p={4}
                    bg="pixel.100"
                    border="4px solid"
                    borderColor="pixel.400"
                  >
                    <VStack spacing={3} align="start">
                      <Text fontSize="sm" fontWeight="bold" color="pixel.700">
                        🎮 操作说明：
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 方向键 / WASD - 移动角色
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 数字键 1-4 - 切换工具
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 鼠标点击 - 使用工具
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • I / ESC - 打开背包
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • S - 打开商店
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • B - 打开畜牧小屋
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • K - 打开厨房
                      </Text>
                      
                      <Text fontSize="sm" fontWeight="bold" color="pixel.700" mt={2}>
                        🌿 游戏特色：
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 农场种植系统 - 种植多种作物
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 畜牧系统 - 饲养动物收集产出
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 四季变化 - 不同季节有不同作物
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 祭典事件 - 每年固定节日有特殊活动
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 厨房加工 - 用食材制作美味料理
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 成就系统 - 完成挑战获得奖励
                      </Text>
                      <Text fontSize="xs" color="pixel.600">
                        • 云端存档 - 支持存档读写
                      </Text>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          <HStack spacing={4} color="pixel.800">
            <Text fontSize="xs">
              👨‍🌾 React 18 + TypeScript
            </Text>
            <Text fontSize="xs">
              🎮 Phaser 3
            </Text>
            <Text fontSize="xs">
              📦 Redux Toolkit
            </Text>
            <Text fontSize="xs">
              🎨 Chakra UI
            </Text>
          </HStack>
        </VStack>
      </Center>

      <Box
        position="absolute"
        bottom="5%"
        left="0"
        right="0"
        textAlign="center"
        fontSize="4xl"
        opacity="0.5"
      >
        🐔 🐄 🐑 🌽 🍅 🌶️ 🍓 🎃 🥬
      </Box>
    </Box>
  );
};

export default MainMenu;
