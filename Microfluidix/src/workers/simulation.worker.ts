import { Channel, Node, SimulationParameters, SimulationResult } from '../types';

interface CircuitNode {
  id: string;
  pressure: number;
  isInlet: boolean;
  isOutlet: boolean;
  connections: string[];
}

interface CircuitChannel {
  id: string;
  resistance: number;
  startNode: string;
  endNode: string;
  flowRate: number;
}

const calculateResistance = (
  width: number,
  height: number,
  length: number,
  viscosity: number = 0.001
): number => {
  const aspectRatio = Math.min(width, height) / Math.max(width, height);
  const correctionFactor = 1 - 0.63 * (1 - aspectRatio);
  
  const h = Math.min(width, height);
  const w = Math.max(width, height);
  
  const resistance = (12 * viscosity * length * correctionFactor) / (w * h * h * h);
  return resistance;
};

const buildCircuit = (
  channels: Channel[],
  nodes: Node[],
  parameters: SimulationParameters
): { circuitNodes: CircuitNode[]; circuitChannels: CircuitChannel[] } => {
  const circuitNodes: CircuitNode[] = nodes.map((node, index) => ({
    id: node.id,
    pressure: index === 0 ? parameters.inletPressure : 0,
    isInlet: index === 0,
    isOutlet: index === nodes.length - 1,
    connections: node.connectedChannels,
  }));
  
  const circuitChannels: CircuitChannel[] = channels.map((channel) => {
    const resistance = calculateResistance(
      channel.width,
      channel.height,
      channel.length
    );
    
    return {
      id: channel.id,
      resistance,
      startNode: '',
      endNode: '',
      flowRate: 0,
    };
  });
  
  channels.forEach((channel, index) => {
    const startNode = nodes.find(
      (n) =>
        Math.abs(n.point.x - channel.startPoint.x) < 1 &&
        Math.abs(n.point.y - channel.startPoint.y) < 1
    );
    const endNode = nodes.find(
      (n) =>
        Math.abs(n.point.x - channel.endPoint.x) < 1 &&
        Math.abs(n.point.y - channel.endPoint.y) < 1
    );
    
    if (startNode) circuitChannels[index].startNode = startNode.id;
    if (endNode) circuitChannels[index].endNode = endNode.id;
  });
  
  return { circuitNodes, circuitChannels };
};

const solvePressureDistribution = (
  circuitNodes: CircuitNode[],
  circuitChannels: CircuitChannel[],
  parameters: SimulationParameters
): { nodePressures: Map<string, number>; channelFlowRates: Map<string, number> } => {
  const nodePressures = new Map<string, number>();
  const channelFlowRates = new Map<string, number>();
  
  const knownPressures = new Map<string, number>();
  const unknownNodes: string[] = [];
  
  circuitNodes.forEach((node) => {
    if (node.isInlet) {
      knownPressures.set(node.id, parameters.inletPressure);
      nodePressures.set(node.id, parameters.inletPressure);
    } else if (node.isOutlet) {
      knownPressures.set(node.id, parameters.outletPressure);
      nodePressures.set(node.id, parameters.outletPressure);
    } else {
      unknownNodes.push(node.id);
    }
  });
  
  const maxIterations = 1000;
  const tolerance = 1e-6;
  const initialPressure = (parameters.inletPressure + parameters.outletPressure) / 2;
  
  unknownNodes.forEach((nodeId) => {
    nodePressures.set(nodeId, initialPressure);
  });
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxChange = 0;
    
    for (const nodeId of unknownNodes) {
      const connectedChannels = circuitChannels.filter(
        (ch) => ch.startNode === nodeId || ch.endNode === nodeId
      );
      
      let sumConductance = 0;
      let sumPressureFlow = 0;
      
      for (const channel of connectedChannels) {
        const otherNodeId = channel.startNode === nodeId ? channel.endNode : channel.startNode;
        const conductance = 1 / channel.resistance;
        const otherPressure = nodePressures.get(otherNodeId) || 0;
        
        sumConductance += conductance;
        sumPressureFlow += conductance * otherPressure;
      }
      
      const newPressure = sumConductance > 0 ? sumPressureFlow / sumConductance : 0;
      const oldPressure = nodePressures.get(nodeId) || 0;
      const change = Math.abs(newPressure - oldPressure);
      
      if (change > maxChange) {
        maxChange = change;
      }
      
      nodePressures.set(nodeId, newPressure);
    }
    
    if (maxChange < tolerance) {
      break;
    }
  }
  
  for (const channel of circuitChannels) {
    const startPressure = nodePressures.get(channel.startNode) || 0;
    const endPressure = nodePressures.get(channel.endNode) || 0;
    const pressureDrop = startPressure - endPressure;
    const flowRate = pressureDrop / channel.resistance;
    
    channelFlowRates.set(channel.id, Math.abs(flowRate));
  }
  
  return { nodePressures, channelFlowRates };
};

