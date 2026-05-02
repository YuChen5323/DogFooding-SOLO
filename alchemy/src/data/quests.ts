import type { Quest } from '../types';

export const QUESTS: Quest[] = [
  {
    id: 'quest_healing_1',
    title: '村医的委托',
    description: '村庄爆发了一场小瘟疫，村医需要治疗药剂来救助村民。请调制一瓶治疗药剂。',
    requiredPotionId: 'potion_healing',
    reward: { gold: 50, reputation: 10 },
    timeLimit: 180,
    isActive: false,
    isCompleted: false,
  },
  {
    id: 'quest_mana_1',
    title: '法师学徒的请求',
    description: '一位年轻的法师学徒正在准备他的第一次魔法考试，需要魔力药剂来维持长时间的施法。',
    requiredPotionId: 'potion_mana',
    reward: { gold: 60, reputation: 15 },
    timeLimit: 200,
    isActive: false,
    isCompleted: false,
  },
  {
    id: 'quest_strength_1',
    title: '守卫的挑战',
    description: '城市守卫正在选拔新成员，需要力量药剂来通过体能测试。',
    requiredPotionId: 'potion_strength',
    reward: { gold: 100, reputation: 25 },
    timeLimit: 300,
    isActive: false,
    isCompleted: false,
  },
  {
    id: 'quest_invisibility_1',
    title: '盗贼工会的秘密任务',
    description: '盗贼工会需要一瓶隐身药剂来执行一项秘密任务。这是一项高风险高回报的委托。',
    requiredPotionId: 'potion_invisibility',
    reward: { gold: 200, reputation: 50 },
    timeLimit: 400,
    isActive: false,
    isCompleted: false,
  },
  {
    id: 'quest_poison_1',
    title: '暗影中的交易',
    description: '一位神秘的客户需要剧毒药剂。警告：此任务可能涉及非法活动，但报酬丰厚。',
    requiredPotionId: 'potion_poison',
    reward: { gold: 150, reputation: -10 },
    timeLimit: 250,
    isActive: false,
    isCompleted: false,
  },
  {
    id: 'quest_immortality_1',
    title: '国王的终极愿望',
    description: '年迈的国王渴望永生，愿意付出任何代价来获得永生药剂。这是传说级的委托！',
    requiredPotionId: 'potion_immortality',
    reward: { gold: 1000, reputation: 200 },
    timeLimit: 600,
    isActive: false,
    isCompleted: false,
  },
];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuestsByDifficulty(reputationRequired: number): Quest[] {
  return QUESTS.filter((q) => {
    if (q.reward.reputation >= 100) return reputationRequired >= 100;
    if (q.reward.reputation >= 50) return reputationRequired >= 50;
    return true;
  });
}
