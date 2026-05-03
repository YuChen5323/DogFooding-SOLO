export interface Point {
  x: number;
  y: number;
}

export interface Channel {
  id: string;
  name: string;
  startPoint: Point;
  endPoint: Point;
  width: number;
  height: number;
  length: number;
  resistance: number;
  flowRate: number;
  pressureDrop: number;
  fluidType: FluidType;
  flowDirection: FlowDirection;
}

export interface Node {
  id: string;
  point: Point;
  connectedChannels: string[];
  pressure: number;
}

export enum FluidType {
  WATER = 'water',
  OIL = 'oil',
  AQUEOUS = 'aqueous',
  ORGANIC = 'organic',
}

export enum FlowDirection {
  INLET = 'inlet',
  OUTLET = 'outlet',
  BOTH = 'both',
}

export enum ChipTemplateType {
  T_JUNCTION = 't_junction',
  CROSS_FOCUSING = 'cross_focusing',
  DROPLET_GENERATOR = 'droplet_generator',
}

export interface FluidProperties {
  viscosity: number;
  density: number;
  surfaceTension: number;
  color: string;
}

export interface SimulationParameters {
  channelWidth: number;
  channelHeight: number;
  continuousPhaseFlowRate: number;
  dispersedPhaseFlowRate: number;
  flowRateRatio: number;
  inletPressure: number;
  outletPressure: number;
  viscosityRatio: number;
  surfaceTension: number;
}

export interface SimulationResult {
  channels: Channel[];
  nodes: Node[];
  totalFlowRate: number;
  pressureDistribution: number[];
  flowRateDistribution: number[];
  dropletSize: number;
  dropletFrequency: number;
  dropletVolume: number;
  capillaryNumber: number;
  reynoldsNumber: number;
}

export interface Droplet {
  id: number;
  position: Point;
  velocity: Point;
  radius: number;
  volume: number;
  color: string;
  channelId: string;
  distanceAlongChannel: number;
  isEncapsulated: boolean;
  encapsulatedDroplets?: Droplet[];
}

export interface Particle {
  id: number;
  position: Point;
  velocity: Point;
  size: number;
  color: string;
  phase: FluidType;
}

export interface ChipTemplate {
  type: ChipTemplateType;
  name: string;
  description: string;
  channels: Channel[];
  nodes: Node[];
  inlets: Point[];
  outlets: Point[];
  defaultParameters: SimulationParameters;
}

export interface SavedDesign {
  id: string;
  name: string;
  templateType: ChipTemplateType;
  parameters: SimulationParameters;
  createdAt: number;
  updatedAt: number;
  chipData: ChipTemplate;
}

export interface SimulationReport {
  designName: string;
  timestamp: string;
  parameters: SimulationParameters;
  result: SimulationResult;
  dropletsGenerated: number;
  averageDropletSize: number;
  averageDropletFrequency: number;
  visualizationPath: string;
}
