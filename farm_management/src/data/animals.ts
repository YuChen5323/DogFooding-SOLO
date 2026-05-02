import { AnimalType } from '@/types';

export const ANIMAL_TYPES: AnimalType[] = [
  {
    id: 'chicken',
    name: '小鸡',
    icon: '🐔',
    description: '可爱的小鸡，长大后每天产蛋',
    buyPrice: 800,
    maxHappiness: 255,
    maxHunger: 100,
    produceId: 'egg',
    produceTime: 1,
    sellPrice: 500
  },
  {
    id: 'cow',
    name: '奶牛',
    icon: '🐄',
    description: '温顺的奶牛，每天产奶',
    buyPrice: 1500,
    maxHappiness: 255,
    maxHunger: 100,
    produceId: 'milk',
    produceTime: 1,
    sellPrice: 1200
  },
  {
    id: 'sheep',
    name: '绵羊',
    icon: '🐑',
    description: '毛茸茸的绵羊，每3天剪一次羊毛',
    buyPrice: 2000,
    maxHappiness: 255,
    maxHunger: 100,
    produceId: 'wool',
    produceTime: 3,
    sellPrice: 1800
  },
  {
    id: 'pig',
    name: '小猪',
    icon: '🐷',
    description: '可爱的小猪，长大后可以出售',
    buyPrice: 1000,
    maxHappiness: 255,
    maxHunger: 100,
    produceId: 'none',
    produceTime: 0,
    sellPrice: 1500
  }
];

export const ANIMAL_PRODUCTS = [
  {
    id: 'egg',
    name: '鸡蛋',
    icon: '🥚',
    description: '新鲜的鸡蛋',
    sellPrice: 50,
    quality: 'normal'
  },
  {
    id: 'large_egg',
    name: '大鸡蛋',
    icon: '🥚',
    description: '高品质的大鸡蛋',
    sellPrice: 95,
    quality: 'large'
  },
  {
    id: 'milk',
    name: '牛奶',
    icon: '🥛',
    description: '新鲜的牛奶',
    sellPrice: 100,
    quality: 'normal'
  },
  {
    id: 'large_milk',
    name: '大牛奶',
    icon: '🥛',
    description: '高品质的大牛奶',
    sellPrice: 150,
    quality: 'large'
  },
  {
    id: 'wool',
    name: '羊毛',
    icon: '🧶',
    description: '优质的羊毛',
    sellPrice: 270,
    quality: 'normal'
  },
  {
    id: 'gold_wool',
    name: '金色羊毛',
    icon: '✨',
    description: '稀有的金色羊毛',
    sellPrice: 800,
    quality: 'gold'
  }
];

export const getAnimalTypeById = (id: string): AnimalType | undefined => {
  return ANIMAL_TYPES.find(animal => animal.id === id);
};

export const getAnimalProductById = (id: string) => {
  return ANIMAL_PRODUCTS.find(product => product.id === id);
};
