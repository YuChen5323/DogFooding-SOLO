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
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { addMoney } from '../store/slices/statsSlice';
import { removeItem } from '../store/slices/inventorySlice';
import { showNotification } from '../store/slices/uiSlice';
import { getCropById } from '../data/crops';
import { CROPS } from '../data/crops';
import { ANIMAL_PRODUCTS, getAnimalProductById } from '../data/animals';
import { PROCESSED_ITEMS } from '../data/recipes';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, string> = {
  seed: '🌱',
  crop: '🌾',
  animal_product: '🥚',
  processed: '🍳',
  tool: '🔧',
  material: '📦',
};

const categoryNames: Record<string, string> = {
  seed: '种子',
  crop: '作物',
  animal_product: '动物产物',
  processed: '加工品',
  tool: '工具',
  material: '材料',
};

const getItemInfo = (item: any): { name: string; icon: string; sellPrice: number } => {
  const crop = getCropById(item.itemId);
  if (crop) {
    return { name: crop.name, icon: crop.icon, sellPrice: crop.sellPrice };
  }

  const animalProduct = getAnimalProductById(item.itemId);
  if (animalProduct) {
    return { name: animalProduct.name, icon: animalProduct.icon, sellPrice: animalProduct.sellPrice };
  }

  const processedItem = PROCESSED_ITEMS.find(p => p.id === item.itemId);
  if (processedItem) {
    return { name: processedItem.name, icon: processedItem.icon, sellPrice: processedItem.sellPrice };
  }

  if (item.itemId.includes('_seed')) {
    const cropId = item.itemId.replace('_seed', '');
    const cropData = getCropById(cropId);
    if (cropData) {
      return { name: `${cropData.name}种子`, icon: '🌱', sellPrice: Math.floor(cropData.buyPrice * 0.5) };
    }
  }

  const materialNames: Record<string, { name: string; icon: string; sellPrice: number }> = {
    basic_fertilizer: { name: '基础肥料', icon: '💩', sellPrice: 50 },
    quality_fertilizer: { name: '优质肥料', icon: '✨', sellPrice: 125 },
    hay: { name: '干草', icon: '🌾', sellPrice: 25 },
  };

  if (materialNames[item.itemId]) {
    return materialNames[item.itemId];
  }

  return { name: item.itemId, icon: '📦', sellPrice: 10 };
};

