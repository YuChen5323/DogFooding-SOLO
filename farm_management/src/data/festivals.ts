import { FestivalEvent, Season } from '@/types';

export const FESTIVALS: FestivalEvent[] = [
  {
    id: 'spring_egg_festival',
    name: '春季彩蛋节',
    description: '春天的第一个节日！在村庄广场寻找隐藏的彩蛋，收集越多奖励越丰厚。',
    season: Season.SPRING,
    day: 15,
    startTime: 9,
    endTime: 17,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到春季彩蛋节！在村庄各处都藏有彩蛋，快去找找看吧！' },
      { npcId: 'shopkeeper', dialog: '今天的彩蛋节真热闹！听说收集10个彩蛋就能获得特别奖励哦~' },
      { npcId: 'farmer_old', dialog: '年轻的时候我也参加过彩蛋比赛，最高纪录是一天找到15个彩蛋！' }
    ],
    rewards: [
      { itemId: 'strawberry_seed', quantity: 5 },
      { itemId: 'turnip_seed', quantity: 10 }
    ],
    specialShop: [
      { itemId: 'lucky_egg', price: 1000 },
      { itemId: 'spring_wreath', price: 2000 }
    ]
  },
  {
    id: 'flower_dance',
    name: '花舞祭',
    description: '春季最美的节日！村民们穿着花衣在花丛中跳舞，未婚男女可以选择舞伴。',
    season: Season.SPRING,
    day: 24,
    startTime: 10,
    endTime: 18,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到花舞祭！这是表达爱意的好日子，快去邀请心仪的人跳舞吧！' },
      { npcId: 'girl_hannah', dialog: '今天的花朵真漂亮...不知道会不会有人邀请我跳舞呢？' },
      { npcId: 'boy_tom', dialog: '嘿！今天的花舞祭真热闹！你有想邀请的舞伴吗？' }
    ],
    rewards: [
      { itemId: 'flower_seed_mix', quantity: 1 }
    ],
    specialShop: [
      { itemId: 'bouquet', price: 500 },
      { itemId: 'flower_crown', price: 1500 }
    ]
  },
  {
    id: 'luau',
    name: '夏威夷宴',
    description: '夏天最热闹的节日！村民们带来自己种的食材，共同烹饪一道大锅汤。',
    season: Season.SUMMER,
    day: 11,
    startTime: 9,
    endTime: 17,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到夏威夷宴！请带来你最好的食材，让我们一起做出最美味的汤！' },
      { npcId: 'chef_gus', dialog: '大锅汤的味道取决于放入的食材！拿出你最好的东西来吧！' },
      { npcId: 'shopkeeper', dialog: '夏威夷宴真是太有趣了！去年有人放入了传说中的鱼王...' }
    ],
    rewards: [
      { itemId: 'tomato_seed', quantity: 8 },
      { itemId: 'corn_seed', quantity: 5 }
    ],
    specialShop: [
      { itemId: 'tropical_drink', price: 300 },
      { itemId: 'summer_hat', price: 2500 }
    ]
  },
  {
    id: 'fireworks_show',
    name: '烟火晚会',
    description: '夏季最后一个节日！在海边欣赏绚丽的烟花，可以和村民们聊天增进感情。',
    season: Season.SUMMER,
    day: 28,
    startTime: 19,
    endTime: 22,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到烟火晚会！让我们一起欣赏这美丽的夏夜星空吧！' },
      { npcId: 'girl_hannah', dialog: '烟花...真漂亮啊。要是能和喜欢的人一起看就好了...' },
      { npcId: 'boy_tom', dialog: '哇！那个烟花好大！你觉得明年的烟火晚会会更精彩吗？' }
    ],
    rewards: [
      { itemId: 'pepper_seed', quantity: 10 }
    ],
    specialShop: [
      { itemId: 'sparkler', price: 100 },
      { itemId: 'firework_set', price: 3000 }
    ]
  },
  {
    id: 'stardew_valley_fair',
    name: '星露谷集市',
    description: '秋季最大的节日！展示你的农产品和手工艺品，竞争一年一度的' +
      '星露谷之星奖项。',
    season: Season.AUTUMN,
    day: 16,
    startTime: 9,
    endTime: 21,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到星露谷集市！展示你最好的产品，赢取' +
        '星露谷之星的荣耀！' },
      { npcId: 'farmer_old', dialog: '我年轻时参加过很多次集市比赛，拿过好几次冠军呢！' },
      { npcId: 'shopkeeper', dialog: '今天的集市真热闹！快来看看各种有趣的摊位吧！' }
    ],
    rewards: [
      { itemId: 'pumpkin_seed', quantity: 5 },
      { itemId: 'cabbage_seed', quantity: 5 }
    ],
    specialShop: [
      { itemId: 'stardrop', price: 2000 },
      { itemId: 'autumn_wreath', price: 2500 }
    ]
  },
  {
    id: 'spirits_eve',
    name: '万灵节',
    description: '秋季最神秘的节日！村民们穿上奇装异服，在闹鬼的迷宫中寻找黄金南瓜。',
    season: Season.AUTUMN,
    day: 27,
    startTime: 19,
    endTime: 23,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到万灵节！敢不敢进入神秘的迷宫寻找传说中的黄金南瓜？' },
      { npcId: 'girl_hannah', dialog: '那个迷宫...感觉好可怕...不过听说里面有很多宝藏！' },
      { npcId: 'boy_tom', dialog: '哈哈！这个节日太酷了！我要第一个找到黄金南瓜！' }
    ],
    rewards: [
      { itemId: 'sweet_potato_seed', quantity: 8 }
    ],
    specialShop: [
      { itemId: 'jack_o_lantern', price: 500 },
      { itemId: 'golden_pumpkin', price: 10000 }
    ]
  },
  {
    id: 'festival_of_ice',
    name: '冰雪节',
    description: '冬季的第一个节日！在结冰的湖面上进行钓鱼比赛和冰雕展示。',
    season: Season.WINTER,
    day: 8,
    startTime: 9,
    endTime: 17,
    npcDialogs: [
      { npcId: 'mayor', dialog: '欢迎来到冰雪节！今天湖面结冰了，来参加钓鱼比赛吧！' },
      { npcId: 'fisherman_willy', dialog: '冬天的鱼虽然难钓，但别有一番风味！想不想学学我的秘诀？' },
      { npcId: 'boy_tom', dialog: '冰面好滑啊！你看那边有人在滑冰，真厉害！' }
    ],
    rewards: [
      { itemId: 'crystal_fruit_seed', quantity: 3 }
    ],
    specialShop: [
      { itemId: 'ice_skates', price: 2000 },
      { itemId: 'frozen_tear', price: 5000 }
    ]
  },
  {
    id: 'feast_of_the_winter_star',
    name: '冬星盛宴',
    description: '一年中最重要的节日！村民们互相交换礼物，分享温暖和喜悦。',
    season: Season.WINTER,
    day: 25,
    startTime: 9,
    endTime: 22,
    npcDialogs: [
      { npcId: 'mayor', dialog: '圣诞快乐！欢迎来到冬星盛宴！别忘了准备礼物送给你的秘密好友哦！' },
      { npcId: 'girl_hannah', dialog: '这个节日最开心了！不知道我的秘密好友会送我什么礼物呢？' },
      { npcId: 'farmer_old', dialog: '冬星盛宴...让我想起了年轻时和家人一起度过的美好时光。' }
    ],
    rewards: [
      { itemId: 'seed_maker', quantity: 1 }
    ],
    specialShop: [
      { itemId: 'christmas_wreath', price: 3000 },
      { itemId: 'santa_hat', price: 1500 }
    ]
  }
];

export const getFestivalById = (id: string): FestivalEvent | undefined => {
  return FESTIVALS.find(festival => festival.id === id);
};

export const getFestivalByDate = (season: Season, day: number): FestivalEvent | undefined => {
  return FESTIVALS.find(festival => festival.season === season && festival.day === day);
};
