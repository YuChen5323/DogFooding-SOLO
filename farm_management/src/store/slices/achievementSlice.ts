import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Achievement, GameTime } from '@/types';
import { ACHIEVEMENTS } from '@/data/achievements';

interface AchievementState {
  achievements: Achievement[];
  notifications: { id: string; title: string; description: string }[];
}

const initialState: AchievementState = {
  achievements: [...ACHIEVEMENTS],
  notifications: [],
};

const achievementSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    updateProgress: (state, action: PayloadAction<{
      type: Achievement['condition']['type'];
      amount: number;
      currentTime: GameTime;
    }>) => {
      const { type, amount, currentTime } = action.payload;

      for (const achievement of state.achievements) {
        if (achievement.condition.type === type && !achievement.unlocked) {
          achievement.condition.current = Math.min(
            achievement.condition.target,
            achievement.condition.current + amount
          );

          if (achievement.condition.current >= achievement.condition.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = { ...currentTime };
            state.notifications.push({
              id: achievement.id,
              title: achievement.name,
              description: achievement.description,
            });
          }
        }
      }
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        state.notifications.splice(index, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    unlockAchievement: (state, action: PayloadAction<{ id: string; currentTime: GameTime }>) => {
      const { id, currentTime } = action.payload;
      const achievement = state.achievements.find(a => a.id === id);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = { ...currentTime };
        state.notifications.push({
          id: achievement.id,
          title: achievement.name,
          description: achievement.description,
        });
      }
    },
  },
});

export const {
  updateProgress,
  dismissNotification,
  clearAllNotifications,
  unlockAchievement,
} = achievementSlice.actions;

export default achievementSlice.reducer;
