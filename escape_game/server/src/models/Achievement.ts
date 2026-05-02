import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  points: number;
  hidden: boolean;
}

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  unlockedAt: Date;
}

const achievementSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: String,
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
});

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const achievementDefinitions: IAchievementDefinition[] = [
  {
    id: 'first_puzzle',
    name: '初露锋芒',
    description: '解开第一个谜题',
    icon: '🔓',
    condition: 'puzzlesSolved.length >= 1',
    points: 10,
    hidden: false
  },
  {
    id: 'item_collector',
    name: '收集者',
    description: '收集5个物品',
    icon: '🎒',
    condition: 'inventory.length >= 5',
    points: 15,
    hidden: false
  },
  {
    id: 'diary_reader',
    name: '求知若渴',
    description: '阅读所有日记条目',
    icon: '📖',
    condition: 'diaryEntries.length >= 3',
    points: 20,
    hidden: false
  },
  {
    id: 'speed_demon',
    name: '闪电侠',
    description: '在30分钟内通关',
    icon: '⚡',
    condition: 'playTime <= 1800',
    points: 50,
    hidden: true
  },
  {
    id: 'master_escaper',
    name: '逃脱大师',
    description: '完成游戏',
    icon: '🏆',
    condition: 'currentRoom === "ending"',
    points: 100,
    hidden: false
  },
  {
    id: 'all_puzzles',
    name: '解谜达人',
    description: '解开所有谜题',
    icon: '🧩',
    condition: 'puzzlesSolved.length >= 5',
    points: 30,
    hidden: false
  }
];

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
