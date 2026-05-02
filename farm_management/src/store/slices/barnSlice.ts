import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Barn, Animal, AnimalType, GameTime } from '@/types';
import { getAnimalTypeById } from '@/data/animals';

interface BarnState {
  barns: Barn[];
}

const initialState: BarnState = {
  barns: [
    {
      id: 'barn_1',
      name: '小鸡舍',
      maxAnimals: 4,
      animals: [],
    },
    {
      id: 'barn_2',
      name: '大畜舍',
      maxAnimals: 8,
      animals: [],
    },
  ],
};

const generateAnimalName = (type: string): string => {
  const names: Record<string, string[]> = {
    chicken: ['小吉', '蛋黄', '白绒', '黑羽', '金蛋', '花斑'],
    cow: ['牛牛', '花花', '大白', '奶牛王', '阿花', '斑斑'],
    sheep: ['绵羊', '棉花', '白云', '雪球', '毛绒', '白羊'],
    pig: ['小猪', '八戒', '肉肉', '胖胖', '圆圆', '嘟嘟'],
  };
  const typeNames = names[type] || ['宠物'];
  return typeNames[Math.floor(Math.random() * typeNames.length)];
};

const barnSlice = createSlice({
  name: 'barn',
  initialState,
  reducers: {
    addAnimal: (state, action: PayloadAction<{
      animalTypeId: string;
      barnId: string;
      currentTime: GameTime;
    }>) => {
      const { animalTypeId, barnId, currentTime } = action.payload;
      const animalType = getAnimalTypeById(animalTypeId);
      const barn = state.barns.find(b => b.id === barnId);

      if (animalType && barn && barn.animals.length < barn.maxAnimals) {
        const newAnimal: Animal = {
          id: `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: animalType,
          name: generateAnimalName(animalTypeId),
          happiness: 100,
          hunger: 50,
          fedToday: false,
          petToday: false,
          produceReady: false,
          produceProgress: 0,
          purchasedAt: { ...currentTime },
        };
        barn.animals.push(newAnimal);
      }
    },
    removeAnimal: (state, action: PayloadAction<{ animalId: string; barnId: string }>) => {
      const { animalId, barnId } = action.payload;
      const barn = state.barns.find(b => b.id === barnId);
      if (barn) {
        const index = barn.animals.findIndex(a => a.id === animalId);
        if (index !== -1) {
          barn.animals.splice(index, 1);
        }
      }
    },
    feedAnimal: (state, action: PayloadAction<{ animalId: string; barnId: string }>) => {
      const { animalId, barnId } = action.payload;
      const barn = state.barns.find(b => b.id === barnId);
      if (barn) {
        const animal = barn.animals.find(a => a.id === animalId);
        if (animal && !animal.fedToday) {
          animal.hunger = 100;
          animal.fedToday = true;
          animal.happiness = Math.min(255, animal.happiness + 20);
        }
      }
    },
    petAnimal: (state, action: PayloadAction<{ animalId: string; barnId: string }>) => {
      const { animalId, barnId } = action.payload;
      const barn = state.barns.find(b => b.id === barnId);
      if (barn) {
        const animal = barn.animals.find(a => a.id === animalId);
        if (animal && !animal.petToday) {
          animal.petToday = true;
          animal.happiness = Math.min(255, animal.happiness + 30);
        }
      }
    },
    collectProduce: (state, action: PayloadAction<{ animalId: string; barnId: string }>) => {
      const { animalId, barnId } = action.payload;
      const barn = state.barns.find(b => b.id === barnId);
      if (barn) {
        const animal = barn.animals.find(a => a.id === animalId);
        if (animal && animal.produceReady) {
          animal.produceReady = false;
          animal.produceProgress = 0;
        }
      }
    },
    updateAnimals: (state, action: PayloadAction<{ daysPassed: number }>) => {
      const { daysPassed } = action.payload;

      for (const barn of state.barns) {
        for (const animal of barn.animals) {
          if (!animal.fedToday) {
            animal.hunger = Math.max(0, animal.hunger - 10 * daysPassed);
            if (animal.hunger < 30) {
              animal.happiness = Math.max(0, animal.happiness - 20);
            }
          }

          if (!animal.produceReady && animal.type.produceTime > 0) {
            animal.produceProgress += daysPassed;
            if (animal.produceProgress >= animal.type.produceTime) {
              animal.produceReady = true;
              animal.produceProgress = 0;
            }
          }

          animal.hunger = Math.max(0, animal.hunger - 5);
          animal.fedToday = false;
          animal.petToday = false;
        }
      }
    },
    renameAnimal: (state, action: PayloadAction<{
      animalId: string;
      barnId: string;
      newName: string;
    }>) => {
      const { animalId, barnId, newName } = action.payload;
      const barn = state.barns.find(b => b.id === barnId);
      if (barn) {
        const animal = barn.animals.find(a => a.id === animalId);
        if (animal) {
          animal.name = newName;
        }
      }
    },
  },
});

export const {
  addAnimal,
  removeAnimal,
  feedAnimal,
  petAnimal,
  collectProduce,
  updateAnimals,
  renameAnimal,
} = barnSlice.actions;

export default barnSlice.reducer;
