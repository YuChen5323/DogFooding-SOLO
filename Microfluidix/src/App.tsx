import { createSignal, onMount, onCleanup } from 'solid-js';
import CanvasView from './components/CanvasView';
import ControlPanel from './components/ControlPanel';
import { getTemplate } from './templates';
import { AnimationSystem } from './utils/animation';
import { downloadDXF, downloadReport } from './utils/export';
import { saveDesignToOPFS } from './utils/storage';
import {
  ChipTemplateType,
  SimulationParameters,
  SimulationResult,
  ChipTemplate,
  Droplet,
  Point,
  FluidType,
} from './types';

import SimulationWorker from './workers/simulation.worker?worker';

interface WorkerMessage {
  type: 'start' | 'stop' | 'update';
  channels?: any[];
  nodes?: any[];
  parameters?: SimulationParameters;
}

interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  result?: SimulationResult;
  progress?: number;
  error?: string;
}

export default function App() {
  const [templateType, setTemplateType] = createSignal<ChipTemplateType>(ChipTemplateType.T_JUNCTION);
  const [chipTemplate, setChipTemplate] = createSignal<ChipTemplate>(getTemplate(ChipTemplateType.T_JUNCTION));
  const [parameters, setParameters] = createSignal<SimulationParameters>(
    getTemplate(ChipTemplateType.T_JUNCTION).defaultParameters
  );
  const [isSimulating, setIsSimulating] = createSignal(false);
  const [simulationProgress, setSimulationProgress] = createSignal(0);
  const [simulationResult, setSimulationResult] = createSignal<SimulationResult | null>(null);
  const [droplets, setDroplets] = createSignal<Droplet[]>([]);
  const [particles, setParticles] = createSignal<{
    id: number;
    position: Point;
    velocity: Point;
    size: number;
    color: string;
    phase: FluidType;
  }[]>([]);
  const [totalDropletsGenerated, setTotalDropletsGenerated] = createSignal(0);

  let simulationWorker: Worker | null = null;
  let animationSystem: AnimationSystem | null = null;
  let animationFrameId: number | null = null;
  let lastTime: number = 0;

  onMount(() => {
    animationSystem = new AnimationSystem();
    
    simulationWorker = new SimulationWorker();
    
    simulationWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const response = e.data;
      
      switch (response.type) {
        case 'progress':
          if (response.progress !== undefined) {
            setSimulationProgress(response.progress);
          }
          break;
          
        case 'result':
          if (response.result) {
            setSimulationResult(response.result);
            setSimulationProgress(100);
            
            if (animationSystem) {
              animationSystem.updateSimulation(
                response.result,
                parameters(),
                chipTemplate().channels
              );
            }
          }
          break;
          
        case 'error':
          console.error('Simulation worker error:', response.error);
          setIsSimulating(false);
          break;
      }
    };
    
    simulationWorker.onerror = (error: ErrorEvent) => {
      console.error('Worker error:', error);
      setIsSimulating(false);
    };

    startAnimationLoop();
  });

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    if (simulationWorker) {
      simulationWorker.terminate();
      simulationWorker = null;
    }
  });

  const startAnimationLoop = () => {
    const animate = (currentTime: number) => {
      if (lastTime === 0) {
        lastTime = currentTime;
      }
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      if (animationSystem && isSimulating() && simulationResult()) {
        const { droplets: newDroplets, particles: newParticles } = animationSystem.update(
          deltaTime,
          isSimulating()
        );
        
        setDroplets([...newDroplets]);
        setParticles([...newParticles]);
        
        if (newDroplets.length > totalDropletsGenerated()) {
          setTotalDropletsGenerated(newDroplets.length);
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
  };

  const handleTemplateChange = (newType: ChipTemplateType) => {
    setTemplateType(newType);
    const newTemplate = getTemplate(newType);
    setChipTemplate(newTemplate);
    setParameters({ ...newTemplate.defaultParameters });
    setSimulationResult(null);
    setSimulationProgress(0);
    setTotalDropletsGenerated(0);
    
    if (animationSystem) {
      animationSystem.reset();
      setDroplets([]);
      setParticles([]);
    }
  };

  const handleParametersChange = (newParams: Partial<SimulationParameters>) => {
    setParameters((prev) => {
      const updated = { ...prev, ...newParams };
      
      if (newParams.continuousPhaseFlowRate !== undefined || newParams.dispersedPhaseFlowRate !== undefined) {
        if (updated.dispersedPhaseFlowRate > 0) {
          updated.flowRateRatio = updated.continuousPhaseFlowRate / updated.dispersedPhaseFlowRate;
        }
      }
      
      return updated;
    });
  };

  const startSimulation = () => {
    if (!simulationWorker) return;
    
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const message: WorkerMessage = {
      type: 'start',
      channels: JSON.parse(JSON.stringify(chipTemplate().channels)),
      nodes: JSON.parse(JSON.stringify(chipTemplate().nodes)),
      parameters: { ...parameters() },
    };
    
    simulationWorker.postMessage(message);
  };

  const stopSimulation = () => {
    if (!simulationWorker) return;
    
    setIsSimulating(false);
    simulationWorker.postMessage({ type: 'stop' } as WorkerMessage);
  };

  const resetSimulation = () => {
    stopSimulation();
    setSimulationResult(null);
    setSimulationProgress(0);
    setTotalDropletsGenerated(0);
    
    if (animationSystem) {
      animationSystem.reset();
      setDroplets([]);
      setParticles([]);
    }
  };

  const handleExportDXF = () => {
    const template = chipTemplate();
    downloadDXF(template.channels, template.nodes, `${template.name}_design.dxf`);
  };

  const handleExportReport = () => {
    if (!simulationResult()) {
      alert('请先运行仿真以生成报告');
      return;
    }
    
    downloadReport(
      chipTemplate().name,
      parameters(),
      simulationResult()!,
      totalDropletsGenerated(),
      'txt'
    );
  };

  const handleSaveDesign = async () => {
    const designName = prompt('请输入设计名称:', `${chipTemplate().name}_${Date.now()}`);
    
    if (!designName) return;
    
    const savedDesign = await saveDesignToOPFS(
      designName,
      templateType(),
      parameters(),
      chipTemplate()
    );
    
    if (savedDesign) {
      alert(`设计已保存: ${designName}`);
    } else {
      alert('保存失败，请重试');
    }
  };

  return (
    <div class="h-screen w-screen flex flex-col bg-gray-50">
      <header class="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">Microfluidix</h1>
              <p class="text-xs text-gray-500">微流体芯片设计与液滴微流控可视化仿真器</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm">
              <span class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                isSimulating() 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <span class={`w-2 h-2 rounded-full ${
                  isSimulating() ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></span>
                {isSimulating() ? '仿真运行中' : '就绪'}
              </span>
            </div>
            
            <div class="h-8 w-px bg-gray-200"></div>
            
            <div class="text-right">
              <div class="text-sm font-medium text-gray-700">{chipTemplate().name}</div>
              <div class="text-xs text-gray-500">
                流速比: {parameters().flowRateRatio.toFixed(2)}:1
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden">
        <div class="flex-1 p-4">
          <CanvasView
            channels={chipTemplate().channels}
            nodes={chipTemplate().nodes}
            droplets={droplets()}
            particles={particles()}
            isSimulating={isSimulating()}
          />
        </div>

        <ControlPanel
          parameters={parameters()}
          templateType={templateType()}
          isSimulating={isSimulating()}
          simulationProgress={simulationProgress()}
          simulationResult={simulationResult()}
          onParametersChange={handleParametersChange}
          onTemplateChange={handleTemplateChange}
          onStartSimulation={startSimulation}
          onStopSimulation={stopSimulation}
          onReset={resetSimulation}
          onExportDXF={handleExportDXF}
          onExportReport={handleExportReport}
          onSaveDesign={handleSaveDesign}
        />
      </main>

      <footer class="bg-white border-t border-gray-200 px-6 py-2">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center gap-4">
            <span>通道数: {chipTemplate().channels.length}</span>
            <span>节点数: {chipTemplate().nodes.length}</span>
            <span>入口数: {chipTemplate().inlets.length}</span>
            <span>出口数: {chipTemplate().outlets.length}</span>
          </div>
          
          <div class="flex items-center gap-4">
            {simulationResult() && (
              <>
                <span>液滴尺寸: {simulationResult()!.dropletSize.toFixed(1)} μm</span>
                <span>液滴频率: {simulationResult()!.dropletFrequency.toFixed(2)} Hz</span>
              </>
            )}
            <span>已生成液滴: {totalDropletsGenerated()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
