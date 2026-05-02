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
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { removeItem, addItem } from '../store/slices/inventorySlice';
import { showNotification } from '../store/slices/uiSlice';
import { RECIPES, getRecipeById, PROCESSED_ITEMS } from '../data/recipes';
import { getCropById, CROPS } from '../data/crops';
import { getAnimalProductById, ANIMAL_PRODUCTS } from '../data/animals';

interface KitchenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getItemInfo = (itemId: string): { name: string; icon: string; category: string } => {
  const crop = getCropById(itemId);
  if (crop) {
    return { name: crop.name, icon: crop.icon, category: 'crop' };
  }

  const animalProduct = getAnimalProductById(itemId);
  if (animalProduct) {
    return { name: animalProduct.name, icon: animalProduct.icon, category: 'animal_product' };
  }

  const processedItem = PROCESSED_ITEMS.find(p => p.id === itemId);
  if (processedItem) {
    return { name: processedItem.name, icon: processedItem.icon, category: 'processed' };
  }

  if (itemId.includes('_seed')) {
    const cropId = itemId.replace('_seed', '');
    const cropData = getCropById(cropId);
    if (cropData) {
      return { name: `${cropData.name}种子`, icon: '🌱', category: 'seed' };
    }
  }

  return { name: itemId, icon: '📦', category: 'material' };
};

