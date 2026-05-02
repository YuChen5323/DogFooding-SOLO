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
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { feedAnimal, petAnimal, collectProduce } from '../store/slices/barnSlice';
import { addItem } from '../store/slices/inventorySlice';
import { addStamina } from '../store/slices/statsSlice';
import { showNotification } from '../store/slices/uiSlice';
import { getAnimalProductById } from '../data/animals';

interface BarnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BarnModal = ({ isOpen, onClose }: BarnModalProps) => {
  const dispatch = useAppDispatch();
  const barn = useAppSelector((state) => state.barn);
  const [selectedBarn, setSelectedBarn] = useState<string>(barn.barns[0]?.id || '');

  const currentBarn = barn.barns.find(b => b.id === selectedBarn);

  const handleFeedAnimal = (animal: any, barnId: string) => {
    if (animal.fedToday) {
      dispatch(showNotification({
        message: `${animal.name} 今天已经喂过了！`,
        type: 'info',
      }));
      return;
    }

    dispatch(feedAnimal({ animalId: animal.id, barnId }));
    dispatch(showNotification({
      message: `喂食了 ${animal.name}！`,
      type: 'success',
    }));
  };

  const handlePetAnimal = (animal: any, barnId: string) => {
    if (animal.petToday) {
      dispatch(showNotification({
        message: `${animal.name} 今天已经抚摸过了！`,
        type: 'info',
      }));
      return;
    }

    dispatch(petAnimal({ animalId: animal.id, barnId }));
    dispatch(addStamina(10));
    dispatch(showNotification({
      message: `抚摸了 ${animal.name}，恢复了一点体力！`,
      type: 'success',
    }));
  };

