import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { InventoryItem } from '../../types';
import { ITEMS } from '../../data/items';

interface InventoryState {
  items: InventoryItem[];
  selectedItemId: string | null;
}

const initialState: InventoryState = {
  items: [
    { ...ITEMS.herb_mint, quantity: 5 },
    { ...ITEMS.herb_nightshade, quantity: 3 },
    { ...ITEMS.herb_sunflower, quantity: 4 },
    { ...ITEMS.mineral_sulfur, quantity: 5 },
    { ...ITEMS.mineral_quartz, quantity: 2 },
    { ...ITEMS.mineral_silver, quantity: 2 },
    { ...ITEMS.fluid_water, quantity: 10 },
    { ...ITEMS.fluid_mercury, quantity: 3 },
    { ...ITEMS.extract_mint_powder, quantity: 3 },
    { ...ITEMS.extract_sulfur_essence, quantity: 2 },
    { ...ITEMS.extract_nightshade_tincture, quantity: 1 },
  ],
  selectedItemId: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const existingItem = state.items.find((i) => i.id === itemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        const itemData = ITEMS[itemId];
        if (itemData) {
          state.items.push({ ...itemData, quantity });
        }
      }
    },
    removeItem: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const existingItem = state.items.find((i) => i.id === itemId);
      
      if (existingItem) {
        existingItem.quantity -= quantity;
        if (existingItem.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== itemId);
        }
      }
    },
    selectItem: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },
  },
});

export const { addItem, removeItem, selectItem } = inventorySlice.actions;
export default inventorySlice.reducer;
