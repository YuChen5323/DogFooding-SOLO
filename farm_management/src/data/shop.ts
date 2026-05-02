import { ShopItem, Season } from '@/types';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'turnip_seed',
    itemId: 'turnip_seed',
    name: '萝卜种子',
    icon: '🌱',
    price: 20,
    stock: 50,
    maxStock: 50,
    category: 'seed',
    seasons: [Season.SPRING]
  },
  {
    id: 'potato_seed',
    itemId: 'potato_seed',
    name: '土豆种子',
    icon: '🌱',
    price: 50,
    stock: 30,
    maxStock: 30,
    category: 'seed',
    seasons: [Season.SPRING]
  },
  {
    id: 'strawberry_seed',
    itemId: 'strawberry_seed',
    name: '草莓种子',
    icon: '🍓',
    price: 100,
    stock: 20,
    maxStock: 20,
    category: 'seed',
    seasons: [Season.SPRING]
  },
  {
    id: 'tomato_seed',
    itemId: 'tomato_seed',
    name: '番茄种子',
    icon: '🍅',
    price: 50,
    stock: 30,
    maxStock: 30,
    category: 'seed',
    seasons: [Season.SUMMER]
  },
  {
    id: 'corn_seed',
    itemId: 'corn_seed',
    name: '玉米种子',
    icon: '🌽',
    price: 150,
    stock: 20,
    maxStock: 20,
    category: 'seed',
    seasons: [Season.SUMMER]
  },
  {
    id: 'pepper_seed',
    itemId: 'pepper_seed',
    name: '辣椒种子',
    icon: '🌶️',
    price: 40,
    stock: 30,
    maxStock: 30,
    category: 'seed',
    seasons: [Season.SUMMER]
  },
  {
    id: 'pumpkin_seed',
    itemId: 'pumpkin_seed',
    name: '南瓜种子',
    icon: '🎃',
    price: 100,
    stock: 20,
    maxStock: 20,
    category: 'seed',
    seasons: [Season.AUTUMN]
  },
  {
    id: 'cabbage_seed',
    itemId: 'cabbage_seed',
    name: '卷心菜种子',
    icon: '🥬',
    price: 100,
    stock: 25,
    maxStock: 25,
    category: 'seed',
    seasons: [Season.AUTUMN]
  },
  {
    id: 'sweet_potato_seed',
    itemId: 'sweet_potato_seed',
    name: '红薯种子',
    icon: '🍠',
    price: 80,
    stock: 25,
    maxStock: 25,
    category: 'seed',
    seasons: [Season.AUTUMN]
  },
  {
    id: 'crystal_fruit_seed',
    itemId: 'crystal_fruit_seed',
    name: '水晶果种子',
    icon: '💎',
    price: 500,
    stock: 5,
    maxStock: 5,
    category: 'seed',
    seasons: [Season.WINTER]
  },
  {
    id: 'chicken',
    itemId: 'chicken',
    name: '小鸡',
    icon: '🐔',
    price: 800,
    stock: 5,
    maxStock: 5,
    category: 'animal',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'cow',
    itemId: 'cow',
    name: '奶牛',
    icon: '🐄',
    price: 1500,
    stock: 3,
    maxStock: 3,
    category: 'animal',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'sheep',
    itemId: 'sheep',
    name: '绵羊',
    icon: '🐑',
    price: 2000,
    stock: 2,
    maxStock: 2,
    category: 'animal',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'pig',
    itemId: 'pig',
    name: '小猪',
    icon: '🐷',
    price: 1000,
    stock: 4,
    maxStock: 4,
    category: 'animal',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'basic_fertilizer',
    itemId: 'basic_fertilizer',
    name: '基础肥料',
    icon: '💩',
    price: 100,
    stock: 20,
    maxStock: 20,
    category: 'material',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'quality_fertilizer',
    itemId: 'quality_fertilizer',
    name: '优质肥料',
    icon: '✨',
    price: 250,
    stock: 10,
    maxStock: 10,
    category: 'material',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  },
  {
    id: 'hay',
    itemId: 'hay',
    name: '干草',
    icon: '🌾',
    price: 50,
    stock: 100,
    maxStock: 100,
    category: 'material',
    seasons: [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
  }
];

export const getShopItemsBySeason = (season: Season): ShopItem[] => {
  return SHOP_ITEMS.filter(item => item.seasons.includes(season));
};

export const getShopItemById = (id: string): ShopItem | undefined => {
  return SHOP_ITEMS.find(item => item.id === id);
};

export const getShopItemsByCategory = (category: 'seed' | 'animal' | 'tool' | 'material'): ShopItem[] => {
  return SHOP_ITEMS.filter(item => item.category === category);
};
