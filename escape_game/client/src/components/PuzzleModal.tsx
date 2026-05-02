import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Button,
  Grid,
  GridItem,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import {
  currentPuzzleAtom,
  isGamePausedAtom
} from '../store/atoms';
import { puzzles } from '../game/data/rooms';
import { audioManager } from '../services/audio';

interface PuzzleModalProps {
  onSolve: (puzzleId: string) => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ onSolve }) => {
  const [puzzleId, setPuzzleId] = useAtom(currentPuzzleAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);
  const [input, setInput] = useState<string>('');
  const [combination, setCombination] = useState<string[]>([]);
  const toast = useToast();

  const puzzle = puzzleId ? puzzles[puzzleId] : null;

  const handleClose = () => {
    setPuzzleId(null);
    setIsGamePaused(false);
    setInput('');
    setCombination([]);
  };

  const handleNumberInput = (num: string) => {
    if (input.length < 4) {
      setInput(input + num);
      audioManager.playSound('click');
    }
  };

  const handleClear = () => {
    setInput('');
    audioManager.playSound('click');
  };

  const handleDelete = () => {
    setInput(input.slice(0, -1));
    audioManager.playSound('click');
  };

  const handleCombinationSelect = (symbol: string) => {
    if (combination.length < 2) {
      setCombination([...combination, symbol]);
      audioManager.playSound('click');
    }
  };

  const handleCombinationClear = () => {
    setCombination([]);
    audioManager.playSound('click');
  };

  const isCombinationCorrect = () => {
    if (!puzzle || puzzle.type !== 'combination_lock') return false;
    const solution = puzzle.solution as string[];
    if (combination.length !== solution.length) return false;
    return combination.every((c, i) => c === solution[i]);
  };

  const handleSubmit = () => {
    if (!puzzle) return;

    let isCorrect = false;

    switch (puzzle.type) {
      case 'number_pad':
        isCorrect = input === puzzle.solution;
        break;
      case 'combination_lock':
        isCorrect = isCombinationCorrect();
        break;
      default:
        break;
    }

    if (isCorrect) {
      audioManager.playSound('puzzle_solve');
      toast({
        title: '谜题解开！',
        description: puzzle.rewardItem ? '获得了新物品！' : '门已打开！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSolve(puzzleId!);
      handleClose();
    } else {
      audioManager.playSound('error');
      toast({
        title: '错误',
        description: '答案不正确，再试一次...',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  if (!puzzle) return null;

  const renderNumberPad = () => {
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

    return (
      <VStack spacing={4}>
        <Box
          w="full"
          p={4}
          bg="dark.700"
          borderRadius="md"
          border="2px"
          borderColor="dark.500"
          textAlign="center"
        >
          <Text
            fontSize="3xl"
            fontFamily="mono"
            letterSpacing="wider"
            color="accent.400"
          >
            {input.padEnd(4, '_')}
          </Text>
        </Box>

        <Grid templateColumns="repeat(3, 1fr)" gap={3}>
          {numbers.map((num, index) => (
            <GridItem key={index}>
              {num === '' ? (
                <Box h="50px" />
              ) : num === '⌫' ? (
                <Button
                  h="50px"
                  w="full"
                  fontSize="xl"
                  variant="outline"
                  colorScheme="orange"
                  onClick={handleDelete}
                >
                  {num}
                </Button>
              ) : (
                <Button
                  h="50px"
                  w="full"
                  fontSize="xl"
                  variant="solid"
                  bg="dark.600"
                  _hover={{ bg: 'dark.500' }}
                  onClick={() => handleNumberInput(num)}
                >
                  {num}
                </Button>
              )}
            </GridItem>
          ))}
        </Grid>

        <Button
          w="full"
          variant="ghost"
          colorScheme="gray"
          onClick={handleClear}
        >
          清除
        </Button>
      </VStack>
    );
  };

  const renderCombinationLock = () => {
    const symbols = ['sun', 'moon', 'star', 'cloud'];
    const symbolIcons: Record<string, string> = {
      sun: '☀️',
      moon: '🌙',
      star: '⭐',
      cloud: '☁️'
    };
    const symbolNames: Record<string, string> = {
      sun: '太阳',
      moon: '月亮',
      star: '星星',
      cloud: '云朵'
    };

    return (
      <VStack spacing={4}>
        <Box
          w="full"
          p={4}
          bg="dark.700"
          borderRadius="md"
          border="2px"
          borderColor="dark.500"
          textAlign="center"
        >
          <HStack justify="center" spacing={4}>
            {[0, 1].map((i) => (
              <Box
                key={i}
                w="60px"
                h="60px"
                bg="dark.600"
                borderRadius="md"
                border="2px"
                borderColor="accent.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="3xl">
                  {combination[i] ? symbolIcons[combination[i]] : '?'}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>

        <Text color="gray.400" fontSize="sm">
          选择符号组合
        </Text>

        <Grid templateColumns="repeat(4, 1fr)" gap={3}>
          {symbols.map((symbol) => (
            <GridItem key={symbol}>
              <Tooltip label={symbolNames[symbol]}>
                <Button
                  h="60px"
                  w="full"
                  fontSize="2xl"
                  variant={combination.includes(symbol) ? 'solid' : 'outline'}
                  colorScheme="orange"
                  onClick={() => handleCombinationSelect(symbol)}
                >
                  {symbolIcons[symbol]}
                </Button>
              </Tooltip>
            </GridItem>
          ))}
        </Grid>

        <Button
          w="full"
          variant="ghost"
          colorScheme="gray"
          onClick={handleCombinationClear}
        >
          清除
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      isOpen={!!puzzleId}
      onClose={handleClose}
      size="md"
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay backdropFilter="blur(8px)" />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="accent.400">
              🔒 {puzzle.name}
            </Heading>
            <Text color="gray.400" fontSize="sm">
              {puzzle.hint}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {puzzle.type === 'number_pad' && renderNumberPad()}
          {puzzle.type === 'combination_lock' && renderCombinationLock()}
        </ModalBody>

        <ModalFooter>
          <HStack w="full" justify="flex-end">
            <Button variant="ghost" onClick={handleClose}>
              取消
            </Button>
            <Button variant="solid" onClick={handleSubmit}>
              确认
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
