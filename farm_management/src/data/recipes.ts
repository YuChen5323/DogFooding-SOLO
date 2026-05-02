import { Recipe } from '@/types';

export const RECIPES: Recipe[] = [
  {
    id: 'fried_egg',
    name: '煎蛋',
    icon: '🍳',
    description: '简单美味的煎蛋',
    ingredients: [
      { itemId: 'egg', quantity: 1 }
    ],
    resultItemId: 'fried_egg',
    resultQuantity: 1,
    sellPrice: 120
  },
  {
    id: 'egg_salad',
    name: '鸡蛋沙拉',
    icon: '🥗',
    description: '清爽的鸡蛋沙拉',
    ingredients: [
      { itemId: 'egg', quantity: 2 },
      { itemId: 'turnip', quantity: 1 }
    ],
    resultItemId: 'egg_salad',
    resultQuantity: 1,
    sellPrice: 280
  },
  {
    id: 'hot_milk',
    name: '热牛奶',
    icon: '☕',
    description: '温暖的热牛奶',
    ingredients: [
      { itemId: 'milk', quantity: 1 }
    ],
    resultItemId: 'hot_milk',
    resultQuantity: 1,
    sellPrice: 180
  },
  {
    id: 'butter',
    name: '黄油',
    icon: '🧈',
    description: '香浓的黄油',
    ingredients: [
      { itemId: 'milk', quantity: 2 }
    ],
    resultItemId: 'butter',
    resultQuantity: 1,
    sellPrice: 200
  },
  {
    id: 'tomato_juice',
    name: '番茄汁',
    icon: '🧃',
    description: '新鲜的番茄汁',
    ingredients: [
      { itemId: 'tomato', quantity: 2 }
    ],
    resultItemId: 'tomato_juice',
    resultQuantity: 1,
    sellPrice: 210
  },
  {
    id: 'corn_soup',
    name: '玉米汤',
    icon: '🍲',
    description: '香甜的玉米汤',
    ingredients: [
      { itemId: 'corn', quantity: 1 },
      { itemId: 'milk', quantity: 1 }
    ],
    resultItemId: 'corn_soup',
    resultQuantity: 1,
    sellPrice: 350
  },
  {
    id: 'pumpkin_soup',
    name: '南瓜汤',
    icon: '🎃',
    description: '浓郁的南瓜汤',
    ingredients: [
      { itemId: 'pumpkin', quantity: 1 },
      { itemId: 'milk', quantity: 1 }
    ],
    resultItemId: 'pumpkin_soup',
    resultQuantity: 1,
    sellPrice: 600
  },
  {
    id: 'strawberry_jam',
    name: '草莓酱',
    icon: '🍓',
    description: '甜蜜的草莓酱',
    ingredients: [
      { itemId: 'strawberry', quantity: 2 }
    ],
    resultItemId: 'strawberry_jam',
    resultQuantity: 1,
    sellPrice: 350
  },
  {
    id: 'cabbage_roll',
    name: '卷心菜卷',
    icon: '🥬',
    description: '美味的卷心菜卷',
    ingredients: [
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'tomato', quantity: 1 }
    ],
    resultItemId: 'cabbage_roll',
    resultQuantity: 1,
    sellPrice: 300
  },
  {
    id: 'cheese',
    name: '奶酪',
    icon: '🧀',
    description: '美味的奶酪',
    ingredients: [
      { itemId: 'milk', quantity: 3 }
    ],
    resultItemId: 'cheese',
    resultQuantity: 1,
    sellPrice: 400
  },
  {
    id: 'wool_cloth',
    name: '毛料',
    icon: '🧵',
    description: '用羊毛制成的布料',
    ingredients: [
      { itemId: 'wool', quantity: 2 }
    ],
    resultItemId: 'wool_cloth',
    resultQuantity: 1,
    sellPrice: 680
  }
];

export const getRecipeById = (id: string): Recipe | undefined => {
  return RECIPES.find(recipe => recipe.id === id);
};

export const PROCESSED_ITEMS = [
  { id: 'fried_egg', name: '煎蛋', icon: '🍳', sellPrice: 120 },
  { id: 'egg_salad', name: '鸡蛋沙拉', icon: '🥗', sellPrice: 280 },
  { id: 'hot_milk', name: '热牛奶', icon: '☕', sellPrice: 180 },
  { id: 'butter', name: '黄油', icon: '🧈', sellPrice: 200 },
  { id: 'tomato_juice', name: '番茄汁', icon: '🧃', sellPrice: 210 },
  { id: 'corn_soup', name: '玉米汤', icon: '🍲', sellPrice: 350 },
  { id: 'pumpkin_soup', name: '南瓜汤', icon: '🎃', sellPrice: 600 },
  { id: 'strawberry_jam', name: '草莓酱', icon: '🍓', sellPrice: 350 },
  { id: 'cabbage_roll', name: '卷心菜卷', icon: '🥬', sellPrice: 300 },
  { id: 'cheese', name: '奶酪', icon: '🧀', sellPrice: 400 },
  { id: 'wool_cloth', name: '毛料', icon: '🧵', sellPrice: 680 }
];
