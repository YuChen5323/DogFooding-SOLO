import { Crop, Season } from '@/types';

export const CROPS: Crop[] = [
  {
    id: 'turnip',
    name: '萝卜',
    icon: '🥬',
    description: '春季种植的快速生长作物，4天后成熟',
    growthStages: 5,
    growthTime: 4,
    seasons: [Season.SPRING],
    buyPrice: 20,
    sellPrice: 60,
    regrows: false
  },
  {
    id: 'potato',
    name: '土豆',
    icon: '🥔',
    description: '春季种植，6天后成熟，收获后可能获得多个',
    growthStages: 5,
    growthTime: 6,
    seasons: [Season.SPRING],
    buyPrice: 50,
    sellPrice: 80,
    regrows: false
  },
  {
    id: 'strawberry',
    name: '草莓',
    icon: '🍓',
    description: '春季种植，8天后成熟，之后每4天可再收获',
    growthStages: 5,
    growthTime: 8,
    seasons: [Season.SPRING],
    buyPrice: 100,
    sellPrice: 120,
    regrows: true,
    regrowTime: 4
  },
  {
    id: 'tomato',
    name: '番茄',
    icon: '🍅',
    description: '夏季种植，11天后成熟，之后每4天可再收获',
    growthStages: 5,
    growthTime: 11,
    seasons: [Season.SUMMER],
    buyPrice: 50,
    sellPrice: 60,
    regrows: true,
    regrowTime: 4
  },
  {
    id: 'corn',
    name: '玉米',
    icon: '🌽',
    description: '夏季种植，14天后成熟，之后每4天可再收获',
    growthStages: 5,
    growthTime: 14,
    seasons: [Season.SUMMER],
    buyPrice: 150,
    sellPrice: 50,
    regrows: true,
    regrowTime: 4
  },
  {
    id: 'pepper',
    name: '辣椒',
    icon: '🌶️',
    description: '夏季种植，5天后成熟，之后每3天可再收获',
    growthStages: 4,
    growthTime: 5,
    seasons: [Season.SUMMER],
    buyPrice: 40,
    sellPrice: 40,
    regrows: true,
    regrowTime: 3
  },
  {
    id: 'pumpkin',
    name: '南瓜',
    icon: '🎃',
    description: '秋季种植，13天后成熟，体积较大',
    growthStages: 5,
    growthTime: 13,
    seasons: [Season.AUTUMN],
    buyPrice: 100,
    sellPrice: 320,
    regrows: false
  },
  {
    id: 'cabbage',
    name: '卷心菜',
    icon: '🥬',
    description: '秋季种植，9天后成熟',
    growthStages: 5,
    growthTime: 9,
    seasons: [Season.AUTUMN],
    buyPrice: 100,
    sellPrice: 140,
    regrows: false
  },
  {
    id: 'sweet_potato',
    name: '红薯',
    icon: '🍠',
    description: '秋季种植，10天后成熟，收获后可能获得多个',
    growthStages: 5,
    growthTime: 10,
    seasons: [Season.AUTUMN],
    buyPrice: 80,
    sellPrice: 120,
    regrows: false
  },
  {
    id: 'crystal_fruit',
    name: '水晶果',
    icon: '💎',
    description: '冬季稀有作物，需要温室种植，20天后成熟',
    growthStages: 6,
    growthTime: 20,
    seasons: [Season.WINTER],
    buyPrice: 500,
    sellPrice: 2000,
    regrows: false
  }
];

export const getCropById = (id: string): Crop | undefined => {
  return CROPS.find(crop => crop.id === id);
};

export const getCropsBySeason = (season: Season): Crop[] => {
  return CROPS.filter(crop => crop.seasons.includes(season));
};
