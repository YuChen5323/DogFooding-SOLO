import React, { useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  IconButton,
  Tooltip,
  Text,
  Badge
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import {
  isInventoryOpenAtom,
  isDiaryOpenAtom,
  isSettingsOpenAtom,
  inventoryAtom,
  diaryEntriesAtom,
  currentRoomAtom
} from '../store/atoms';
import { rooms } from '../game/data/rooms';

interface GameHUDProps {
  onKeyPress?: (key: string) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onKeyPress }) => {
  const setIsInventoryOpen = useSetAtom(isInventoryOpenAtom);
  const setIsDiaryOpen = useSetAtom(isDiaryOpenAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const [inventory] = useAtom(inventoryAtom);
  const [diaryEntries] = useAtom(diaryEntriesAtom);
  const [currentRoom] = useAtom(currentRoomAtom);

  const room = rooms[currentRoom];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'i':
          setIsInventoryOpen(true);
          onKeyPress?.('i');
          break;
        case 'j':
          setIsDiaryOpen(true);
          onKeyPress?.('j');
          break;
        case 'escape':
          setIsSettingsOpen(true);
          onKeyPress?.('escape');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsInventoryOpen, setIsDiaryOpen, setIsSettingsOpen, onKeyPress]);

  return (
    <>
      <Box
        position="absolute"
        top="20px"
        right="20px"
        zIndex="100"
      >
        <VStack spacing={2}>
          <Tooltip label="道具栏 (I)" placement="left">
            <IconButton
              icon={<span>🎒</span>}
              aria-label="打开道具栏"
              bg="dark.700"
              border="1px"
              borderColor="dark.500"
              _hover={{ bg: 'dark.600', borderColor: 'accent.500' }}
              onClick={() => setIsInventoryOpen(true)}
              position="relative"
            >
              {inventory.length > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  colorScheme="orange"
                  borderRadius="full"
                >
                  {inventory.length}
                </Badge>
              )}
            </IconButton>
          </Tooltip>

          <Tooltip label="日记 (J)" placement="left">
            <IconButton
              icon={<span>📖</span>}
              aria-label="打开日记"
              bg="dark.700"
              border="1px"
              borderColor="dark.500"
              _hover={{ bg: 'dark.600', borderColor: 'accent.500' }}
              onClick={() => setIsDiaryOpen(true)}
              position="relative"
            >
              {diaryEntries.length > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  colorScheme="orange"
                  borderRadius="full"
                >
                  {diaryEntries.length}
                </Badge>
              )}
            </IconButton>
          </Tooltip>

          <Tooltip label="设置 (ESC)" placement="left">
            <IconButton
              icon={<span>⚙️</span>}
              aria-label="打开设置"
              bg="dark.700"
              border="1px"
              borderColor="dark.500"
              _hover={{ bg: 'dark.600', borderColor: 'accent.500' }}
              onClick={() => setIsSettingsOpen(true)}
            />
          </Tooltip>
        </VStack>
      </Box>

      <Box
        position="absolute"
        bottom="20px"
        left="20px"
        zIndex="100"
        maxW="400px"
      >
        <Box
          bg="rgba(10, 10, 15, 0.9)"
          p={3}
          borderRadius="md"
          border="1px"
          borderColor="dark.500"
          backdropFilter="blur(4px)"
        >
          <VStack align="start" spacing={1}>
            <HStack>
              <Text fontSize="lg">📍</Text>
              <Text color="accent.400" fontWeight="bold">
                {room?.name || '未知区域'}
              </Text>
            </HStack>
            <Text color="gray.400" fontSize="xs" lineHeight="short">
              {room?.description?.slice(0, 100)}...
            </Text>
          </VStack>
        </Box>
      </Box>

      <Box
        position="absolute"
        bottom="20px"
        right="20px"
        zIndex="100"
      >
        <Text
          color="gray.600"
          fontSize="xs"
          bg="rgba(10, 10, 15, 0.8)"
          px={3}
          py={2}
          borderRadius="md"
        >
          方向键/WASD 移动 | 空格/E 互动
        </Text>
      </Box>
    </>
  );
};
