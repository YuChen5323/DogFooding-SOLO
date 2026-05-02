import { useState } from 'react';
import type { Quest } from '../types';
import { QUESTS } from '../data/quests';
import { ITEMS } from '../data/items';

interface QuestPanelProps {
  activeQuest: Quest | null;
  questTimeRemaining: number;
  completedQuests: string[];
  reputation: number;
  onStartQuest: (questId: string) => void;
  onAbandonQuest: () => void;
  onClaimReward: (questId: string) => void;
  onClose: () => void;
  potions: { id: string; quantity: number }[];
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  activeQuest,
  questTimeRemaining,
  completedQuests,
  reputation,
  onStartQuest,
  onAbandonQuest,
  onClaimReward,
  onClose,
  potions,
}) => {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds <= 30) return 'text-red-500 animate-pulse';
    if (seconds <= 60) return 'text-orange-400';
    return 'text-alchemy-gold';
  };

  const hasRequiredPotion = (quest: Quest) => {
    return potions.some(p => p.id === quest.requiredPotionId && p.quantity > 0);
  };

  const handleClaimReward = (questId: string) => {
    setShowSuccess(true);
    setTimeout(() => {
      onClaimReward(questId);
      setShowSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="parchment-panel w-[800px] h-[550px] flex flex-col">
        <div className="flex justify-between items-center border-b-2 border-alchemy-gold/30 pb-4 mb-4">
          <h2 className="text-3xl font-medieval text-alchemy-gold text-shadow-gold">
            📜 皇家委托
          </h2>
          <button
            onClick={onClose}
            className="medieval-button"
          >
            关闭
          </button>
        </div>

        {activeQuest && (
          <div className="mb-4 p-4 rounded border-2 border-alchemy-gold bg-alchemy-gold/10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-alchemy-gold">⚔️</span>
                  <h3 className="text-xl font-medieval text-alchemy-gold">
                    进行中: {activeQuest.title}
                  </h3>
                </div>
                <p className="text-parchment-200 text-sm mb-2">
                  {activeQuest.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">需要:</span>
                    <span className="text-2xl">
                      {ITEMS[activeQuest.requiredPotionId]?.icon}
                    </span>
                    <span className="text-parchment-100">
                      {ITEMS[activeQuest.requiredPotionId]?.name}
                    </span>
                    {hasRequiredPotion(activeQuest) && (
                      <span className="text-green-400 text-sm">✓ 已拥有</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getTimeColor(questTimeRemaining)}`}>
                  ⏱ {formatTime(questTimeRemaining)}
                </div>
                <div className="text-sm text-alchemy-gold mt-1">
                  💰 {activeQuest.reward.gold} 金币
                </div>
                <div className="text-sm text-alchemy-gold">
                  🏆 {activeQuest.reward.reputation} 声望
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              {hasRequiredPotion(activeQuest) && (
                <button
                  onClick={() => handleClaimReward(activeQuest.id)}
                  className="medieval-button bg-green-700 hover:bg-green-600"
                >
                  ✅ 提交药剂领取奖励
                </button>
              )}
              <button
                onClick={onAbandonQuest}
                className="medieval-button bg-red-900 hover:bg-red-800"
              >
                ❌ 放弃任务
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-lg text-alchemy-gold mb-3">
            可用委托 {activeQuest && <span className="text-sm text-gray-400">(完成当前任务后可接取新任务)</span>}
          </h3>
          <div className="space-y-3">
            {QUESTS.map((quest) => {
              const isCompleted = completedQuests.includes(quest.id);
              const isActive = activeQuest?.id === quest.id;
              const rewardItem = ITEMS[quest.requiredPotionId];
              const canAccept = !activeQuest && !isCompleted;
              
              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded border-2 transition-all cursor-pointer ${
                    isCompleted
                      ? 'border-gray-700 bg-gray-800/30 opacity-60'
                      : isActive
                      ? 'border-alchemy-gold bg-alchemy-gold/10'
                      : selectedQuest?.id === quest.id
                      ? 'border-alchemy-gold/50 bg-parchment-800'
                      : 'border-parchment-700 hover:border-alchemy-gold/50'
                  }`}
                  onClick={() => !isActive && setSelectedQuest(quest)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">
                        {isCompleted ? '✅' : rewardItem?.icon}
                      </span>
                      <div>
                        <h4 className={`font-medieval text-lg ${
                          isCompleted ? 'text-gray-500 line-through' : 'text-parchment-100'
                        }`}>
                          {quest.title}
                          {isActive && <span className="ml-2 text-sm text-alchemy-gold">(进行中)</span>}
                          {isCompleted && <span className="ml-2 text-sm text-green-400">(已完成)</span>}
                        </h4>
                        <p className="text-parchment-400 text-sm mt-1">
                          {quest.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-alchemy-gold">
                            💰 {quest.reward.gold} 金币
                          </span>
                          <span className="text-alchemy-gold">
                            🏆 {quest.reward.reputation} 声望
                          </span>
                          <span className="text-gray-400">
                            ⏱ {formatTime(quest.timeLimit)} 时限
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedQuest?.id === quest.id && canAccept && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartQuest(quest.id);
                        }}
                        className="medieval-button"
                      >
                        接取任务
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-alchemy-gold/30 flex justify-between items-center">
          <div className="text-parchment-400 text-sm">
            <span>🏆 当前声望: {reputation}</span>
            <span className="mx-4">|</span>
            <span>✅ 已完成任务: {completedQuests.length}/{QUESTS.length}</span>
          </div>
          <p className="text-gray-500 text-xs">
            提示：完成任务获得声望，更高声望解锁更多委托
          </p>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/50">
          <div className="parchment-panel p-8 text-center animate-bounce">
            <span className="text-6xl block mb-4">🎉</span>
            <h3 className="text-2xl font-medieval text-alchemy-gold mb-2">
              任务完成！
            </h3>
            <p className="text-parchment-200">奖励已发放到你的账户</p>
          </div>
        </div>
      )}
    </div>
  );
};