  const handleCollectProduce = (animal: any, barnId: string) => {
    if (!animal.produceReady) {
      dispatch(showNotification({
        message: `${animal.name} 还没有产出！`,
        type: 'info',
      }));
      return;
    }

    const product = getAnimalProductById(animal.type.produceId);
    if (product) {
      dispatch(collectProduce({ animalId: animal.id, barnId }));
      dispatch(addItem({
        itemId: product.id,
        quantity: 1,
        category: 'animal_product',
      }));
      dispatch(showNotification({
        message: `收集了 ${product.name}！`,
        type: 'success',
      }));
    }
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
              <Text fontSize="2xl">🐄</Text>
              <Text fontSize="lg" fontWeight="bold" color="pixel.700">
                畜牧小屋
              </Text>
            </HStack>
            <HStack spacing={4}>
              {barn.barns.map((b) => (
                <Badge
                  key={b.id}
                  cursor="pointer"
                  onClick={() => setSelectedBarn(b.id)}
                  bg={selectedBarn === b.id ? 'pixel.400' : 'pixel.200'}
                  color={selectedBarn === b.id ? 'white' : 'pixel.800'}
                  border="3px solid"
                  borderColor={selectedBarn === b.id ? 'pixel.600' : 'pixel.400'}
                  p={2}
                  fontSize="sm"
                  _hover={{
                    bg: 'pixel.300',
                  }}
                >
                  {b.name} ({b.animals.length}/{b.maxAnimals})
                </Badge>
              ))}
            </HStack>
          </HStack>
        </ModalHeader>

        <ModalCloseButton size="lg" top={3} right={3} />

        <ModalBody p={4}>
          {!currentBarn || currentBarn.animals.length === 0 ? (
            <VStack justify="center" align="center" py={16} spacing={4}>
              <Text fontSize="6xl">🏠</Text>
              <Text fontSize="lg" color="pixel.600">
                这个畜舍里还没有动物...
              </Text>
              <Text fontSize="sm" color="pixel.500">
                去商店购买一些动物来饲养吧！
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
              {currentBarn.animals.map((animal) => (
                <GridItem key={animal.id}>
                  <Box
                    bg="pixel.100"
                    border="4px solid"
                    borderColor="pixel.400"
                    borderRadius={0}
                    p={4}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <HStack>
                          <Text fontSize="4xl">{animal.type.icon}</Text>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="md" fontWeight="bold" color="pixel.700">
                              {animal.name}
                            </Text>
                            <Text fontSize="xs" color="pixel.500">
                              {animal.type.name}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2}>
                          {animal.produceReady && (
                            <Tooltip label="可以收集产出了！">
                              <Badge
                                bg="yellow.300"
                                color="yellow.800"
                                border="2px solid"
                                borderColor="yellow.500"
                                p={1}
                                fontSize="sm"
                              >
                                ✨ 产出
                              </Badge>
                            </Tooltip>
                          )}
                        </HStack>
                      </HStack>

                      <VStack spacing={2} align="stretch">
                        <VStack align="start" spacing={1}>
                          <HStack justify="space-between" w="100%">
                            <Text fontSize="xs" color="pixel.700">
                              💗 心情
                            </Text>
                            <Text fontSize="xs" color="pixel.600">
                              {animal.happiness}/{animal.type.maxHappiness}
                            </Text>
                          </HStack>
                          <Progress
                            value={(animal.happiness / animal.type.maxHappiness) * 100}
                            size="sm"
                            bg="pixel.200"
                            border="2px solid"
                            borderColor="pixel.400"
                            borderRadius={0}
                            sx={{
                              '& > div': {
                                bg: animal.happiness > animal.type.maxHappiness * 0.5 
                                  ? 'pink.400' 
                                  : 'orange.400',
                              },
                            }}
                          />
                        </VStack>

                        <VStack align="start" spacing={1}>
                          <HStack justify="space-between" w="100%">
                            <Text fontSize="xs" color="pixel.700">
                              🍖 饱食度
                            </Text>
                            <Text fontSize="xs" color="pixel.600">
                              {animal.hunger}/{animal.type.maxHunger}
                            </Text>
                          </HStack>
                          <Progress
                            value={(animal.hunger / animal.type.maxHunger) * 100}
                            size="sm"
                            bg="pixel.200"
                            border="2px solid"
                            borderColor="pixel.400"
                            borderRadius={0}
                            sx={{
                              '& > div': {
                                bg: animal.hunger > animal.type.maxHunger * 0.3 
                                  ? 'orange.400' 
                                  : 'red.400',
                              },
                            }}
                          />
                        </VStack>

                        {animal.type.produceTime > 0 && (
                          <VStack align="start" spacing={1}>
                            <HStack justify="space-between" w="100%">
                              <Text fontSize="xs" color="pixel.700">
                                ⏰ 产出进度
                              </Text>
                              <Text fontSize="xs" color="pixel.600">
                                {animal.produceProgress}/{animal.type.produceTime}天
                              </Text>
                            </HStack>
                            <Progress
                              value={(animal.produceProgress / animal.type.produceTime) * 100}
                              size="sm"
                              bg="pixel.200"
                              border="2px solid"
                              borderColor="pixel.400"
                              borderRadius={0}
                              sx={{
                                '& > div': {
                                  bg: 'purple.400',
                                },
                              }}
                            />
                          </VStack>
                        )}
                      </VStack>

                      <HStack justify="space-between" spacing={2}>
                        <Tooltip label="喂食动物">
                          <Button
                            size="sm"
                            fontSize="xs"
                            bg={animal.fedToday ? 'gray.300' : 'pixel.400'}
                            color={animal.fedToday ? 'gray.600' : 'white'}
                            border="3px solid"
                            borderColor={animal.fedToday ? 'gray.400' : 'pixel.600'}
                            borderRadius={0}
                            isDisabled={animal.fedToday}
                            onClick={() => handleFeedAnimal(animal, selectedBarn)}
                            leftIcon={<span>🍖</span>}
                            _hover={{
                              bg: animal.fedToday ? 'gray.300' : 'pixel.500',
                            }}
                          >
                            喂食
                          </Button>
                        </Tooltip>

                        <Tooltip label="抚摸动物">
                          <Button
                            size="sm"
                            fontSize="xs"
                            bg={animal.petToday ? 'gray.300' : 'pink.400'}
                            color={animal.petToday ? 'gray.600' : 'white'}
                            border="3px solid"
                            borderColor={animal.petToday ? 'gray.400' : 'pink.600'}
                            borderRadius={0}
                            isDisabled={animal.petToday}
                            onClick={() => handlePetAnimal(animal, selectedBarn)}
                            leftIcon={<span>💗</span>}
                            _hover={{
                              bg: animal.petToday ? 'gray.300' : 'pink.500',
                            }}
                          >
                            抚摸
                          </Button>
                        </Tooltip>

                        {animal.type.produceTime > 0 && (
                          <Tooltip label="收集产出">
                            <Button
                              size="sm"
                              fontSize="xs"
                              bg={animal.produceReady ? 'yellow.400' : 'gray.300'}
                              color={animal.produceReady ? 'yellow.900' : 'gray.600'}
                              border="3px solid"
                              borderColor={animal.produceReady ? 'yellow.600' : 'gray.400'}
                              borderRadius={0}
                              isDisabled={!animal.produceReady}
                              onClick={() => handleCollectProduce(animal, selectedBarn)}
                              leftIcon={<span>🥚</span>}
                              _hover={{
                                bg: animal.produceReady ? 'yellow.500' : 'gray.300',
                              }}
                            >
                              收集
                            </Button>
                          </Tooltip>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                </GridItem>
              ))}
            </Grid>
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
            💡 提示：每天喂食和抚摸动物可以提高它们的心情值
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

export default BarnModal;
