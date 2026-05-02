import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Container
} from '@chakra-ui/react';

interface GameEndingProps {
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const GameEnding: React.FC<GameEndingProps> = ({ onRestart, onReturnToMenu }) => {
  return (
    <Box
      w="100vw"
      h="100vh"
      bg="dark.900"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        w="full"
        h="full"
        bgGradient="radial(circle at center, accent.900 0%, dark.900 70%)"
      />

      <Container
        maxW="container.md"
        h="full"
        position="relative"
        zIndex="1"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <VStack spacing={8} textAlign="center">
          <Text fontSize="8xl">🏆</Text>
          
          <VStack spacing={4}>
            <Heading
              size="3xl"
              bgGradient="linear(to-r, accent.300, accent.500)"
              bgClip="text"
            >
              恭喜逃脱！
            </Heading>
            <Text color="gray.400" fontSize="xl" lineHeight="tall">
              你成功解开了所有谜题，找到了传说中的护符，
              <br />
              并通过传送门逃离了这座神秘的古老宅邸。
            </Text>
          </VStack>

          <Box
            p={6}
            bg="dark.800"
            borderRadius="lg"
            border="2px"
            borderColor="accent.500"
            w="full"
            maxW="400px"
          >
            <VStack spacing={4}>
              <Heading size="md" color="accent.400">
                游戏统计
              </Heading>
              <HStack w="full" justify="space-around">
                <VStack>
                  <Text color="gray.500" fontSize="sm">完成时间</Text>
                  <Text color="accent.400" fontSize="2xl" fontWeight="bold">
                    --:--
                  </Text>
                </VStack>
                <VStack>
                  <Text color="gray.500" fontSize="sm">收集物品</Text>
                  <Text color="accent.400" fontSize="2xl" fontWeight="bold">
                    --
                  </Text>
                </VStack>
                <VStack>
                  <Text color="gray.500" fontSize="sm">解开谜题</Text>
                  <Text color="accent.400" fontSize="2xl" fontWeight="bold">
                    --
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          <VStack spacing={4} w="full" maxW="300px">
            <Button
              w="full"
              size="lg"
              variant="solid"
              fontSize="lg"
              py={6}
              onClick={onRestart}
            >
              🔄 再玩一次
            </Button>
            <Button
              w="full"
              size="lg"
              variant="outline"
              colorScheme="orange"
              fontSize="lg"
              py={6}
              onClick={onReturnToMenu}
            >
              🏠 返回主菜单
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};
