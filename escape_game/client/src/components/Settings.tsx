import React from 'react';
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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Heading,
  Button,
  Divider,
  useToast,
  Switch,
  Box
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import {
  isSettingsOpenAtom,
  volumeAtom,
  isMutedAtom,
  isGamePausedAtom
} from '../store/atoms';
import { audioManager } from '../services/audio';

interface SettingsProps {
  onSaveGame?: () => void;
  onLoadGame?: () => void;
  onReturnToMenu?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onSaveGame,
  onLoadGame,
  onReturnToMenu
}) => {
  const [isOpen, setIsOpen] = useAtom(isSettingsOpenAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [_, setIsGamePaused] = useAtom(isGamePausedAtom);
  const toast = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setIsGamePaused(false);
  };

  const handleMasterVolumeChange = (value: number) => {
    const newVolume = { ...volume, master: value / 100 };
    setVolume(newVolume);
    audioManager.setVolumes(
      newVolume.master,
      newVolume.music,
      newVolume.sfx
    );
  };

  const handleMusicVolumeChange = (value: number) => {
    const newVolume = { ...volume, music: value / 100 };
    setVolume(newVolume);
    audioManager.setVolumes(
      newVolume.master,
      newVolume.music,
      newVolume.sfx
    );
  };

  const handleSfxVolumeChange = (value: number) => {
    const newVolume = { ...volume, sfx: value / 100 };
    setVolume(newVolume);
    audioManager.setVolumes(
      newVolume.master,
      newVolume.music,
      newVolume.sfx
    );
  };

  const handleMuteToggle = (checked: boolean) => {
    setIsMuted(checked);
    audioManager.setMuted(checked);
  };

  const handleSave = () => {
    if (onSaveGame) {
      onSaveGame();
    } else {
      toast({
        title: '已保存',
        description: '游戏进度已保存',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      isCentered
    >
      <ModalOverlay backdropFilter="blur(8px)" />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text fontSize="2xl">⚙️</Text>
            <Heading size="md" color="accent.400">设置</Heading>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            <VStack align="stretch" spacing={4}>
              <Heading size="sm" color="accent.400">🔊 音量控制</Heading>
              
              <HStack justify="space-between">
                <Text color="gray.300">静音</Text>
                <Switch
                  isChecked={isMuted}
                  onChange={(e) => handleMuteToggle(e.target.checked)}
                  colorScheme="orange"
                />
              </HStack>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text color="gray.300">主音量</Text>
                  <Text color="accent.400">{Math.round(volume.master * 100)}%</Text>
                </HStack>
                <Slider
                  value={volume.master * 100}
                  min={0}
                  max={100}
                  onChange={handleMasterVolumeChange}
                  isDisabled={isMuted}
                >
                  <SliderTrack bg="dark.600">
                    <SliderFilledTrack bg="accent.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={6} bg="accent.400" />
                </Slider>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text color="gray.300">背景音乐</Text>
                  <Text color="accent.400">{Math.round(volume.music * 100)}%</Text>
                </HStack>
                <Slider
                  value={volume.music * 100}
                  min={0}
                  max={100}
                  onChange={handleMusicVolumeChange}
                  isDisabled={isMuted}
                >
                  <SliderTrack bg="dark.600">
                    <SliderFilledTrack bg="accent.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={6} bg="accent.400" />
                </Slider>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text color="gray.300">音效</Text>
                  <Text color="accent.400">{Math.round(volume.sfx * 100)}%</Text>
                </HStack>
                <Slider
                  value={volume.sfx * 100}
                  min={0}
                  max={100}
                  onChange={handleSfxVolumeChange}
                  isDisabled={isMuted}
                >
                  <SliderTrack bg="dark.600">
                    <SliderFilledTrack bg="accent.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={6} bg="accent.400" />
                </Slider>
              </Box>
            </VStack>

            <Divider borderColor="dark.500" />

            <VStack align="stretch" spacing={4}>
              <Heading size="sm" color="accent.400">💾 游戏进度</Heading>
              
              <VStack spacing={3}>
                <Button
                  w="full"
                  variant="outline"
                  colorScheme="orange"
                  leftIcon={<span>💾</span>}
                  onClick={handleSave}
                >
                  保存游戏
                </Button>

                {onLoadGame && (
                  <Button
                    w="full"
                    variant="outline"
                    colorScheme="orange"
                    leftIcon={<span>📂</span>}
                    onClick={onLoadGame}
                  >
                    读取存档
                  </Button>
                )}

                {onReturnToMenu && (
                  <Button
                    w="full"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<span>🏠</span>}
                    onClick={onReturnToMenu}
                  >
                    返回主菜单
                  </Button>
                )}
              </VStack>
            </VStack>

            <Divider borderColor="dark.500" />

            <VStack align="stretch" spacing={3}>
              <Heading size="sm" color="accent.400">⌨️ 操作说明</Heading>
              <VStack align="start" spacing={2}>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">方向键 / WASD</Text> - 移动角色
                </Text>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">空格键 / E</Text> - 互动
                </Text>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">I 键</Text> - 打开道具栏
                </Text>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">J 键</Text> - 打开日记
                </Text>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">H 键</Text> - 查看提示
                </Text>
                <Text color="gray.400" fontSize="sm">
                  <Text as="span" color="accent.400">ESC 键</Text> - 打开设置
                </Text>
              </VStack>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="solid" onClick={handleClose}>
            继续游戏
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
