import { useState, useRef, useEffect, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store, useAppSelector, useAppDispatch } from './store';
import { GameCanvas } from './components/GameCanvas';
import { RecipeBook } from './components/RecipeBook';
import { QuestPanel } from './components/QuestPanel';
import { LabScene } from './game/scenes/LabScene';
import {
  addItem,
  removeItem,
} from './store/slices/inventorySlice';
import {
  addGold,
  addReputation,
  addExperience,
  discoverRecipe,
  completeQuest as completeGameQuest,
} from './store/slices/gameSlice';
import {
  startQuest,
  abandonQuest,
  completeQuest,
  tickQuestTimer,
} from './store/slices/questSlice';
import { RECIPES } from './data/recipes';
import { POTIONS } from './data/items';

function AlchemyGame() {
  const dispatch = useAppDispatch();
  
  const inventory = useAppSelector((state) => state.inventory.items);
  const gameState = useAppSelector((state) => state.game);
  const questState = useAppSelector((state) => state.quest);
  const experimentState = useAppSelector((state) => state.experiment);
  
  const labSceneRef = useRef<LabScene | null>(null);
  const [showRecipeBook, setShowRecipeBook] = useState(false);
  const [showQuestPanel, setShowQuestPanel] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleInventoryUpdate = useCallback(() => {
  }, []);

  const handleBrewingStart = useCallback(() => {
    showNotification('🔥 开始调制...', 'info');
  }, [showNotification]);

  const handleBrewingComplete = useCallback((
    success: boolean,
    explosion: boolean,
    resultItemId: string | null,
    message: string
  ) => {
    if (success && resultItemId) {
      dispatch(addItem({ itemId: resultItemId, quantity: 1 }));
      dispatch(addExperience(20));
      
      const recipe = RECIPES.find(r => r.resultItemId === resultItemId);
      if (recipe && !gameState.discoveredRecipes.includes(recipe.id)) {
        dispatch(discoverRecipe(recipe.id));
        showNotification(`🎉 发现新配方: ${recipe.name}`, 'success');
      } else {
        showNotification(message, 'success');
      }
    } else if (explosion) {
      showNotification('💥 ' + message, 'error');
    } else {
      showNotification('❌ ' + message, 'error');
    }
  }, [dispatch, gameState.discoveredRecipes, showNotification]);

  useEffect(() => {
    if (!questState.activeQuest) return;
    
    const timer = setInterval(() => {
      dispatch(tickQuestTimer(1));
      
      if (questState.questTimeRemaining <= 1) {
        dispatch(abandonQuest());
        showNotification('⏰ 任务时间已到，委托失败！', 'error');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questState.activeQuest, questState.questTimeRemaining, dispatch, showNotification]);

  const handleStartBrewing = () => {
    if (labSceneRef.current) {
      labSceneRef.current.startBrewing();
    }
  };

  const handleClearCauldron = () => {
    if (labSceneRef.current) {
      labSceneRef.current.clearCauldron();
    }
  };

  const handleStartQuest = (questId: string) => {
    dispatch(startQuest(questId));
    setShowQuestPanel(false);
    showNotification('⚔️ 任务已开始！', 'info');
  };

  const handleAbandonQuest = () => {
    dispatch(abandonQuest());
    setShowQuestPanel(false);
    showNotification('任务已放弃', 'info');
  };

  const handleClaimReward = (questId: string) => {
    const quest = questState.availableQuests.find(q => q.id === questId);
    if (quest && questState.activeQuest?.id === questId) {
      dispatch(removeItem({ itemId: quest.requiredPotionId, quantity: 1 }));
      dispatch(addGold(quest.reward.gold));
      dispatch(addReputation(quest.reward.reputation));
      dispatch(addExperience(quest.reward.gold / 2));
      dispatch(completeQuest());
      dispatch(completeGameQuest(questId));
      setShowQuestPanel(false);
      showNotification(`🎉 获得 ${quest.reward.gold} 金币和 ${quest.reward.reputation} 声望！`, 'success');
    }
  };

  const potionsInInventory = inventory
    .filter(item => POTIONS.some(p => p.id === item.id))
    .map(item => ({ id: item.id, quantity: item.quantity }));

  return (
    <div className="w-full h-full flex flex-col bg-parchment-900">
      <header className="flex items-center justify-between px-6 py-3 bg-parchment-800 border-b-2 border-alchemy-gold">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-medieval text-alchemy-gold text-shadow-gold">
            ⚗️ 炼金工坊
          </h1>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-alchemy-gold">💰</span>
              <span className="text-parchment-100 font-medieval">{gameState.gold}</span>
              <span className="text-parchment-400">金币</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-alchemy-gold">🏆</span>
              <span className="text-parchment-100 font-medieval">{gameState.reputation}</span>
              <span className="text-parchment-400">声望</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-alchemy-gold">⭐</span>
              <span className="text-parchment-100 font-medieval">Lv.{gameState.currentLevel}</span>
              <span className="text-parchment-400">
                ({gameState.experience}/{gameState.currentLevel * 100} EXP)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {questState.activeQuest && (
            <div className={`px-4 py-2 rounded border-2 ${
              questState.questTimeRemaining <= 30 
                ? 'border-red-500 bg-red-900/30 animate-pulse' 
                : 'border-alchemy-gold bg-alchemy-gold/10'
            }`}>
              <span className="text-alchemy-gold mr-2">⚔️</span>
              <span className="text-parchment-100 text-sm">{questState.activeQuest.title}</span>
              <span className={`ml-3 font-mono ${
                questState.questTimeRemaining <= 30 ? 'text-red-500' : 'text-alchemy-gold'
              }`}>
                ⏱ {Math.floor(questState.questTimeRemaining / 60)}:{(questState.questTimeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          
          <button
            onClick={() => setShowQuestPanel(true)}
            className="medieval-button flex items-center gap-2"
          >
            📜 委托
          </button>
          <button
            onClick={() => setShowRecipeBook(true)}
            className="medieval-button flex items-center gap-2"
          >
            📖 配方书
            <span className="text-xs bg-alchemy-gold text-parchment-900 px-2 py-0.5 rounded">
              {gameState.discoveredRecipes.length}/{RECIPES.length}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <GameCanvas
          inventory={inventory}
          onInventoryUpdate={handleInventoryUpdate}
          onBrewingStart={handleBrewingStart}
          onBrewingComplete={handleBrewingComplete}
          labSceneRef={labSceneRef}
        />
        
        <div className="absolute bottom-4 right-4 flex gap-3">
          <button
            onClick={handleClearCauldron}
            className="medieval-button bg-red-900 hover:bg-red-800"
          >
            🗑️ 清空炼金釜
          </button>
          <button
            onClick={handleStartBrewing}
            disabled={experimentState.isBrewing}
            className="medieval-button bg-green-800 hover:bg-green-700 text-lg px-8"
          >
            {experimentState.isBrewing ? '⏳ 调制中...' : '🔥 开始调制'}
          </button>
        </div>

        {experimentState.lastResult && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg border-2 ${
            experimentState.lastResult.success 
              ? 'border-green-500 bg-green-900/80' 
              : experimentState.lastResult.explosion
              ? 'border-red-500 bg-red-900/80'
              : 'border-orange-500 bg-orange-900/80'
          }`}>
            <p className="text-parchment-100 font-medieval text-lg">
              {experimentState.lastResult.message}
            </p>
          </div>
        )}
      </main>

      {showRecipeBook && (
        <RecipeBook
          discoveredRecipes={gameState.discoveredRecipes}
          onClose={() => setShowRecipeBook(false)}
        />
      )}

      {showQuestPanel && (
        <QuestPanel
          activeQuest={questState.activeQuest}
          questTimeRemaining={questState.questTimeRemaining}
          completedQuests={gameState.completedQuests}
          reputation={gameState.reputation}
          onStartQuest={handleStartQuest}
          onAbandonQuest={handleAbandonQuest}
          onClaimReward={handleClaimReward}
          onClose={() => setShowQuestPanel(false)}
          potions={potionsInInventory}
        />
      )}

      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg border-2 z-50 animate-bounce ${
          notification.type === 'success' 
            ? 'border-green-500 bg-green-900/90' 
            : notification.type === 'error'
            ? 'border-red-500 bg-red-900/90'
            : 'border-alchemy-gold bg-parchment-800/90'
        }`}>
          <p className="text-parchment-100 font-medieval">{notification.message}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AlchemyGame />
    </Provider>
  );
}

export default App;
