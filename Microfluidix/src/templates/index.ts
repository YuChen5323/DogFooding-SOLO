import { ChipTemplate, ChipTemplateType, Channel, Node, Point, FlowDirection, FluidType, SimulationParameters } from '../types';

const DEFAULT_CHANNEL_WIDTH = 100;
const DEFAULT_CHANNEL_HEIGHT = 50;
const DEFAULT_INLET_PRESSURE = 100000;
const DEFAULT_OUTLET_PRESSURE = 0;

const createChannel = (
  id: string,
  name: string,
  startPoint: Point,
  endPoint: Point,
  width: number,
  height: number,
  fluidType: FluidType,
  flowDirection: FlowDirection
): Channel => {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  const resistance = (12 * length) / (width * height * height * height);
  
  return {
    id,
    name,
    startPoint,
    endPoint,
    width,
    height,
    length,
    resistance,
    flowRate: 0,
    pressureDrop: 0,
    fluidType,
    flowDirection,
  };
};

const createNode = (id: string, point: Point, connectedChannels: string[]): Node => ({
  id,
  point,
  connectedChannels,
  pressure: 0,
});

const getDefaultParameters = (): SimulationParameters => ({
  channelWidth: DEFAULT_CHANNEL_WIDTH,
  channelHeight: DEFAULT_CHANNEL_HEIGHT,
  continuousPhaseFlowRate: 10,
  dispersedPhaseFlowRate: 5,
  flowRateRatio: 2,
  inletPressure: DEFAULT_INLET_PRESSURE,
  outletPressure: DEFAULT_OUTLET_PRESSURE,
  viscosityRatio: 1,
  surfaceTension: 0.072,
});

export const createTJunctionsTemplate = (): ChipTemplate => {
  const centerX = 400;
  const centerY = 300;
  const channelLength = 150;
  const width = DEFAULT_CHANNEL_WIDTH;
  const height = DEFAULT_CHANNEL_HEIGHT;
  
  const inlet1Start: Point = { x: centerX - channelLength - 50, y: centerY };
  const inlet1End: Point = { x: centerX, y: centerY };
  
  const inlet2Start: Point = { x: centerX, y: centerY - channelLength - 50 };
  const inlet2End: Point = { x: centerX, y: centerY };
  
  const outletStart: Point = { x: centerX, y: centerY };
  const outletEnd: Point = { x: centerX + channelLength + 50, y: centerY };
  
  const channels: Channel[] = [
    createChannel('inlet1', '连续相入口', inlet1Start, inlet1End, width, height, FluidType.OIL, FlowDirection.INLET),
    createChannel('inlet2', '分散相入口', inlet2Start, inlet2End, width, height, FluidType.WATER, FlowDirection.INLET),
    createChannel('outlet', '出口', outletStart, outletEnd, width, height, FluidType.WATER, FlowDirection.OUTLET),
  ];
  
  const nodes: Node[] = [
    createNode('junction', { x: centerX, y: centerY }, ['inlet1', 'inlet2', 'outlet']),
  ];
  
  return {
    type: ChipTemplateType.T_JUNCTION,
    name: 'T型结芯片',
    description: '经典的T型结液滴发生器，通过流体剪切产生液滴',
    channels,
    nodes,
    inlets: [inlet1Start, inlet2Start],
    outlets: [outletEnd],
    defaultParameters: getDefaultParameters(),
  };
};

