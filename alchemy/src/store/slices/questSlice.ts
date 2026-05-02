import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Quest } from '../../types';
import { QUESTS } from '../../data/quests';

interface QuestState {
  availableQuests: Quest[];
  activeQuest: Quest | null;
  questTimeRemaining: number;
}

const initialState: QuestState = {
  availableQuests: [...QUESTS],
  activeQuest: null,
  questTimeRemaining: 0,
};

const questSlice = createSlice({
  name: 'quest',
  initialState,
  reducers: {
    startQuest: (state, action: PayloadAction<string>) => {
      const quest = state.availableQuests.find((q) => q.id === action.payload);
      if (quest && !state.activeQuest) {
        state.activeQuest = { ...quest, isActive: true };
        state.questTimeRemaining = quest.timeLimit;
      }
    },
    abandonQuest: (state) => {
      if (state.activeQuest) {
        state.activeQuest = { ...state.activeQuest, isActive: false };
        state.activeQuest = null;
        state.questTimeRemaining = 0;
      }
    },
    completeQuest: (state) => {
      if (state.activeQuest) {
        const questId = state.activeQuest.id;
        state.availableQuests = state.availableQuests.map((q) =>
          q.id === questId ? { ...q, isCompleted: true } : q
        );
        state.activeQuest = null;
        state.questTimeRemaining = 0;
      }
    },
    tickQuestTimer: (state, action: PayloadAction<number>) => {
      if (state.questTimeRemaining > 0) {
        state.questTimeRemaining = Math.max(0, state.questTimeRemaining - action.payload);
      }
    },
    refreshQuests: (state) => {
      state.availableQuests = [...QUESTS];
    },
  },
});

export const { startQuest, abandonQuest, completeQuest, tickQuestTimer, refreshQuests } =
  questSlice.actions;

export default questSlice.reducer;
