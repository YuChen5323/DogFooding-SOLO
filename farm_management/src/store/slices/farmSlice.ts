import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Plot, PlantedCrop, Season, GameTime } from '@/types';
import { getCropById } from '@/data/crops';

interface FarmState {
  plots: Plot[][];
  gridSize: { width: number; height: number };
}

const createInitialPlot = (x: number, y: number): Plot => {
  const hasRock = Math.random() < 0.1;
  const hasWeed = Math.random() < 0.15 && !hasRock;
  return {
    x,
    y,
    tilled: false,
    watered: false,
    crop: null,
    hasRock,
    hasWeed,
  };
};

const createInitialPlots = (width: number, height: number): Plot[][] => {
  const plots: Plot[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Plot[] = [];
    for (let x = 0; x < width; x++) {
      row.push(createInitialPlot(x, y));
    }
    plots.push(row);
  }
  return plots;
};

const initialState: FarmState = {
  gridSize: { width: 15, height: 10 },
  plots: createInitialPlots(15, 10),
};

const farmSlice = createSlice({
  name: 'farm',
  initialState,
  reducers: {
    tillPlot: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const { x, y } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        const plot = state.plots[y][x];
        if (!plot.hasRock && !plot.tilled) {
          plot.tilled = true;
          plot.hasWeed = false;
        }
      }
    },
    waterPlot: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const { x, y } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        const plot = state.plots[y][x];
        if (plot.tilled) {
          plot.watered = true;
        }
      }
    },
    plantSeed: (state, action: PayloadAction<{
      x: number;
      y: number;
      cropId: string;
      currentTime: GameTime;
    }>) => {
      const { x, y, cropId, currentTime } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        const plot = state.plots[y][x];
        if (plot.tilled && !plot.crop) {
          const crop = getCropById(cropId);
          if (crop) {
            plot.crop = {
              cropId,
              currentStage: 0,
              growthProgress: 0,
              watered: false,
              ready: false,
              plantedAt: { ...currentTime },
              regrowProgress: crop.regrows ? 0 : undefined,
            };
          }
        }
      }
    },
    harvestCrop: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const { x, y } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        const plot = state.plots[y][x];
        if (plot.crop && plot.crop.ready) {
          const crop = getCropById(plot.crop.cropId);
          if (crop && crop.regrows) {
            plot.crop.ready = false;
            plot.crop.currentStage = 3;
            plot.crop.regrowProgress = 0;
          } else {
            plot.crop = null;
          }
        }
      }
    },
    removeRock: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const { x, y } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        state.plots[y][x].hasRock = false;
      }
    },
    removeWeed: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const { x, y } = action.payload;
      if (y >= 0 && y < state.plots.length && x >= 0 && x < state.plots[0].length) {
        state.plots[y][x].hasWeed = false;
      }
    },
    updateCropGrowth: (state, action: PayloadAction<{ currentSeason: Season; daysPassed: number }>) => {
      const { currentSeason, daysPassed } = action.payload;

      for (let y = 0; y < state.plots.length; y++) {
        for (let x = 0; x < state.plots[y].length; x++) {
          const plot = state.plots[y][x];

          if (plot.crop) {
            const crop = getCropById(plot.crop.cropId);
            if (crop) {
              const isCorrectSeason = crop.seasons.includes(currentSeason);
              
              if (!isCorrectSeason) {
                plot.crop = null;
                continue;
              }

              if (plot.watered || plot.crop.watered) {
                if (plot.crop.ready && crop.regrows && plot.crop.regrowProgress !== undefined) {
                  plot.crop.regrowProgress += daysPassed;
                  if (crop.regrowTime && plot.crop.regrowProgress >= crop.regrowTime) {
                    plot.crop.ready = true;
                    plot.crop.regrowProgress = 0;
                  }
                } else if (!plot.crop.ready) {
                  plot.crop.growthProgress += daysPassed;
                  const growthPerStage = crop.growthTime / (crop.growthStages - 1);
                  
                  while (
                    plot.crop.currentStage < crop.growthStages - 1 &&
                    plot.crop.growthProgress >= (plot.crop.currentStage + 1) * growthPerStage
                  ) {
                    plot.crop.currentStage++;
                  }

                  if (plot.crop.growthProgress >= crop.growthTime) {
                    plot.crop.ready = true;
                  }
                }
              }
            }
          }
        }
      }
    },
    resetWatering: (state) => {
      for (let y = 0; y < state.plots.length; y++) {
        for (let x = 0; x < state.plots[y].length; x++) {
          const plot = state.plots[y][x];
          if (plot.crop) {
            plot.crop.watered = plot.watered;
          }
          plot.watered = false;
        }
      }
    },
  },
});

export const {
  tillPlot,
  waterPlot,
  plantSeed,
  harvestCrop,
  removeRock,
  removeWeed,
  updateCropGrowth,
  resetWatering,
} = farmSlice.actions;

export default farmSlice.reducer;
