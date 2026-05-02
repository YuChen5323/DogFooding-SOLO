import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChakraProvider, Box, useToast } from '@chakra-ui/react';
import Phaser from 'phaser';
import { theme } from './theme';
import { GameScene } from './game/scenes/GameScene';
import { gameConfig } from './game/config';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { Inventory } from './components/Inventory';
import { Diary } from './components/Diary';
import { Settings } from './components/Settings';
import { PuzzleModal } from './components/PuzzleModal';
import { DialogueBox } from './components/DialogueBox';
import { GameEnding } from './components/GameEnding';
import { useAtom, useSetAtom } from 'jotai';
import {
  inventoryAtom,
  diaryEntriesAtom,
  currentRoomAtom,
  currentPuzzleAtom,
  currentDialogueAtom,
  isGamePausedAtom,
  userAtom,
  tokenAtom,
  volumeAtom,
  isMutedAtom
} from './store/atoms';
import { apiService } from './services/api';
import { audioManager } from './services/audio';

type GamePhase = 'menu' | 'playing' | 'ending';

export const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const toast = useToast();

  const setInventory = useSetAtom(inventoryAtom);
  const setDiaryEntries = useSetAtom(diaryEntriesAtom);
  const setCurrentRoom = useSetAtom(currentRoomAtom);
  const [, setCurrentPuzzle] = useAtom(currentPuzzleAtom);
  const [, setCurrentDialogue] = useAtom(currentDialogueAtom);
  const setIsGamePaused = useSetAtom(isGamePausedAtom);
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [volume] = useAtom(volumeAtom);
  const [isMuted] = useAtom(isMutedAtom);

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    audioManager.setVolumes(volume.master, volume.music, volume.sfx);
    audioManager.setMuted(isMuted);
  }, [volume, isMuted]);

  const destroyGame = useCallback(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
      gameSceneRef.current = null;
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current && !gameInstanceRef.current) {
      const config = {
        ...gameConfig,
        parent: gameRef.current,
        scene: [GameScene],
      };

      const callbacks = {
        onRoomChange: (roomId: string) => {
          setCurrentRoom(roomId);
        },
        onInventoryUpdate: (inventory: string[]) => {
          setInventory(inventory);
        },
        onDiaryDiscover: (entryId: string) => {
          setDiaryEntries((prev: string[]) => {
            if (!prev.includes(entryId)) {
              return [...prev, entryId];
            }
            return prev;
          });
          toast({
            title: '发现日记',
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        },
        onPuzzleStart: (puzzleId: string) => {
          setCurrentPuzzle(puzzleId);
          setIsGamePaused(true);
        },
        onDialogue: (text: string) => {
          setCurrentDialogue(text);
          setIsGamePaused(true);
        },
        onItemPickup: (_itemId: string) => {},
        onGameComplete: () => {
          setGamePhase('ending');
          audioManager.stopAllMusic();
        }
      };

      (config as any).callbacks = callbacks;

      const game = new Phaser.Game(config);
      gameInstanceRef.current = game;

      game.events.once('ready', () => {
        const scene = game.scene.getScene('GameScene') as GameScene;
        if (scene) {
          gameSceneRef.current = scene;
        }
      });

      setGamePhase('playing');
    }
  }, [
    setCurrentRoom,
    setInventory,
    setDiaryEntries,
    setCurrentPuzzle,
    setCurrentDialogue,
    setIsGamePaused,
    toast
  ]);

  const handlePuzzleSolve = useCallback(
    (puzzleId: string) => {
      if (gameSceneRef.current) {
        gameSceneRef.current.solvePuzzle(
          puzzleId,
          (gameSceneRef.current as any).puzzle || {}
        );
      }
      setCurrentPuzzle(null);
      setIsGamePaused(false);
    },
    [setCurrentPuzzle, setIsGamePaused]
  );

  const handleCombineItems = useCallback(
    (item1: string, item2: string): boolean => {
      if (gameSceneRef.current) {
        return gameSceneRef.current.combineItems(item1, item2);
      }
      return false;
    },
    []
  );

  const handleSaveGame = useCallback(async () => {
    if (!user || !gameSceneRef.current) {
      toast({
        title: '无法保存',
        description: user ? '游戏状态不可用' : '请先登录以保存进度',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const gameState = gameSceneRef.current.getGameState();
      await apiService.saveGame(1, gameState);
      toast({
        title: '保存成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: '无法连接到服务器',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [user, toast]);

  const handleReturnToMenu = useCallback(() => {
    destroyGame();
    setGamePhase('menu');
    audioManager.stopAllMusic();
  }, [destroyGame]);

  const handleRestart = useCallback(() => {
    destroyGame();
    setGamePhase('menu');
    audioManager.stopAllMusic();
    setTimeout(() => {
      startGame();
    }, 100);
  }, [destroyGame, startGame]);

  return (
    <ChakraProvider theme={theme}>
      {gamePhase === 'menu' && (
        <MainMenu onStartGame={startGame} />
      )}

      {gamePhase === 'playing' && (
        <Box
          w="100vw"
          h="100vh"
          position="relative"
          bg="black"
          overflow="hidden"
        >
          <Box
            ref={gameRef}
            id="game-container"
            position="absolute"
            top="0"
            left="0"
            w="full"
            h="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          />

          <GameHUD />

          <Inventory onCombine={handleCombineItems} />
          <Diary />
          <Settings
            onSaveGame={handleSaveGame}
            onReturnToMenu={handleReturnToMenu}
          />
          <PuzzleModal onSolve={handlePuzzleSolve} />
          <DialogueBox />
        </Box>
      )}

      {gamePhase === 'ending' && (
        <GameEnding
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
    </ChakraProvider>
  );
};