const InventoryModal = ({ isOpen, onClose }: InventoryModalProps) => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((state) => state.inventory);

  const itemsByCategory = (() => {
    const result: Record<string, typeof inventory.items> = {};
    for (const item of inventory.items) {
      if (!result[item.category]) {
        result[item.category] = [];
      }
      result[item.category].push(item);
    }
    return result;
  })();

  const categories = Object.keys(itemsByCategory);

  const handleSellItem = (item: any) => {
    const itemInfo = getItemInfo(item);
    const sellPrice = itemInfo.sellPrice * item.quantity;
    
    dispatch(addMoney(sellPrice));
    dispatch(removeItem({ itemId: item.itemId, quantity: item.quantity }));
    dispatch(showNotification({
      message: `出售 ${itemInfo.name} x${item.quantity}，获得 ${sellPrice} 金币！`,
      type: 'success',
    }));
  };

  const totalValue = inventory.items.reduce((total, item) => {
    const itemInfo = getItemInfo(item);
    return total + itemInfo.sellPrice * item.quantity;
  }, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg="pixel.50"
        border="6px solid"
        borderColor="pixel.600"
        boxShadow="8px 8px 0px #00000040"
        borderRadius={0}
        maxH="80vh"
      >
        <ModalHeader
          bg="pixel.200"
          borderBottom="4px solid"
          borderColor="pixel.500"
          p={4}
        >
          <HStack justify="space-between" align="center">
            <HStack>
              <Text fontSize="2xl">🎒</Text>
              <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                背包
              </Text>
            </HStack>
            <HStack>
              <Badge
                bg="pixel.300"
                color="pixel.800"
                fontSize="sm"
                p={2}
                border="2px solid"
                borderColor="pixel.500"
              >
                {inventory.items.length}/{inventory.maxSlots} 格
              </Badge>
              <Badge
                bg="grass.300"
                color="pixel.800"
                fontSize="sm"
                p={2}
                border="2px solid"
                borderColor="grass.500"
              >
                💰 总价值: {totalValue.toLocaleString()}
              </Badge>
            </HStack>
          </HStack>
        </ModalHeader>

        <ModalCloseButton size="lg" top={3} right={3} />

        <ModalBody p={0}>
          {inventory.items.length === 0 ? (
            <VStack justify="center" align="center" py={16} spacing={4}>
              <Text fontSize="6xl">📦</Text>
              <Text fontSize="lg" color="pixel.600">
                背包是空的...
              </Text>
              <Text fontSize="sm" color="pixel.500">
                去商店购买一些种子开始你的农场之旅吧！
              </Text>
            </VStack>
          ) : categories.length === 1 ? (
            <Box p={4}>
              <Grid templateColumns="repeat(6, 1fr)" gap={3}>
                {inventory.items.map((item) => {
                  const itemInfo = getItemInfo(item);
                  return (
                    <GridItem key={item.id}>
                      <Box
                        bg="pixel.100"
                        border="3px solid"
                        borderColor="pixel.400"
                        borderRadius={0}
                        p={2}
                        textAlign="center"
                        cursor="pointer"
                        _hover={{
                          bg: 'pixel.200',
                          borderColor: 'pixel.500',
                          transform: 'translate(-2px, -2px)',
                          boxShadow: '4px 4px 0px #00000030',
                        }}
                        transition="all 0.1s"
                        onClick={() => handleSellItem(item)}
                      >
                        <Text fontSize="2xl">{itemInfo.icon}</Text>
                        <Text fontSize="xs" color="pixel.700" noOfLines={1}>
                          {itemInfo.name}
                        </Text>
                        <HStack justify="space-between" mt={1}>
                          <Badge fontSize="xs" bg="pixel.300" color="pixel.800">
                            x{item.quantity}
                          </Badge>
                          <Badge fontSize="xs" bg="grass.200" color="grass.700">
                            💰{itemInfo.sellPrice}
                          </Badge>
                        </HStack>
                      </Box>
                    </GridItem>
                  );
                })}
              </Grid>
              <Text fontSize="xs" color="pixel.500" mt={4} textAlign="center">
                💡 提示：点击物品可以将其出售
              </Text>
            </Box>
          ) : (
            <Tabs variant="enclosed">
              <TabList
                bg="pixel.100"
                borderBottom="4px solid"
                borderColor="pixel.400"
                px={4}
                pt={2}
              >
                {categories.map((category) => (
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
                  >
                    <HStack>
                      <Text>{categoryIcons[category]}</Text>
                      <Text fontSize="xs">{categoryNames[category]}</Text>
                      <Badge
                        bg="pixel.400"
                        color="white"
                        fontSize="xs"
                        ml={1}
                      >
                        {itemsByCategory[category].length}
                      </Badge>
                    </HStack>
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                {categories.map((category) => (
                  <TabPanel key={category} p={4}>
                    <Grid templateColumns="repeat(6, 1fr)" gap={3}>
                      {itemsByCategory[category].map((item) => {
                        const itemInfo = getItemInfo(item);
                        return (
                          <GridItem key={item.id}>
                            <Box
                              bg="pixel.100"
                              border="3px solid"
                              borderColor="pixel.400"
                              borderRadius={0}
                              p={2}
                              textAlign="center"
                              cursor="pointer"
                              _hover={{
                                bg: 'pixel.200',
                                borderColor: 'pixel.500',
                                transform: 'translate(-2px, -2px)',
                                boxShadow: '4px 4px 0px #00000030',
                              }}
                              transition="all 0.1s"
                              onClick={() => handleSellItem(item)}
                            >
                              <Text fontSize="2xl">{itemInfo.icon}</Text>
                              <Text fontSize="xs" color="pixel.700" noOfLines={1}>
                                {itemInfo.name}
                              </Text>
                              <HStack justify="space-between" mt={1}>
                                <Badge fontSize="xs" bg="pixel.300" color="pixel.800">
                                  x{item.quantity}
                                </Badge>
                                <Badge fontSize="xs" bg="grass.200" color="grass.700">
                                  💰{itemInfo.sellPrice}
                                </Badge>
                              </HStack>
                            </Box>
                          </GridItem>
                        );
                      })}
                    </Grid>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>

        <ModalFooter
          bg="pixel.100"
          borderTop="4px solid"
          borderColor="pixel.400"
          p={4}
          justify="space-between"
        >
          <Text fontSize="xs" color="pixel.600">
            💡 物品价值会根据稀有度和品质有所不同
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

export default InventoryModal;
