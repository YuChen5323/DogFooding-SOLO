import { Achievement, Season } from '@/types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_harvest',
    name: '首次收获',
    description: '收获你的第一颗作物',
    icon: '🌾',
    unlocked: false,
    condition: {
      type: 'harvest',
      target: 1,
      current: 0
    }
  },
  {
    id: 'farmer_beginner',
    name: '新手农夫',
    description: '收获10颗作物',
    icon: '🌱',
    unlocked: false,
    condition: {
      type: 'harvest',
      target: 10,
      current: 0
    }
  },
  {
    id: 'farmer_intermediate',
    name: '熟练农夫',
    description: '收获100颗作物',
    icon: '👨‍🌾',
    unlocked: false,
    condition: {
      type: 'harvest',
      target: 100,
      current: 0
    }
  },
  {
    id: 'farmer_master',
    name: '农业大师',
    description: '收获1000颗作物',
    icon: '🏆',
    unlocked: false,
    condition: {
      type: 'harvest',
      target: 1000,
      current: 0
    }
  },
  {
    id: 'first_sale',
    name: '第一桶金',
    description: '出售商品获得第一笔收入',
    icon: '💰',
    unlocked: false,
    condition: {
      type: 'sell',
      target: 1,
      current: 0
    }
  },
  {
    id: 'small_business',
    name: '小本生意',
    description: '累计出售商品价值达到1000金币',
    icon: '💵',
    unlocked: false,
    condition: {
      type: 'sell',
      target: 1000,
      current: 0
    }
  },
  {
    id: 'successful_business',
    name: '成功商人',
    description: '累计出售商品价值达到10000金币',
    icon: '💎',
    unlocked: false,
    condition: {
      type: 'sell',
      target: 10000,
      current: 0
    }
  },
  {
    id: 'tycoon',
    name: '商业大亨',
    description: '累计出售商品价值达到100000金币',
    icon: '👑',
    unlocked: false,
    condition: {
      type: 'sell',
      target: 100000,
      current: 0
    }
  },
  {
    id: 'first_season',
    name: '第一个季节',
    description: '在游戏中度过第一个完整的季节',
    icon: '🌸',
    unlocked: false,
    condition: {
      type: 'days',
      target: 28,
      current: 0
    }
  },
  {
    id: 'one_year',
    name: '一年之计',
    description: '在游戏中度过一整年',
    icon: '🗓️',
    unlocked: false,
    condition: {
      type: 'days',
      target: 112,
      current: 0
    }
  },
  {
    id: 'first_animal',
    name: '第一只动物',
    description: '购买你的第一只农场动物',
    icon: '🐔',
    unlocked: false,
    condition: {
      type: 'animals',
      target: 1,
      current: 0
    }
  },
  {
    id: 'animal_lover',
    name: '动物爱好者',
    description: '同时拥有5只动物',
    icon: '🐄',
    unlocked: false,
    condition: {
      type: 'animals',
      target: 5,
      current: 0
    }
  },
  {
    id: 'full_barn',
    name: '畜舍满员',
    description: '同时拥有10只动物',
    icon: '🏠',
    unlocked: false,
    condition: {
      type: 'animals',
      target: 10,
      current: 0
    }
  },
  {
    id: 'first_crop_plot',
    name: '第一块耕地',
    description: '种植你的第一颗作物种子',
    icon: '🌱',
    unlocked: false,
    condition: {
      type: 'crops',
      target: 1,
      current: 0
    }
  },
  {
    id: 'green_thumb',
    name: '园艺达人',
    description: '同时种植20颗作物',
    icon: '🌳',
    unlocked: false,
    condition: {
      type: 'crops',
      target: 20,
      current: 0
    }
  },
  {
    id: 'plantation_owner',
    name: '种植园主',
    description: '同时种植50颗作物',
    icon: '🌴',
    unlocked: false,
    condition: {
      type: 'crops',
      target: 50,
      current: 0
    }
  }
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
};

export const SEASON_NAMES: Record<Season, string> = {
  [Season.SPRING]: '春季',
  [Season.SUMMER]: '夏季',
  [Season.AUTUMN]: '秋季',
  [Season.WINTER]: '冬季'
};

export const SEASON_COLORS: Record<Season, string> = {
  [Season.SPRING]: '#90EE90',
  [Season.SUMMER]: '#FFD700',
  [Season.AUTUMN]: '#D2691E',
  [Season.WINTER]: '#ADD8E6'
};

export const TIME_OF_DAY_NAMES: Record<string, string> = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚'
};