export const createCrossFocusingTemplate = (): ChipTemplate => {
  const centerX = 400;
  const centerY = 300;
  const channelLength = 120;
  const width = DEFAULT_CHANNEL_WIDTH;
  const height = DEFAULT_CHANNEL_HEIGHT;
  
  const inletDispersedStart: Point = { x: centerX - channelLength - 50, y: centerY };
  const inletDispersedEnd: Point = { x: centerX, y: centerY };
  
  const inletContinuous1Start: Point = { x: centerX, y: centerY - channelLength - 50 };
  const inletContinuous1End: Point = { x: centerX, y: centerY };
  
  const inletContinuous2Start: Point = { x: centerX, y: centerY + channelLength + 50 };
  const inletContinuous2End: Point = { x: centerX, y: centerY };
  
  const outletStart: Point = { x: centerX, y: centerY };
  const outletEnd: Point = { x: centerX + channelLength + 50, y: centerY };
  
  const channels: Channel[] = [
    createChannel('dispersed', '分散相入口', inletDispersedStart, inletDispersedEnd, width, height, FluidType.WATER, FlowDirection.INLET),
    createChannel('continuous1', '连续相入口1', inletContinuous1Start, inletContinuous1End, width, height, FluidType.OIL, FlowDirection.INLET),
    createChannel('continuous2', '连续相入口2', inletContinuous2Start, inletContinuous2End, width, height, FluidType.OIL, FlowDirection.INLET),
    createChannel('outlet', '出口', outletStart, outletEnd, width, height, FluidType.WATER, FlowDirection.OUTLET),
  ];
  
  const nodes: Node[] = [
    createNode('junction', { x: centerX, y: centerY }, ['dispersed', 'continuous1', 'continuous2', 'outlet']),
  ];
  
  return {
    type: ChipTemplateType.CROSS_FOCUSING,
    name: '十字聚焦芯片',
    description: '十字聚焦液滴发生器，从三个方向汇聚流体产生单分散液滴',
    channels,
    nodes,
    inlets: [inletDispersedStart, inletContinuous1Start, inletContinuous2Start],
    outlets: [outletEnd],
    defaultParameters: {
      ...getDefaultParameters(),
      continuousPhaseFlowRate: 15,
      dispersedPhaseFlowRate: 3,
      flowRateRatio: 5,
    },
  };
};

export const createDropletGeneratorTemplate = (): ChipTemplate => {
  const centerX = 400;
  const centerY = 300;
  const channelLength = 100;
  const width = DEFAULT_CHANNEL_WIDTH;
  const height = DEFAULT_CHANNEL_HEIGHT;
  const narrowWidth = 40;
  
  const inletOilStart: Point = { x: centerX - channelLength * 2, y: centerY };
  const inletOilEnd1: Point = { x: centerX - channelLength, y: centerY };
  const inletOilEnd2: Point = { x: centerX, y: centerY };
  
  const inletWaterStart: Point = { x: centerX - channelLength, y: centerY - channelLength - 50 };
  const inletWaterEnd: Point = { x: centerX - channelLength, y: centerY };
  
  const narrowStart: Point = { x: centerX, y: centerY };
  const narrowEnd: Point = { x: centerX + channelLength, y: centerY };
  
  const outletStart: Point = { x: centerX + channelLength, y: centerY };
  const outletEnd: Point = { x: centerX + channelLength * 2 + 50, y: centerY };
  
  const channels: Channel[] = [
    createChannel('oil_main', '连续相主通道', inletOilStart, inletOilEnd1, width, height, FluidType.OIL, FlowDirection.INLET),
    createChannel('oil_focus', '连续相聚焦', inletOilEnd1, inletOilEnd2, width, height, FluidType.OIL, FlowDirection.INLET),
    createChannel('water_inlet', '分散相入口', inletWaterStart, inletWaterEnd, width, height, FluidType.WATER, FlowDirection.INLET),
    createChannel('narrow', '缩颈通道', narrowStart, narrowEnd, narrowWidth, height, FluidType.WATER, FlowDirection.BOTH),
    createChannel('outlet', '出口通道', outletStart, outletEnd, width, height, FluidType.WATER, FlowDirection.OUTLET),
  ];
  
  const nodes: Node[] = [
    createNode('t_junction', inletOilEnd1, ['oil_main', 'water_inlet', 'oil_focus']),
    createNode('narrow_entry', narrowStart, ['oil_focus', 'narrow']),
    createNode('narrow_exit', outletStart, ['narrow', 'outlet']),
  ];
  
  return {
    type: ChipTemplateType.DROPLET_GENERATOR,
    name: '高效液滴发生器',
    description: '带缩颈结构的高效液滴发生器，结合T型结和流体聚焦',
    channels,
    nodes,
    inlets: [inletOilStart, inletWaterStart],
    outlets: [outletEnd],
    defaultParameters: {
      ...getDefaultParameters(),
      continuousPhaseFlowRate: 20,
      dispersedPhaseFlowRate: 4,
      flowRateRatio: 5,
      surfaceTension: 0.05,
    },
  };
};

export const chipTemplates: Record<ChipTemplateType, () => ChipTemplate> = {
  [ChipTemplateType.T_JUNCTION]: createTJunctionsTemplate,
  [ChipTemplateType.CROSS_FOCUSING]: createCrossFocusingTemplate,
  [ChipTemplateType.DROPLET_GENERATOR]: createDropletGeneratorTemplate,
};

export const getTemplate = (type: ChipTemplateType): ChipTemplate => {
  const creator = chipTemplates[type];
  return creator ? creator() : createTJunctionsTemplate();
};
