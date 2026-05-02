import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { isDiaryOpenAtom, diaryEntriesAtom, isGamePausedAtom } from '../store/atoms';
import { diaryEntries as allDiaryEntries } from '../game/data/rooms';

export const Diary: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(isDiaryOpenAtom);
  const [discoveredEntries] = useAtom(diaryEntriesAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);
  const [selectedEntry, setSelectedEntry] = React.useState<string | null>(null);

  const handleClose = () => {
    setIsOpen(false);
    setIsGamePaused(false);
    setSelectedEntry(null);
  };

  const entries = discoveredEntries.map((id) => allDiaryEntries[id]).filter(Boolean);

  const selectedEntryData = selectedEntry ? allDiaryEntries[selectedEntry] : null;

  return (
    <Drawer
      isOpen={isOpen}
      placement="left"
      onClose={handleClose}
      size="lg"
    >
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent bg="dark.800" borderRight="1px" borderColor="dark.500">
        <DrawerCloseButton color="gray.300" />
        <DrawerHeader color="accent.400">
          <HStack>
            <Text fontSize="2xl">📖</Text>
            <Heading size="md">日记</Heading>
          </HStack>
        </DrawerHeader>

        <DrawerBody>
          {entries.length === 0 ? (
            <VStack
              h="full"
              justify="center"
              textAlign="center"
              spacing={4}
            >
              <Text fontSize="6xl">📕</Text>
              <VStack>
                <Heading size="md" color="gray.400">
                  日记为空
                </Heading>
                <Text color="gray.500">
                  在游戏中探索以发现日记条目
                </Text>
              </VStack>
            </VStack>
          ) : (
            <HStack h="full" align="stretch" spacing={4}>
              <Box
                w="40%"
                borderRight="1px"
                borderColor="dark.500"
                pr={4}
              >
                <Text color="accent.400" fontSize="sm" mb={2}>
                  已发现: {entries.length} 条
                </Text>
                <List spacing={2}>
                  {entries.map((entry) => (
                    <ListItem
                      key={entry.id}
                      p={3}
                      bg={selectedEntry === entry.id ? 'dark.600' : 'dark.700'}
                      borderRadius="md"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        bg: 'dark.600',
                      }}
                      border={selectedEntry === entry.id ? '1px' : '1px'}
                      borderColor={selectedEntry === entry.id ? 'accent.500' : 'dark.500'}
                      onClick={() => setSelectedEntry(entry.id)}
                    >
                      <HStack>
                        <ListIcon as={() => <span>📄</span>} color="accent.400" />
                        <Text fontSize="sm">{entry.title}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box flex="1" pl={4}>
                {selectedEntryData ? (
                  <VStack align="stretch" spacing={4}>
                    <Heading size="md" color="accent.400">
                      {selectedEntryData.title}
                    </Heading>
                    <Divider borderColor="dark.500" />
                    <Box
                      p={4}
                      bg="dark.700"
                      borderRadius="md"
                      minH="300px"
                      border="1px"
                      borderColor="dark.500"
                    >
                      <Text
                        color="gray.300"
                        lineHeight="tall"
                        whiteSpace="pre-wrap"
                        fontFamily="serif"
                        fontSize="md"
                      >
                        {selectedEntryData.content}
                      </Text>
                    </Box>
                  </VStack>
                ) : (
                  <VStack
                    h="full"
                    justify="center"
                    textAlign="center"
                  >
                    <Text fontSize="4xl" color="gray.600">
                      👈
                    </Text>
                    <Text color="gray.500">
                      选择左侧的日记条目查看内容
                    </Text>
                  </VStack>
                )}
              </Box>
            </HStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
