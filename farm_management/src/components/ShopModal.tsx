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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { subtractMoney } from '../store/slices/statsSlice';
import { addItem } from '../store/slices/inventorySlice';
import { showNotification } from '../store/slices/uiSlice';
import { getShopItemsBySeason, SHOP_ITEMS } from '../data/shop';
import { getAnimalTypeById, ANIMAL_TYPES } from '../data/animals';
import { getCropById } from '../data/crops';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, string> = {
  seed: '🌱',
  animal: '🐔',
  tool: '🔧',
  material: '📦',
};

const categoryNames: Record<string, string> = {
  seed: '种子',
  animal: '动物',
  tool: '工具',
  material: '材料',
};

const ShopModal = ({ isOpen, onClose }: ShopModalProps) => {
  const dispatch = useAppDispatch();
  const time = useAppSelector((state) => state.time);
  const stats = useAppSelector((state) => state.stats);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const seasonItems = getShopItemsBySeason(time.season);
  
  const itemsByCategory = (() => {
    const result: Record<string, typeof SHOP_ITEMS> = {};
    for (const item of seasonItems) {
      if (!result[item.category]) {
        result[item.category] = [];
      }
      result[item.category].push(item);
    }
    return result;
  })();

  const categories = Object.keys(itemsByCategory);

  const getItemInfo = (shopItem: typeof SHOP_ITEMS[0]) => {
    if (shopItem.category === 'seed') {
      const cropId = shopItem.itemId.replace('_seed', '');
      const crop = getCropById(cropId);
      return {
        name: crop ? `${crop.name}种子` : shopItem.name,
        icon: crop ? crop.icon : shopItem.icon,
        description: crop?.description || '',
      };
    }

    if (shopItem.category === 'animal') {
      const animal = getAnimalTypeById(shopItem.itemId);
      return {
        name: animal?.name || shopItem.name,
        icon: animal?.icon || shopItem.icon,
        description: animal?.description || '',
      };
    }

    return {
      name: shopItem.name,
      icon: shopItem.icon,
      description: '',
    };
  };

  const getQuantity = (itemId: string) => {
    return selectedQuantities[itemId] || 1;
  };

  const setQuantity = (itemId: string, quantity: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(99, quantity)),
    }));
  };

  const handleBuyItem = (shopItem: typeof SHOP_ITEMS[0]) => {
    const quantity = getQuantity(shopItem.itemId);
    const totalPrice = shopItem.price * quantity;

    if (stats.money < totalPrice) {
      dispatch(showNotification({
        message: '金币不足！',
        type: 'error',
      }));
      return;
    }

    if (shopItem.stock < quantity) {
      dispatch(showNotification({
        message: '库存不足！',
        type: 'error',
      }));
      return;
    }

    dispatch(subtractMoney(totalPrice));

    let category: any = 'seed';
    if (shopItem.category === 'animal') category = 'tool';
    else if (shopItem.category === 'material') category = 'material';

    dispatch(addItem({
      itemId: shopItem.itemId,
      quantity,
      category,
    }));

    const itemInfo = getItemInfo(shopItem);
    dispatch(showNotification({
      message: `购买 ${itemInfo.name} x${quantity}，花费 ${totalPrice} 金币！`,
      type: 'success',
    }));
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
          <HStack justify="space-between" align="center">
            <HStack>
              <Text fontSize="2xl">🏪</Text>
              <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                商店
              </Text>
            </HStack>
            <HStack>
              <Badge
                bg="grass.300"
                color="pixel.800"
                fontSize="md"
                p={2}
                border="2px solid"
                borderColor="grass.500"
              >
                💰 {stats.money.toLocaleString()}
              </Badge>
            </HStack>
          </HStack>
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
                  <Grid
                    templateColumns={{
                      base: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    }}
                    gap={4}
                  >
                    {itemsByCategory[category].map((shopItem) => {
                      const itemInfo = getItemInfo(shopItem);
                      const quantity = getQuantity(shopItem.itemId);
                      const totalPrice = shopItem.price * quantity;
                      const canAfford = stats.money >= totalPrice;
                      const hasStock = shopItem.stock >= quantity;

                      return (
                        <GridItem key={shopItem.id}>
                          <Box
                            bg="pixel.100"
                            border="4px solid"
                            borderColor={canAfford && hasStock ? 'pixel.400' : 'gray.300'}
                            borderRadius={0}
                            p={3}
                            transition="all 0.1s"
                            opacity={canAfford && hasStock ? 1 : 0.6}
                            _hover={{
                              borderColor: canAfford && hasStock ? 'pixel.500' : 'gray.300',
                              transform: canAfford && hasStock ? 'translate(-2px, -2px)' : 'none',
                              boxShadow: canAfford && hasStock ? '4px 4px 0px #00000030' : 'none',
                            }}
                          >
                            <VStack spacing={3} align="stretch">
                              <VStack spacing={1} align="center">
                                <Text fontSize="4xl">{itemInfo.icon}</Text>
                                <Text fontSize="sm" fontWeight="bold" color="pixel.700" textAlign="center">
                                  {itemInfo.name}
                                </Text>
                                {itemInfo.description && (
                                  <Text fontSize="xs" color="pixel.500" textAlign="center" noOfLines={2}>
                                    {itemInfo.description}
                                  </Text>
                                )}
                              </VStack>

                              <HStack justify="space-between">
                                <Badge
                                  bg={hasStock ? 'pixel.300' : 'red.200'}
                                  color={hasStock ? 'pixel.800' : 'red.700'}
                                  fontSize="xs"
                                  p={1}
                                >
                                  库存: {shopItem.stock}
                                </Badge>
                                <Badge
                                  bg="grass.300"
                                  color="grass.800"
                                  fontSize="xs"
                                  p={1}
                                >
                                  💰{shopItem.price}
                                </Badge>
                              </HStack>

                              <HStack justify="center" align="center" spacing={2}>
                                <NumberInput
                                  value={quantity}
                                  min={1}
                                  max={Math.min(shopItem.stock, 99)}
                                  onChange={(_, value) => setQuantity(shopItem.itemId, value)}
                                  size="sm"
                                  w="100px"
                                >
                                  <NumberInputField
                                    bg="white"
                                    border="3px solid"
                                    borderColor="pixel.400"
                                    borderRadius={0}
                                    textAlign="center"
                                  />
                                  <NumberInputStepper border="none">
                                    <NumberIncrementStepper border="none" />
                                    <NumberDecrementStepper border="none" />
                                  </NumberInputStepper>
                                </NumberInput>
                              </HStack>

                              <Button
                                onClick={() => handleBuyItem(shopItem)}
                                isDisabled={!canAfford || !hasStock}
                                bg={canAfford && hasStock ? 'pixel.400' : 'gray.300'}
                                color={canAfford && hasStock ? 'white' : 'gray.600'}
                                border="4px solid"
                                borderColor={canAfford && hasStock ? 'pixel.600' : 'gray.400'}
                                borderRadius={0}
                                fontSize="xs"
                                _hover={{
                                  bg: canAfford && hasStock ? 'pixel.500' : 'gray.300',
                                }}
                              >
                                购买 (💰{totalPrice})
                              </Button>
                            </VStack>
                          </Box>
                        </GridItem>
                      );
                    })}
                  </Grid>
                </TabPanel>
              ))}
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
            💡 提示：不同季节商店会有不同的种子出售
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

export default ShopModal;
