import React from 'react';
import { useGardenStore } from '../../store';
import type { Season, TimeOfDay, CameraMode } from '../../types';

const seasonLabels: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

const timeOfDayLabels: Record<TimeOfDay, string> = {
  dawn: '晨曦',
  day: '白昼',
  dusk: '黄昏',
  night: '夜晚',
};

const cameraModeLabels: Record<CameraMode, string> = {
  birdseye: '鸟瞰',
  firstperson: '漫游',
};

export const ControlPanel: React.FC = () => {
  const {
    globalParams,
    cameraState,
    sceneState,
    updateGlobalParam,
    setCameraMode,
    randomizeSeed,
    regenerateScene,
  } = useGardenStore();

  const handleLakeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalParam('lakeSize', parseFloat(e.target.value));
  };

  const handleVegetationDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGlobalParam('vegetationDensity', parseFloat(e.target.value));
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateGlobalParam('season', e.target.value as Season);
  };

  const handleTimeOfDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateGlobalParam('timeOfDay', e.target.value as TimeOfDay);
  };

  const handleCameraModeChange = (mode: CameraMode) => {
    setCameraMode(mode);
  };

  const handleRandomize = () => {
    randomizeSeed();
  };

  const handleRegenerate = () => {
    regenerateScene();
  };

  return (
    <div className="absolute top-4 left-4 z-20 animate-fade-in">
      <div className="ink-panel rounded-lg p-5 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="ink-title text-xl mb-4 text-center">
          园
          <span className="text-ink-500">林</span>
          造
          <span className="text-ink-500">园</span>
        </h2>
        
        <div className="ink-divider" />
        
        <div className="mb-5">
          <label className="ink-label">全局参数</label>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-ink-700">湖面大小</span>
              <span className="text-sm text-ink-500">{Math.round(globalParams.lakeSize * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.7"
              step="0.05"
              value={globalParams.lakeSize}
              onChange={handleLakeSizeChange}
              className="ink-slider w-full"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-ink-700">植被密度</span>
              <span className="text-sm text-ink-500">{Math.round(globalParams.vegetationDensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={globalParams.vegetationDensity}
              onChange={handleVegetationDensityChange}
              className="ink-slider w-full"
            />
          </div>
          
          <div className="mb-4">
            <label className="ink-label mb-2">季节</label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(seasonLabels) as Season[]).map((season) => (
                <button
                  key={season}
                  onClick={() => updateGlobalParam('season', season)}
                  className={`px-2 py-1.5 text-sm rounded transition-all ${
                    globalParams.season === season
                      ? 'bg-ink-800 text-white shadow-md'
                      : 'bg-white/60 text-ink-700 hover:bg-white/80 border border-ink-200/50'
                  }`}
                >
                  {seasonLabels[season]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="ink-label mb-2">时辰</label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(timeOfDayLabels) as TimeOfDay[]).map((time) => (
                <button
                  key={time}
                  onClick={() => updateGlobalParam('timeOfDay', time)}
                  className={`px-2 py-1.5 text-sm rounded transition-all ${
                    globalParams.timeOfDay === time
                      ? 'bg-ink-800 text-white shadow-md'
                      : 'bg-white/60 text-ink-700 hover:bg-white/80 border border-ink-200/50'
                  }`}
                >
                  {timeOfDayLabels[time]}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="ink-divider" />
        
        <div className="mb-5">
          <label className="ink-label">视角</label>
          <div className="flex gap-2">
            {(Object.keys(cameraModeLabels) as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleCameraModeChange(mode)}
                className={`flex-1 ink-button transition-all ${
                  cameraState.mode === mode
                    ? 'ink-button-primary'
                    : ''
                }`}
              >
                {cameraModeLabels[mode]}
              </button>
            ))}
          </div>
          
          {cameraState.mode === 'firstperson' && (
            <p className="text-xs text-ink-500 mt-2">
              点击画布锁定鼠标，使用 WASD 移动，空格键上升，Shift 下降，Esc 解锁
            </p>
          )}
        </div>
        
        <div className="ink-divider" />
        
        <div className="mb-3">
          <div className="flex gap-2">
            <button
              onClick={handleRandomize}
              className="flex-1 ink-button"
            >
              随机种子
            </button>
            <button
              onClick={handleRegenerate}
              className="flex-1 ink-button-primary"
              disabled={sceneState.isGenerating}
            >
              {sceneState.isGenerating ? '生成中...' : '重新生成'}
            </button>
          </div>
        </div>
        
        {sceneState.isGenerating && (
          <div className="mt-3">
            <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ink-700 transition-all duration-300"
                style={{ width: `${sceneState.generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-ink-500 text-center mt-1">
              生成进度: {Math.round(sceneState.generationProgress)}%
            </p>
          </div>
        )}
        
        <div className="ink-divider" />
        
        <div className="text-xs text-ink-500 text-center mt-3">
          <p>种子: {Math.round(globalParams.seed)}</p>
        </div>
      </div>
    </div>
  );
};

export const ExportPanel: React.FC<{
  onExportGLB: () => void;
  onExportScreenshot: () => void;
}> = ({ onExportGLB, onExportScreenshot }) => {
  return (
    <div className="absolute bottom-4 left-4 z-20 animate-fade-in-up">
      <div className="ink-panel rounded-lg p-4">
        <h3 className="ink-title text-sm mb-3">导出</h3>
        <div className="flex gap-2">
          <button
            onClick={onExportGLB}
            className="ink-button text-sm"
          >
            导出 GLB
          </button>
          <button
            onClick={onExportScreenshot}
            className="ink-button text-sm"
          >
            截图
          </button>
        </div>
      </div>
    </div>
  );
};

export const InfoPanel: React.FC = () => {
  const { globalParams, sceneState } = useGardenStore();
  
  return (
    <div className="absolute top-4 right-4 z-20 animate-fade-in">
      <div className="ink-panel rounded-lg p-4 max-w-xs">
        <div className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-ink-600">网格大小</span>
            <span className="text-ink-800 font-medium">{globalParams.gridSize} × {globalParams.gridSize}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-600">季节</span>
            <span className="text-ink-800 font-medium">{seasonLabels[globalParams.season]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600">时辰</span>
            <span className="text-ink-800 font-medium">{timeOfDayLabels[globalParams.timeOfDay]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TitleBar: React.FC = () => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="ink-panel rounded-full px-6 py-2">
        <h1 className="ink-title text-lg tracking-widest">
          造园记
        </h1>
      </div>
    </div>
  );
};