const KitchenModal = ({ isOpen, onClose }: KitchenModalProps) => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((state) => state.inventory);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

  const getItemQuantity = (itemId: string): number => {
    const item = inventory.items.find(i => i.itemId === itemId);
    return item ? item.quantity : 0;
  };

  const canCraftRecipe = (recipe: typeof RECIPES[0]): boolean => {
    return recipe.ingredients.every(
      (ingredient) => getItemQuantity(ingredient.itemId) >= ingredient.quantity
    );
  };

  const handleCraftRecipe = (recipe: typeof RECIPES[0]) => {
    if (!canCraftRecipe(recipe)) {
      dispatch(showNotification({
        message: '材料不足，无法制作！',
        type: 'error',
      }));
      return;
    }

    for (const ingredient of recipe.ingredients) {
      dispatch(removeItem({ itemId: ingredient.itemId, quantity: ingredient.quantity }));
    }

    dispatch(addItem({
      itemId: recipe.resultItemId,
      quantity: recipe.resultQuantity,
      category: 'processed',
    }));

    const resultInfo = getItemInfo(recipe.resultItemId);
    dispatch(showNotification({
      message: `成功制作 ${resultInfo.name} x${recipe.resultQuantity}！`,
      type: 'success',
    }));
  };

  const selectedRecipeData = selectedRecipe ? getRecipeById(selectedRecipe) : null;

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
          <HStack justify="space-between" align="center">
            <HStack>
              <Text fontSize="2xl">🍳</Text>
              <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                厨房加工台
              </Text>
            </HStack>
            <Badge
              bg="pixel.300"
              color="pixel.800"
              fontSize="sm"
              p={2}
              border="2px solid"
              borderColor="pixel.500"
            >
              共 {RECIPES.length} 种食谱
            </Badge>
          </HStack>
        </ModalHeader>

        <ModalCloseButton size="lg" top={3} right={3} />

        <ModalBody p={0}>
          <Grid templateColumns="1fr 1fr" gap={0} minH="500px">
            <GridItem
              borderRight="4px solid"
              borderColor="pixel.300"
              overflowY="auto"
              maxH="60vh"
            >
              <Box p={3}>
                <Text fontSize="sm" fontWeight="bold" color="pixel.700" mb={3}>
                  📖 食谱列表
                </Text>
                <VStack spacing={2} align="stretch">
                  {RECIPES.map((recipe) => {
                    const canCraft = canCraftRecipe(recipe);
                    const isSelected = selectedRecipe === recipe.id;

                    return (
                      <Box
                        key={recipe.id}
                        bg={isSelected ? 'pixel.300' : canCraft ? 'pixel.100' : 'pixel.50'}
                        border="3px solid"
                        borderColor={isSelected ? 'pixel.600' : canCraft ? 'pixel.400' : 'pixel.200'}
                        borderRadius={0}
                        p={3}
                        cursor="pointer"
                        opacity={canCraft ? 1 : 0.6}
                        _hover={{
                          bg: isSelected ? 'pixel.300' : 'pixel.200',
                          borderColor: isSelected ? 'pixel.600' : 'pixel.500',
                        }}
                        onClick={() => setSelectedRecipe(recipe.id)}
                      >
                        <HStack justify="space-between" align="center">
                          <HStack>
                            <Text fontSize="2xl">{recipe.icon}</Text>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold" color="pixel.700">
                                {recipe.name}
                              </Text>
                              <Text fontSize="xs" color="pixel.500">
                                {recipe.description}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            {canCraft ? (
                              <Badge bg="grass.300" color="grass.800" fontSize="xs">
                                ✓ 可制作
                              </Badge>
                            ) : (
                              <Badge bg="red.200" color="red.700" fontSize="xs">
                                ✗ 材料不足
                              </Badge>
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            </GridItem>

            <GridItem overflowY="auto" maxH="60vh">
              {selectedRecipeData ? (
                <Box p={4}>
                  <VStack align="stretch" spacing={4}>
                    <VStack align="center" spacing={2}>
                      <Text fontSize="5xl">{selectedRecipeData.icon}</Text>
                      <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                        {selectedRecipeData.name}
                      </Text>
                      <Text fontSize="xs" color="pixel.500" textAlign="center">
                        {selectedRecipeData.description}
                      </Text>
                    </VStack>

                    <Divider borderColor="pixel.300" />

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="pixel.700" mb={3}>
                        📦 所需材料
                      </Text>
                      <VStack spacing={2} align="stretch">
                        {selectedRecipeData.ingredients.map((ingredient, index) => {
                          const itemInfo = getItemInfo(ingredient.itemId);
                          const currentQuantity = getItemQuantity(ingredient.itemId);
                          const hasEnough = currentQuantity >= ingredient.quantity;

                          return (
                            <HStack
                              key={index}
                              justify="space-between"
                              bg={hasEnough ? 'grass.50' : 'red.50'}
                              border="2px solid"
                              borderColor={hasEnough ? 'grass.300' : 'red.200'}
                              p={2}
                              borderRadius={0}
                            >
                              <HStack>
                                <Text fontSize="xl">{itemInfo.icon}</Text>
                                <Text fontSize="xs" color="pixel.700">
                                  {itemInfo.name}
                                </Text>
                              </HStack>
                              <Badge
                                bg={hasEnough ? 'grass.300' : 'red.200'}
                                color={hasEnough ? 'grass.800' : 'red.700'}
                                fontSize="xs"
                              >
                                {currentQuantity}/{ingredient.quantity}
                              </Badge>
                            </HStack>
                          );
                        })}
                      </VStack>
                    </Box>

                    <Divider borderColor="pixel.300" />

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="pixel.700" mb={3}>
                        🎁 制作结果
                      </Text>
                      <HStack
                        justify="space-between"
                        bg="pixel.100"
                        border="3px solid"
                        borderColor="pixel.400"
                        p={3}
                        borderRadius={0}
                      >
                        <HStack>
                          <Text fontSize="3xl">
                            {getItemInfo(selectedRecipeData.resultItemId).icon}
                          </Text>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold" color="pixel.700">
                              {getItemInfo(selectedRecipeData.resultItemId).name}
                            </Text>
                            <Text fontSize="xs" color="pixel.500">
                              x{selectedRecipeData.resultQuantity}
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge bg="grass.300" color="grass.800" fontSize="sm" p={2}>
                          💰 出售: {selectedRecipeData.sellPrice}
                        </Badge>
                      </HStack>
                    </Box>

                    <Box>
                      <Button
                        onClick={() => handleCraftRecipe(selectedRecipeData)}
                        isDisabled={!canCraftRecipe(selectedRecipeData)}
                        w="100%"
                        bg={canCraftRecipe(selectedRecipeData) ? 'grass.500' : 'gray.300'}
                        color={canCraftRecipe(selectedRecipeData) ? 'white' : 'gray.600'}
                        border="4px solid"
                        borderColor={canCraftRecipe(selectedRecipeData) ? 'grass.700' : 'gray.400'}
                        borderRadius={0}
                        fontSize="sm"
                        _hover={{
                          bg: canCraftRecipe(selectedRecipeData) ? 'grass.600' : 'gray.300',
                        }}
                      >
                        {canCraftRecipe(selectedRecipeData) ? '🍳 开始制作' : '材料不足'}
                      </Button>
                    </Box>
                  </VStack>
                </Box>
              ) : (
                <VStack justify="center" align="center" h="100%" py={16} spacing={4}>
                  <Text fontSize="6xl">👨‍🍳</Text>
                  <Text fontSize="lg" color="pixel.600">
                    选择一个食谱查看详情
                  </Text>
                  <Text fontSize="xs" color="pixel.500">
                    收集材料后可以在这里加工出售
                  </Text>
                </VStack>
              )}
            </GridItem>
          </Grid>
        </ModalBody>

        <ModalFooter
          bg="pixel.100"
          borderTop="4px solid"
          borderColor="pixel.400"
          p={4}
          justify="space-between"
        >
          <Text fontSize="xs" color="pixel.600">
            💡 提示：加工品通常比原材料售价更高
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

export default KitchenModal;
