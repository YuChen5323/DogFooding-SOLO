import { createSignal, createEffect } from 'solid-js';
import { SimulationParameters, ChipTemplateType, SimulationResult } from '../types';

interface ControlPanelProps {
  parameters: SimulationParameters;
  templateType: ChipTemplateType;
  isSimulating: boolean;
  simulationProgress: number;
  simulationResult: SimulationResult | null;
  onParametersChange: (params: Partial<SimulationParameters>) => void;
  onTemplateChange: (template: ChipTemplateType) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onReset: () => void;
  onExportDXF: () => void;
  onExportReport: () => void;
  onSaveDesign: () => void;
}

export default function ControlPanel(props: ControlPanelProps) {
  const [localParams, setLocalParams] = createSignal<SimulationParameters>(props.parameters);

  createEffect(() => {
    setLocalParams(props.parameters);
  });

  const updateParam = (key: keyof SimulationParameters, value: number) => {
    const newParams = { ...localParams(), [key]: value };
    
    if (key === 'continuousPhaseFlowRate' || key === 'dispersedPhaseFlowRate') {
      if (newParams.dispersedPhaseFlowRate > 0) {
        newParams.flowRateRatio = newParams.continuousPhaseFlowRate / newParams.dispersedPhaseFlowRate;
      }
    }
    
    setLocalParams(newParams);
    props.onParametersChange({ [key]: value });
  };

  const templateOptions = [
    { value: ChipTemplateType.T_JUNCTION, label: 'T型结芯片', description: '经典T型结液滴发生器' },
    { value: ChipTemplateType.CROSS_FOCUSING, label: '十字聚焦芯片', description: '三向流体聚焦' },
    { value: ChipTemplateType.DROPLET_GENERATOR, label: '高效液滴发生器', description: '带缩颈结构' },
  ];

  return (
    <div class="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          控制面板
        </h2>
      </div>

      <div class="p-4 space-y-5">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">芯片模板</label>
          <select
            value={props.templateType}
            onChange={(e) => props.onTemplateChange(e.target.value as ChipTemplateType)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            {templateOptions.map((opt) => (
              <option value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p class="text-xs text-gray-500 mt-1">
            {templateOptions.find(t => t.value === props.templateType)?.description}
          </p>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            通道参数
          </h3>
          
          <div class="space-y-3">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-600">通道宽度</label>
                <span class="text-xs font-medium text-blue-600">{localParams().channelWidth} μm</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                value={localParams().channelWidth}
                onChange={(e) => updateParam('channelWidth', Number(e.target.value))}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-600">通道高度</label>
                <span class="text-xs font-medium text-blue-600">{localParams().channelHeight} μm</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={localParams().channelHeight}
                onChange={(e) => updateParam('channelHeight', Number(e.target.value))}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            流动参数
          </h3>
          
          <div class="space-y-3">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-600">连续相流速 (油相)</label>
                <span class="text-xs font-medium text-yellow-600">{localParams().continuousPhaseFlowRate} μL/min</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={localParams().continuousPhaseFlowRate}
                onChange={(e) => updateParam('continuousPhaseFlowRate', Number(e.target.value))}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs text-gray-600">分散相流速 (水相)</label>
                <span class="text-xs font-medium text-blue-600">{localParams().dispersedPhaseFlowRate} μL/min</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={localParams().dispersedPhaseFlowRate}
                onChange={(e) => updateParam('dispersedPhaseFlowRate', Number(e.target.value))}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div class="bg-blue-50 rounded-lg p-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">流速比 (连续/分散)</span>
                <span class="text-sm font-bold text-blue-700">{localParams().flowRateRatio.toFixed(2)}:1</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            仿真控制
          </h3>
          
          <div class="flex gap-2">
            {!props.isSimulating ? (
              <button
                onClick={props.onStartSimulation}
                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                开始仿真
              </button>
            ) : (
              <button
                onClick={props.onStopSimulation}
                class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
                暂停仿真
              </button>
            )}
            <button
              onClick={props.onReset}
              class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {props.simulationProgress > 0 && props.simulationProgress < 100 && (
            <div class="mt-3">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>计算中...</span>
                <span>{props.simulationProgress}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${props.simulationProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {props.simulationResult && (
          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              仿真结果
            </h3>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between bg-blue-50 rounded px-3 py-2">
                <span class="text-gray-600">液滴直径</span>
                <span class="font-semibold text-blue-700">{props.simulationResult.dropletSize.toFixed(1)} μm</span>
              </div>
              <div class="flex justify-between bg-green-50 rounded px-3 py-2">
                <span class="text-gray-600">液滴频率</span>
                <span class="font-semibold text-green-700">{props.simulationResult.dropletFrequency.toFixed(2)} Hz</span>
              </div>
              <div class="flex justify-between bg-purple-50 rounded px-3 py-2">
                <span class="text-gray-600">液滴体积</span>
                <span class="font-semibold text-purple-700">{props.simulationResult.dropletVolume.toFixed(2)} pL</span>
              </div>
              <div class="flex justify-between bg-yellow-50 rounded px-3 py-2">
                <span class="text-gray-600">毛细管数 (Ca)</span>
                <span class="font-semibold text-yellow-700">{props.simulationResult.capillaryNumber.toExponential(2)}</span>
              </div>
              <div class="flex justify-between bg-orange-50 rounded px-3 py-2">
                <span class="text-gray-600">雷诺数 (Re)</span>
                <span class="font-semibold text-orange-700">{props.simulationResult.reynoldsNumber.toExponential(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div class="border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出与保存
          </h3>
          
          <div class="grid grid-cols-2 gap-2">
            <button
              onClick={props.onExportDXF}
              class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出 DXF
            </button>
            <button
              onClick={props.onExportReport}
              class="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出报告
            </button>
            <button
              onClick={props.onSaveDesign}
              class="col-span-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              保存设计到 OPFS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
