import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Box,
  Text,
  Button
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { currentDialogueAtom, isGamePausedAtom } from '../store/atoms';
import { audioManager } from '../services/audio';

export const DialogueBox: React.FC = () => {
  const [dialogue, setDialogue] = useAtom(currentDialogueAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (dialogue) {
      setIsTyping(true);
      setDisplayedText('');
      let index = 0;
      const interval = setInterval(() => {
        if (index < dialogue.length) {
          setDisplayedText(dialogue.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [dialogue]);

  const handleClose = () => {
    if (isTyping) {
      setDisplayedText(dialogue || '');
      setIsTyping(false);
    } else {
      setDialogue(null);
      setIsGamePaused(false);
      audioManager.playSound('click');
    }
  };

  if (!dialogue) return null;

  return (
    <Modal
      isOpen={!!dialogue}
      onClose={handleClose}
      size="xl"
      isCentered
      closeOnOverlayClick={!isTyping}
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(2px)" />
      <ModalContent
        bg="dark.800"
        border="2px"
        borderColor="accent.500"
        borderRadius="lg"
        boxShadow="0 0 30px rgba(255, 166, 0, 0.2)"
      >
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Box
              p={4}
              bg="dark.700"
              borderRadius="md"
              border="1px"
              borderColor="dark.500"
              minH="120px"
            >
              <Text
                color="gray.200"
                fontSize="lg"
                lineHeight="tall"
                whiteSpace="pre-wrap"
                fontFamily="serif"
              >
                {displayedText}
                {isTyping && (
                  <Text as="span" animation="pulse">
                    ▊
                  </Text>
                )}
              </Text>
            </Box>

            <HStack justify="flex-end">
              <Button
                variant="ghost"
                colorScheme="orange"
                size="sm"
                onClick={handleClose}
              >
                {isTyping ? '跳过' : '继续 (点击/空格)'}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
