import { Item } from '../../types/game';

export const items: Record<string, Item> = {
  rusty_key: {
    id: 'rusty_key',
    name: '生锈的钥匙',
    description: '一把锈迹斑斑的铜钥匙，上面刻有奇怪的花纹。',
    icon: '🗝️'
  },
  old_photo: {
    id: 'old_photo',
    name: '旧照片',
    description: '一张褪色的黑白照片，照片上是一个穿着复古长裙的女人，背景是这座宅邸的大门。',
    icon: '📷'
  },
  broken_mirror: {
    id: 'broken_mirror',
    name: '破碎的镜子',
    description: '一面破碎的手镜，从碎片中似乎能看到什么...',
    icon: '🪞'
  },
  candle: {
    id: 'candle',
    name: '蜡烛',
    description: '一根已经点燃的蜡烛，发出微弱的光芒。',
    icon: '🕯️'
  },
  diary_page: {
    id: 'diary_page',
    name: '日记页',
    description: '从日记中撕下的一页纸，上面写着："当月亮与太阳相遇，秘密之门将开启..."',
    icon: '📄'
  },
  gear_silver: {
    id: 'gear_silver',
    name: '银色齿轮',
    description: '一个精致的银色齿轮，似乎是某种机关的一部分。',
    icon: '⚙️',
    combinable: ['gear_gold']
  },
  gear_gold: {
    id: 'gear_gold',
    name: '金色齿轮',
    description: '一个闪闪发光的金色齿轮，与银色齿轮可以组合。',
    icon: '⚙️',
    combinable: ['gear_silver']
  },
  complete_mechanism: {
    id: 'complete_mechanism',
    name: '完整机关',
    description: '银色和金色齿轮组合而成的完整机关装置，可以用来启动某些古老的机关。',
    icon: '🔧'
  },
  ancient_amulet: {
    id: 'ancient_amulet',
    name: '古老护符',
    description: '一个散发着微弱光芒的古老护符，上面刻有神秘的符文。据说它是离开这里的关键。',
    icon: '🔮'
  },
  library_key: {
    id: 'library_key',
    name: '书房钥匙',
    description: '一把精致的铜钥匙，上面刻着一本小书的图案。',
    icon: '🗝️'
  }
};

export const combinationRecipes: Record<string, string> = {
  'gear_silver,gear_gold': 'complete_mechanism',
  'gear_gold,gear_silver': 'complete_mechanism'
};
