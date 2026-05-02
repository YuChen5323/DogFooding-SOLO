import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Grid,
  GridItem,
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Heading,
  Divider,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import {
  isInventoryOpenAtom,
  inventoryAtom,
  selectedInventoryItemAtom,
  isGamePausedAtom
} from '../store/atoms';
import { items } from '../game/data/items';
import { Item } from '../types/game';

interface InventoryProps {
  onCombine?: (item1: string, item2: string) => boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ onCombine }) => {
  const [isOpen, setIsOpen] = useAtom(isInventoryOpenAtom);
  const [inventory] = useAtom(inventoryAtom);
  const [selectedItem, setSelectedItem] = useAtom(selectedInventoryItemAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);
  const [combineMode, setCombineMode] = useState(false);
  const [firstItem, setFirstItem] = useState<string | null>(null);
  const toast = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setIsGamePaused(false);
    setCombineMode(false);
    setFirstItem(null);
    setSelectedItem(null);
  };

  const handleItemClick = (itemId: string) => {
    if (combineMode) {
      if (firstItem) {
        if (firstItem === itemId) {
          setFirstItem(null);
        } else {
          if (onCombine) {
            const success = onCombine(firstItem, itemId);
            if (success) {
              toast({
                title: '组合成功！',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } else {
              toast({
                title: '无法组合',
                description: '这两个物品无法组合',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
            }
          }
          setCombineMode(false);
          setFirstItem(null);
        }
      } else {
        setFirstItem(itemId);
      }
    } else {
      setSelectedItem(selectedItem === itemId ? null : itemId);
    }
  };

  const selectedItemData: Item | undefined = selectedItem ? items[selectedItem] : undefined;

  const getCombinableItems = (itemId: string) => {
    const item = items[itemId];
    if (!item?.combinable) return [];
    return item.combinable.filter(id => inventory.includes(id));
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={handleClose}
      size="md"
    >
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent bg="dark.800" borderLeft="1px" borderColor="dark.500">
        <DrawerCloseButton color="gray.300" />
        <DrawerHeader color="accent.400">
          <HStack>
            <Text fontSize="2xl">🎒</Text>
            <Heading size="md">道具栏</Heading>
          </HStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
            <Text color="gray.400" fontSize="sm">
              物品数量: {inventory.length}/20
            </Text>
            <Button
              size="sm"
              variant={combineMode ? 'solid' : 'outline'}
              colorScheme={combineMode ? 'orange' : 'orange'}
              onClick={() => {
                setCombineMode(!combineMode);
                setFirstItem(null);
              }}
              isDisabled={inventory.length < 2}
            >
              {combineMode ? '取消组合' : '🔧 组合物品'}
            </Button>
          </HStack>

            {combineMode && (
              <Box
                p={3}
                bg="accent.900"
                borderRadius="md"
                border="1px"
                borderColor="accent.500"
              >
                <Text color="accent.300" fontSize="sm">
                {firstItem
                  ? `已选择: ${items[firstItem]?.name} - 请选择另一个物品组合`
                  : '请选择第一个物品'}
                </Text>
              </Box>
            )}

            <Divider borderColor="dark.500" />

            {inventory.length === 0 ? (
              <Box
                p={8}
                textAlign="center"
              >
                <Text fontSize="4xl" mb={2}>📦</Text>
                <Text color="gray.500">道具栏为空</Text>
                <Text color="gray.600" fontSize="sm">
                  在游戏中探索以收集物品
                </Text>
              </Box>
            ) : (
              <Grid
                templateColumns="repeat(4, 1fr)"
                gap={2}
              >
                {inventory.map((itemId) => {
                  const item = items[itemId];
                  const isSelected = selectedItem === itemId;
                  const isFirstInCombine = firstItem === itemId;
                  const combinable = !combineMode && item?.combinable && getCombinableItems(itemId).length > 0;

                  return (
                    <GridItem key={itemId}>
                      <Tooltip
                        label={item?.name}
                        placement="top"
                        hasArrow
                      >
                        <Box
                          w="full"
                          h="70px"
                          bg={isFirstInCombine ? 'accent.600' : isSelected ? 'dark.500' : 'dark.700'}
                          border="2px"
                          borderColor={isFirstInCombine ? 'accent.300' : isSelected ? 'accent.500' : 'dark.500'}
                          borderRadius="md"
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{
                            borderColor: 'accent.400',
                            transform: 'scale(1.05)',
                          }}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          position="relative"
                          onClick={() => handleItemClick(itemId)}
                        >
                          <Text fontSize="32px">{item?.icon || '?'}</Text>
                          {combinable && (
                            <Box
                              position="absolute"
                              top="2px"
                              right="2px"
                              w="12px"
                              h="12px"
                              bg="accent.500"
                              borderRadius="full"
                            />
                          )}
                        </Box>
                      </Tooltip>
                    </GridItem>
                  );
                })}
              </Grid>
            )}

            {selectedItemData && (
              <Box
              mt={4}
              p={4}
              bg="dark.700"
              borderRadius="md"
              border="1px"
              borderColor="dark.500"
            >
              <HStack mb={3}>
                <Text fontSize="3xl">{selectedItemData.icon}</Text>
                <VStack align="start" spacing={0}>
                  <Heading size="sm" color="accent.400">
                    {selectedItemData.name}
                  </Heading>
                  {selectedItemData.combinable && selectedItemData.combinable.length > 0 && (
                    <Text fontSize="xs" color="accent.600">
                      可组合物品
                    </Text>
                  )}
                </VStack>
              </HStack>
              <Text color="gray.300" fontSize="sm">
                {selectedItemData.description}
              </Text>
              {selectedItemData.combinable && selectedItemData.combinable.length > 0 && (
                <Box mt={3}>
                  <Text color="gray.500" fontSize="xs" mb={1}>
                    可组合:
                  </Text>
                  <HStack>
                    {selectedItemData.combinable.map((combineId) => {
                      const combineItem = items[combineId];
                      const hasItem = inventory.includes(combineId);
                      return (
                        <Box
                          key={combineId}
                          px={2}
                          py={1}
                          bg={hasItem ? 'dark.600' : 'dark.800'}
                          border="1px"
                          borderColor={hasItem ? 'accent.500' : 'dark.600'}
                          borderRadius="md"
                          opacity={hasItem ? 1 : 0.5}
                        >
                          <Text fontSize="sm">
                            {combineItem?.icon} {combineItem?.name}
                          </Text>
                        </Box>
                      );
                    })}
                  </HStack>
                </Box>
              )}
            </Box>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