const calculateDropletSize = (
  parameters: SimulationParameters
): { size: number; frequency: number; volume: number } => {
  const Qc = parameters.continuousPhaseFlowRate;
  const Qd = parameters.dispersedPhaseFlowRate;
  const flowRateRatio = parameters.flowRateRatio;
  const surfaceTension = parameters.surfaceTension;
  const channelWidth = parameters.channelWidth;
  const viscosityRatio = parameters.viscosityRatio;
  
  const capillaryNumber = (Qc / (channelWidth * parameters.channelHeight)) * 
    (0.001 * viscosityRatio) / surfaceTension;
  
  let dropletDiameter: number;
  
  if (capillaryNumber < 0.01) {
    dropletDiameter = channelWidth * (1 + 0.4 * Math.pow(flowRateRatio, 0.5));
  } else if (capillaryNumber < 0.1) {
    dropletDiameter = channelWidth * (1.2 + 0.3 * flowRateRatio);
  } else {
    dropletDiameter = channelWidth * (0.8 + 0.6 / Math.pow(capillaryNumber, 0.5));
  }
  
  const dropletVolume = (Math.PI * Math.pow(dropletDiameter, 3)) / 6;
  
  const frequency = Qd / dropletVolume;
  
  return {
    size: dropletDiameter,
    frequency: Math.max(frequency, 0.1),
    volume: dropletVolume,
  };
};

const calculateDimensionlessNumbers = (
  parameters: SimulationParameters,
  _result: { size: number; frequency: number; volume: number }
): { capillaryNumber: number; reynoldsNumber: number } => {
  const Qc = parameters.continuousPhaseFlowRate;
  const channelWidth = parameters.channelWidth;
  const channelHeight = parameters.channelHeight;
  const surfaceTension = parameters.surfaceTension;
  const viscosityRatio = parameters.viscosityRatio;
  
  const velocity = Qc / (channelWidth * channelHeight);
  const capillaryNumber = (velocity * 0.001 * viscosityRatio) / surfaceTension;
  
  const hydraulicDiameter = (2 * channelWidth * channelHeight) / (channelWidth + channelHeight);
  const density = 1000;
  const reynoldsNumber = (density * velocity * hydraulicDiameter) / (0.001 * viscosityRatio);
  
  return {
    capillaryNumber: Math.abs(capillaryNumber),
    reynoldsNumber: Math.abs(reynoldsNumber),
  };
};

interface WorkerMessage {
  type: 'start' | 'stop' | 'update';
  channels?: Channel[];
  nodes?: Node[];
  parameters?: SimulationParameters;
}

interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  result?: SimulationResult;
  progress?: number;
  error?: string;
}

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type, channels, nodes, parameters } = e.data;
  
  switch (type) {
    case 'start':
      if (channels && nodes && parameters) {
        runSimulation(channels, nodes, parameters);
      }
      break;
      
    case 'update':
      if (channels && nodes && parameters) {
        runSimulation(channels, nodes, parameters);
      }
      break;
      
    case 'stop':
      break;
  }
};

function runSimulation(channels: Channel[], nodes: Node[], parameters: SimulationParameters) {
  try {
    self.postMessage({ type: 'progress', progress: 10 } as WorkerResponse);
    
    const { circuitNodes, circuitChannels } = buildCircuit(channels, nodes, parameters);
    
    self.postMessage({ type: 'progress', progress: 30 } as WorkerResponse);
    
    const { nodePressures, channelFlowRates } = solvePressureDistribution(
      circuitNodes,
      circuitChannels,
      parameters
    );
    
    self.postMessage({ type: 'progress', progress: 60 } as WorkerResponse);
    
    const updatedChannels = channels.map((channel) => {
      const flowRate = channelFlowRates.get(channel.id) || 0;
      
      const startNode = nodes.find(
        (n) =>
          Math.abs(n.point.x - channel.startPoint.x) < 1 &&
          Math.abs(n.point.y - channel.startPoint.y) < 1
      );
      const endNode = nodes.find(
        (n) =>
          Math.abs(n.point.x - channel.endPoint.x) < 1 &&
          Math.abs(n.point.y - channel.endPoint.y) < 1
      );
      
      const startPressure = startNode ? (nodePressures.get(startNode.id) || 0) : 0;
      const endPressure = endNode ? (nodePressures.get(endNode.id) || 0) : 0;
      
      return {
        ...channel,
        flowRate,
        pressureDrop: Math.abs(startPressure - endPressure),
      };
    });
    
    const updatedNodes = nodes.map((node) => ({
      ...node,
      pressure: nodePressures.get(node.id) || 0,
    }));
    
    self.postMessage({ type: 'progress', progress: 80 } as WorkerResponse);
    
    const dropletInfo = calculateDropletSize(parameters);
    const dimensionlessNumbers = calculateDimensionlessNumbers(parameters, dropletInfo);
    
    const totalFlowRate = parameters.continuousPhaseFlowRate + parameters.dispersedPhaseFlowRate;
    
    const result: SimulationResult = {
      channels: updatedChannels,
      nodes: updatedNodes,
      totalFlowRate,
      pressureDistribution: updatedNodes.map((n) => n.pressure),
      flowRateDistribution: updatedChannels.map((c) => c.flowRate),
      dropletSize: dropletInfo.size,
      dropletFrequency: dropletInfo.frequency,
      dropletVolume: dropletInfo.volume,
      capillaryNumber: dimensionlessNumbers.capillaryNumber,
      reynoldsNumber: dimensionlessNumbers.reynoldsNumber,
    };
    
    self.postMessage({ type: 'progress', progress: 100 } as WorkerResponse);
    self.postMessage({ type: 'result', result } as WorkerResponse);
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
}

export {};
