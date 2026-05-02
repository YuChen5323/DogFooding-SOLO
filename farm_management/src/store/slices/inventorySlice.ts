import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem } from '@/types';

interface InventoryState {
  items: InventoryItem[];
  maxSlots: number;
  selectedTool: string | null;
}

const initialState: InventoryState = {
  items: [],
  maxSlots: 36,
  selectedTool: 'hoe',
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{
      itemId: string;
      quantity: number;
      category: InventoryItem['category'];
    }>) => {
      const { itemId, quantity, category } = action.payload;
      const existingItem = state.items.find(item => item.itemId === itemId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else if (state.items.length < state.maxSlots) {
        state.items.push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId,
          quantity,
          category,
        });
      }
    },
    removeItem: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.itemId === itemId);

      if (itemIndex !== -1) {
        state.items[itemIndex].quantity -= quantity;
        if (state.items[itemIndex].quantity <= 0) {
          state.items.splice(itemIndex, 1);
        }
      }
    },
    setItemQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.itemId === itemId);

      if (item) {
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          const index = state.items.findIndex(i => i.itemId === itemId);
          if (index !== -1) {
            state.items.splice(index, 1);
          }
        }
      }
    },
    clearInventory: (state) => {
      state.items = [];
    },
    selectTool: (state, action: PayloadAction<string | null>) => {
      state.selectedTool = action.payload;
    },
    getItemQuantity: (state, itemId: string) => {
      const item = state.items.find(i => i.itemId === itemId);
      return item ? item.quantity : 0;
    },
  },
});

export const {
  addItem,
  removeItem,
  setItemQuantity,
  clearInventory,
  selectTool,
} = inventorySlice.actions;

export default inventorySlice.reducer;
