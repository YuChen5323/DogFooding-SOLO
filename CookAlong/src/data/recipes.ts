import { Recipe } from '@/types';

const generateId = (): string => Math.random().toString(36).substring(2, 11);

export const sampleRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: '番茄炒蛋',
    description: '经典家常快手菜，酸甜可口，营养丰富',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800&h=600',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: 'easy',
    tags: ['快手菜', '家常菜', '下饭菜'],
    ingredients: [
      { id: generateId(), name: '番茄', quantity: 2, unit: 'piece' },
      { id: generateId(), name: '鸡蛋', quantity: 3, unit: 'piece' },
      { id: generateId(), name: '盐', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '糖', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '植物油', quantity: 2, unit: 'tablespoon' },
      { id: generateId(), name: '葱', quantity: 1, unit: 'piece' },
    ],
    steps: [
      {
        id: generateId(),
        stepNumber: 1,
        title: '准备食材',
        description: '番茄洗净切块，鸡蛋打散加少许盐，葱切葱花备用。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 2,
        title: '炒鸡蛋',
        description: '热锅倒油，油温六成热时倒入蛋液，用筷子快速划散成小块，盛出备用。',
        timers: [
          { id: generateId(), name: '炒鸡蛋', duration: 120, remainingTime: 120, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 3,
        title: '炒番茄',
        description: '锅中再加少许油，放入番茄块翻炒，加盐和糖调味，炒至番茄出汁变软。',
        timers: [
          { id: generateId(), name: '炒番茄', duration: 180, remainingTime: 180, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 4,
        title: '混合翻炒',
        description: '将炒好的鸡蛋倒回锅中，与番茄一起翻炒均匀，撒上葱花即可出锅。',
        timers: [],
        isCompleted: false,
      },
    ],
  },
  {
    id: 'recipe-2',
    title: '简易蛋糕',
    description: '无需烤箱，电饭锅就能做出的松软蛋糕',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800&h=600',
    prepTime: 15,
    cookTime: 45,
    servings: 6,
    difficulty: 'medium',
    tags: ['烘焙', '甜点', '电饭锅'],
    ingredients: [
      { id: generateId(), name: '鸡蛋', quantity: 4, unit: 'piece' },
      { id: generateId(), name: '低筋面粉', quantity: 0.75, unit: 'cup' },
      { id: generateId(), name: '糖', quantity: 0.5, unit: 'cup' },
      { id: generateId(), name: '牛奶', quantity: 0.5, unit: 'cup' },
      { id: generateId(), name: '植物油', quantity: 0.25, unit: 'cup' },
      { id: generateId(), name: '泡打粉', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '香草精', quantity: 1, unit: 'teaspoon' },
    ],
    steps: [
      {
        id: generateId(),
        stepNumber: 1,
        title: '分离蛋清蛋黄',
        description: '将蛋清和蛋黄分离到两个无油无水的容器中。蛋清放冰箱冷藏备用。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 2,
        title: '制作蛋黄糊',
        description: '蛋黄中加入2大勺糖、牛奶、植物油，搅拌均匀。筛入低筋面粉和泡打粉，翻拌至无干粉。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 3,
        title: '打发蛋白',
        description: '蛋白从冰箱取出，加入几滴白醋或柠檬汁，用电动打蛋器打发。分三次加入剩余的糖，打至硬性发泡（提起有直立小尖角）。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 4,
        title: '混合面糊',
        description: '取1/3蛋白霜到蛋黄糊中，翻拌均匀。再将混合好的面糊倒回剩余的蛋白霜中，继续翻拌均匀。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 5,
        title: '蒸蛋糕',
        description: '电饭锅内壁刷油，倒入面糊，轻轻震出气泡。按下煮饭键，跳键后焖20分钟。再次按下煮饭键，跳键后再焖15分钟。',
        timers: [
          { id: generateId(), name: '第一次焖', duration: 1200, remainingTime: 1200, isRunning: false, isPaused: false },
          { id: generateId(), name: '第二次焖', duration: 900, remainingTime: 900, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 6,
        title: '出锅放凉',
        description: '蒸好后立即倒扣，完全放凉后再脱模切块享用。',
        timers: [
          { id: generateId(), name: '放凉', duration: 1800, remainingTime: 1800, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
    ],
  },
  {
    id: 'recipe-3',
    title: '香煎鸡胸肉',
    description: '嫩滑多汁的减脂必备鸡胸肉做法',
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=800&h=600',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    tags: ['减脂', '高蛋白', '快手菜'],
    ingredients: [
      { id: generateId(), name: '鸡胸肉', quantity: 2, unit: 'piece' },
      { id: generateId(), name: '大蒜', quantity: 3, unit: 'piece' },
      { id: generateId(), name: '橄榄油', quantity: 2, unit: 'tablespoon' },
      { id: generateId(), name: '盐', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '黑胡椒', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '酱油', quantity: 2, unit: 'tablespoon' },
      { id: generateId(), name: '蜂蜜', quantity: 1, unit: 'tablespoon' },
      { id: generateId(), name: '柠檬', quantity: 0.5, unit: 'piece' },
    ],
    steps: [
      {
        id: generateId(),
        stepNumber: 1,
        title: '处理鸡胸肉',
        description: '鸡胸肉用刀背敲打均匀厚度（约1.5厘米），两面撒盐和黑胡椒腌制10分钟。',
        timers: [
          { id: generateId(), name: '腌制', duration: 600, remainingTime: 600, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 2,
        title: '调制酱汁',
        description: '大蒜切末，碗中加入酱油、蜂蜜、少许橄榄油，搅拌均匀备用。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 3,
        title: '煎鸡胸肉',
        description: '平底锅中火加热橄榄油，放入鸡胸肉，每面煎4-5分钟至表面金黄，内部熟透。',
        timers: [
          { id: generateId(), name: '第一面', duration: 270, remainingTime: 270, isRunning: false, isPaused: false },
          { id: generateId(), name: '第二面', duration: 270, remainingTime: 270, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 4,
        title: '裹汁出锅',
        description: '倒入调好的酱汁，快速翻裹，让鸡胸肉均匀裹上酱汁。挤上柠檬汁，出锅静置3分钟后切片享用。',
        timers: [
          { id: generateId(), name: '静置醒肉', duration: 180, remainingTime: 180, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
    ],
  },
  {
    id: 'recipe-4',
    title: '奶油蘑菇意面',
    description: '浓郁奶香与鲜香蘑菇的完美结合',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800&h=600',
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    difficulty: 'medium',
    tags: ['意大利菜', '意面', '奶香'],
    ingredients: [
      { id: generateId(), name: '意大利面', quantity: 200, unit: 'gram' },
      { id: generateId(), name: '口蘑', quantity: 150, unit: 'gram' },
      { id: generateId(), name: '淡奶油', quantity: 200, unit: 'milliliter' },
      { id: generateId(), name: '大蒜', quantity: 3, unit: 'piece' },
      { id: generateId(), name: '黄油', quantity: 30, unit: 'gram' },
      { id: generateId(), name: '帕玛森芝士', quantity: 50, unit: 'gram' },
      { id: generateId(), name: '盐', quantity: 1, unit: 'teaspoon' },
      { id: generateId(), name: '黑胡椒', quantity: 0.5, unit: 'teaspoon' },
      { id: generateId(), name: '欧芹', quantity: 1, unit: 'piece' },
    ],
    steps: [
      {
        id: generateId(),
        stepNumber: 1,
        title: '煮意面',
        description: '大锅水烧开加盐，放入意面按包装说明煮至八分熟（比包装时间少2分钟），保留一杯煮面水备用。',
        timers: [
          { id: generateId(), name: '煮意面', duration: 600, remainingTime: 600, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 2,
        title: '准备蘑菇',
        description: '口蘑切片，大蒜切末，欧芹切碎备用。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 3,
        title: '炒蘑菇',
        description: '中火融化黄油，加入蒜末炒香，放入口蘑翻炒至出水变软，加盐和黑胡椒调味。',
        timers: [
          { id: generateId(), name: '炒蘑菇', duration: 300, remainingTime: 300, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 4,
        title: '制作酱汁',
        description: '倒入淡奶油，小火煮2-3分钟至微微浓稠。加入帕玛森芝士搅拌融化。',
        timers: [
          { id: generateId(), name: '煮酱汁', duration: 180, remainingTime: 180, isRunning: false, isPaused: false },
        ],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 5,
        title: '混合意面',
        description: '将煮好的意面和少许煮面水加入酱汁中，快速翻拌均匀，让每根意面都裹上酱汁。',
        timers: [],
        isCompleted: false,
      },
      {
        id: generateId(),
        stepNumber: 6,
        title: '装盘享用',
        description: '意面装盘，撒上黑胡椒和欧芹碎，擦上额外的帕玛森芝士即可享用。',
        timers: [],
        isCompleted: false,
      },
    ],
  },
];

export function findMatchingRecipes(detectedIngredients: string[]): Recipe[] {
  if (detectedIngredients.length === 0) {
    return sampleRecipes;
  }

  const normalizedDetected = detectedIngredients.map(i => i.toLowerCase().trim());
  
  const scoredRecipes = sampleRecipes.map(recipe => {
    const recipeIngredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
    let matchedIngredients: string[] = [];
    
    for (const detected of normalizedDetected) {
      for (const recipeIngredient of recipeIngredientNames) {
        if (recipeIngredient.includes(detected) || detected.includes(recipeIngredient)) {
          if (!matchedIngredients.includes(recipeIngredient)) {
            matchedIngredients.push(recipeIngredient);
          }
        }
      }
    }

    return {
      ...recipe,
      matchedIngredients,
      matchScore: matchedIngredients.length / recipe.ingredients.length,
    };
  });

  return scoredRecipes
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function getRecipeById(id: string): Recipe | undefined {
  return sampleRecipes.find(recipe => recipe.id === id);
}
