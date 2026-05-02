import { useEffect, useState, useCallback } from 'react';
import { Box, Flex, VStack, HStack, useDisclosure } from '@chakra-ui/react';
import { useAppSelector, useAppDispatch, store } from './store';
import { setPause } from './store/slices/timeSlice';
import { closeMenu } from './store/slices/uiSlice';
import { addItem } from './store/slices/inventorySlice';
import StatusBar from './components/StatusBar';
import Toolbar from './components/Toolbar';
import InventoryModal from './components/InventoryModal';
import ShopModal from './components/ShopModal';
import BarnModal from './components/BarnModal';
import KitchenModal from './components/KitchenModal';
import AchievementsModal from './components/AchievementsModal';
import MainMenu from './components/MainMenu';
import { getGameManager, destroyGameManager } from './game/GameManager';
import { getMockSupabase } from './services/mockSupabase';
import { GameState, Season } from './types';
import { CROPS } from './data/crops';

function App() {
  const dispatch = useAppDispatch();
  const [gameStarted, setGameStarted] = useState(false);
  const [playerId] = useState(`player_${Date.now()}`);

  const activeMenu = useAppSelector((state) => state.ui.activeMenu);
  const isGameMenuOpen = useAppSelector((state) => state.ui.isGameMenuOpen);
  const isPaused = useAppSelector((state) => state.time.isPaused);

  const inventoryDisclosure = useDisclosure();
  const shopDisclosure = useDisclosure();
  const barnDisclosure = useDisclosure();
  const kitchenDisclosure = useDisclosure();
  const achievementsDisclosure = useDisclosure();

  useEffect(() => {
    if (activeMenu !== 'none' && !isPaused) {
      dispatch(setPause(true));
    }
  }, [activeMenu, isPaused, dispatch]);

  useEffect(() => {
    switch (activeMenu) {
      case 'inventory':
        inventoryDisclosure.onOpen();
        break;
      case 'shop':
        shopDisclosure.onOpen();
        break;
      case 'barn':
        barnDisclosure.onOpen();
        break;
      case 'kitchen':
        kitchenDisclosure.onOpen();
        break;
      case 'achievements':
        achievementsDisclosure.onOpen();
        break;
      default:
        if (inventoryDisclosure.isOpen) inventoryDisclosure.onClose();
        if (shopDisclosure.isOpen) shopDisclosure.onClose();
        if (barnDisclosure.isOpen) barnDisclosure.onClose();
        if (kitchenDisclosure.isOpen) kitchenDisclosure.onClose();
        if (achievementsDisclosure.isOpen) achievementsDisclosure.onClose();
        break;
    }
  }, [activeMenu]);

  const handleCloseMenu = useCallback(() => {
    dispatch(closeMenu());
    dispatch(setPause(false));
  }, [dispatch]);

  const initializeNewGame = useCallback(() => {
    const initialState = store.getState();
    
    const defaultGameState: GameState = {
      time: initialState.time,
      stats: initialState.stats,
      inventory: initialState.inventory.items,
      plots: initialState.farm.plots,
      barns: initialState.barn.barns,
      unlockedRecipes: [],
      achievements: initialState.achievements.achievements,
      activeFestival: null,
      isPaused: false,
    };

    dispatch(addItem({
      itemId: 'parsnip_seed',
      quantity: 15,
      category: 'seed',
    }));

    dispatch(addItem({
      itemId: 'potato_seed',
      quantity: 5,
      category: 'seed',
    }));

    return defaultGameState;
  }, [dispatch]);

  const handleStartGame = async () => {
    const supabase = getMockSupabase();
    const existingSave = await supabase.getLatestSave(playerId);
    
    if (!existingSave) {
      initializeNewGame();
    } else {
      console.log('Found existing save:', existingSave);
    }

    getGameManager();
    setGameStarted(true);
  };

  const handleLoadGame = async () => {
    const supabase = getMockSupabase();
    const latestSave = await supabase.getLatestSave(playerId);
    
    if (latestSave) {
      console.log('Loading saved game:', latestSave);
    }
    
    getGameManager();
    setGameStarted(true);
  };

  const handleAutoSave = useCallback(async () => {
    const supabase = getMockSupabase();
    const state = store.getState();
    
    const gameState: GameState = {
      time: state.time,
      stats: state.stats,
      inventory: state.inventory.items,
      plots: state.farm.plots,
      barns: state.barn.barns,
      unlockedRecipes: [],
      achievements: state.achievements.achievements,
      activeFestival: null,
      isPaused: state.time.isPaused,
    };
    
    await supabase.autoSave(playerId, gameState);
  }, [playerId]);

  useEffect(() => {
    if (gameStarted) {
      const autoSaveInterval = setInterval(() => {
        handleAutoSave();
      }, 60000);

      return () => {
        clearInterval(autoSaveInterval);
        handleAutoSave();
      };
    }
  }, [gameStarted, handleAutoSave]);

  useEffect(() => {
    return () => {
      destroyGameManager();
    };
  }, []);

  if (!gameStarted) {
    return <MainMenu onStartGame={handleStartGame} onLoadGame={handleLoadGame} />;
  }

  return (
    <Box w="100vw" h="100vh" position="relative" overflow="hidden">
      <Box id="game-container" w="100%" h="100%" position="absolute" top={0} left={0} />
      
      <VStack
        position="absolute"
        top={0}
        left={0}
        w="100%"
        p={2}
        pointerEvents="none"
        spacing={2}
      >
        <StatusBar />
      </VStack>

      <Toolbar />

      <InventoryModal
        isOpen={inventoryDisclosure.isOpen}
        onClose={handleCloseMenu}
      />
      
      <ShopModal
        isOpen={shopDisclosure.isOpen}
        onClose={handleCloseMenu}
      />
      
      <BarnModal
        isOpen={barnDisclosure.isOpen}
        onClose={handleCloseMenu}
      />
      
      <KitchenModal
        isOpen={kitchenDisclosure.isOpen}
        onClose={handleCloseMenu}
      />
      
      <AchievementsModal
        isOpen={achievementsDisclosure.isOpen}
        onClose={handleCloseMenu}
      />
    </Box>
  );
}

export default App;
