import { useState } from 'react';
import type { Recipe, SymbolType } from '../types';
import { RECIPES, getSymbolName } from '../data/recipes';
import { ITEMS } from '../data/items';

interface RecipeBookProps {
  discoveredRecipes: string[];
  onClose: () => void;
}

export const RecipeBook: React.FC<RecipeBookProps> = ({
  discoveredRecipes,
  onClose,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showHint, setShowHint] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-600';
      case 'uncommon': return 'border-green-600';
      case 'rare': return 'border-blue-600';
      case 'legendary': return 'border-purple-600';
      default: return 'border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="parchment-panel w-[900px] h-[600px] flex flex-col">
        <div className="flex justify-between items-center border-b-2 border-alchemy-gold/30 pb-4 mb-4">
          <h2 className="text-3xl font-medieval text-alchemy-gold text-shadow-gold">
            📖 炼金配方书
          </h2>
          <button
            onClick={onClose}
            className="medieval-button"
          >
            关闭
          </button>
        </div>

        <div className="flex flex-1 gap-4">
          <div className="w-1/3 overflow-y-auto pr-4 border-r border-alchemy-gold/30">
            <h3 className="text-lg text-alchemy-gold mb-3">配方列表</h3>
            <div className="space-y-2">
              {RECIPES.map((recipe) => {
                const isDiscovered = discoveredRecipes.includes(recipe.id);
                const resultItem = ITEMS[recipe.resultItemId];
                
                return (
                  <button
                    key={recipe.id}
                    onClick={() => isDiscovered && setSelectedRecipe(recipe)}
                    className={`w-full text-left p-3 rounded border-2 transition-all ${
                      selectedRecipe?.id === recipe.id
                        ? 'border-alchemy-gold bg-alchemy-gold/10'
                        : isDiscovered
                        ? `${getRarityBorder(resultItem?.rarity || 'common')} hover:border-alchemy-gold/50`
                        : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-60'
                    }`}
                    disabled={!isDiscovered}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {isDiscovered ? resultItem?.icon : '❓'}
                      </span>
                      <div>
                        <p className={`font-medieval ${isDiscovered ? getRarityColor(resultItem?.rarity || 'common') : 'text-gray-500'}`}>
                          {isDiscovered ? recipe.name : '???'}
                        </p>
                        <p className="text-xs text-gray-500">
                          难度: {'⭐'.repeat(recipe.difficulty)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 pl-4">
            {selectedRecipe ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">
                    {ITEMS[selectedRecipe.resultItemId]?.icon}
                  </span>
                  <div>
                    <h3 className={`text-2xl font-medieval ${getRarityColor(ITEMS[selectedRecipe.resultItemId]?.rarity || 'common')}`}>
                      {selectedRecipe.name}
                    </h3>
                    <p className="text-parchment-200">
                      {ITEMS[selectedRecipe.resultItemId]?.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg text-alchemy-gold mb-2">📋 配方说明</h4>
                  <p className="text-parchment-200 text-sm leading-relaxed">
                    {selectedRecipe.description}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <h4 className="text-lg text-alchemy-gold mb-3">🧪 所需材料与符号</h4>
                  <div className="space-y-3">
                    {selectedRecipe.ingredients.map((ingredient, index) => {
                      const item = ITEMS[ingredient.itemId];
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-4 p-3 rounded border-2 ${
                            ingredient.isHidden
                              ? 'border-gray-700 bg-gray-800/50'
                              : 'border-alchemy-gold/30 bg-parchment-800/50'
                          }`}
                        >
                          <span className="text-3xl">
                            {ingredient.isHidden ? '❓' : item?.icon}
                          </span>
                          <div className="flex-1">
                            <p className={`font-medieval ${ingredient.isHidden ? 'text-gray-500' : 'text-parchment-100'}`}>
                              {ingredient.isHidden ? '未知材料' : `${item?.name} x${ingredient.quantity}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ingredient.isHidden ? '需要进一步探索...' : item?.description}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${
                              ingredient.isHidden
                                ? 'border-gray-700 bg-gray-800'
                                : 'border-alchemy-gold bg-parchment-800'
                            }`}>
                              {ingredient.isHidden ? '?' : ingredient.symbol}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {ingredient.isHidden ? '???' : getSymbolName(ingredient.symbol as SymbolType)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-alchemy-gold/30">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="medieval-button text-sm"
                  >
                    {showHint ? '隐藏提示' : '💡 查看提示'}
                  </button>
                  {showHint && (
                    <div className="mt-3 p-3 bg-parchment-800/50 rounded border border-alchemy-gold/30">
                      <h5 className="text-alchemy-gold text-sm mb-2">炼金提示：</h5>
                      <ul className="text-parchment-200 text-sm space-y-1">
                        {selectedRecipe.hints.map((hint, index) => (
                          <li key={index}>• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-parchment-400">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📜</span>
                  <p>选择一个配方查看详情</p>
                  <p className="text-sm mt-2 text-gray-500">
                    未发现的配方显示为 ???
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-alchemy-gold/30 flex justify-between items-center">
          <p className="text-parchment-400 text-sm">
            已发现配方: {discoveredRecipes.length} / {RECIPES.length}
          </p>
          <div className="flex gap-2">
            <span className="text-gray-400 text-xs">稀有度: </span>
            <span className="text-gray-400 text-xs">普通</span>
            <span className="text-green-400 text-xs">优秀</span>
            <span className="text-blue-400 text-xs">稀有</span>
            <span className="text-purple-400 text-xs">传说</span>
          </div>
        </div>
      </div>
    </div>
  );
};
