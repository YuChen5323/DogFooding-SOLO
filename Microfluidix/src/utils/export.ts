import { Channel, Node, SimulationParameters, SimulationResult, SimulationReport } from '../types';

export const exportToDXF = (channels: Channel[], nodes: Node[], scale: number = 1): string => {
  const dxfLines: string[] = [];
  
  dxfLines.push('0');
  dxfLines.push('SECTION');
  dxfLines.push('2');
  dxfLines.push('HEADER');
  dxfLines.push('9');
  dxfLines.push('$ACADVER');
  dxfLines.push('1');
  dxfLines.push('AC1009');
  dxfLines.push('0');
  dxfLines.push('ENDSEC');
  
  dxfLines.push('0');
  dxfLines.push('SECTION');
  dxfLines.push('2');
  dxfLines.push('TABLES');
  dxfLines.push('0');
  dxfLines.push('TABLE');
  dxfLines.push('2');
  dxfLines.push('LAYER');
  dxfLines.push('70');
  dxfLines.push('3');
  
  dxfLines.push('0');
  dxfLines.push('LAYER');
  dxfLines.push('2');
  dxfLines.push('CHANNELS');
  dxfLines.push('70');
  dxfLines.push('0');
  dxfLines.push('62');
  dxfLines.push('5');
  dxfLines.push('6');
  dxfLines.push('CONTINUOUS');
  
  dxfLines.push('0');
  dxfLines.push('LAYER');
  dxfLines.push('2');
  dxfLines.push('JUNCTIONS');
  dxfLines.push('70');
  dxfLines.push('0');
  dxfLines.push('62');
  dxfLines.push('3');
  dxfLines.push('6');
  dxfLines.push('CONTINUOUS');
  
  dxfLines.push('0');
  dxfLines.push('ENDTAB');
  dxfLines.push('0');
  dxfLines.push('ENDSEC');
  
  dxfLines.push('0');
  dxfLines.push('SECTION');
  dxfLines.push('2');
  dxfLines.push('ENTITIES');
  
  for (const channel of channels) {
    const halfWidth = channel.width / 2;
    const dx = channel.endPoint.x - channel.startPoint.x;
    const dy = channel.endPoint.y - channel.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const nx = -dy / length;
    const ny = dx / length;
    
    const p1x = channel.startPoint.x + nx * halfWidth;
    const p1y = channel.startPoint.y + ny * halfWidth;
    const p2x = channel.startPoint.x - nx * halfWidth;
    const p2y = channel.startPoint.y - ny * halfWidth;
    const p3x = channel.endPoint.x - nx * halfWidth;
    const p3y = channel.endPoint.y - ny * halfWidth;
    const p4x = channel.endPoint.x + nx * halfWidth;
    const p4y = channel.endPoint.y + ny * halfWidth;
    
    dxfLines.push('0');
    dxfLines.push('LWPolyline');
    dxfLines.push('8');
    dxfLines.push('CHANNELS');
    dxfLines.push('90');
    dxfLines.push('5');
    dxfLines.push('70');
    dxfLines.push('1');
    dxfLines.push('40');
    dxfLines.push('0');
    
    dxfLines.push('10');
    dxfLines.push((p1x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((p1y * scale).toFixed(6));
    
    dxfLines.push('10');
    dxfLines.push((p2x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((p2y * scale).toFixed(6));
    
    dxfLines.push('10');
    dxfLines.push((p3x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((p3y * scale).toFixed(6));
    
    dxfLines.push('10');
    dxfLines.push((p4x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((p4y * scale).toFixed(6));
    
    dxfLines.push('10');
    dxfLines.push((p1x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((p1y * scale).toFixed(6));
  }
  
  for (const node of nodes) {
    const radius = 20;
    
    dxfLines.push('0');
    dxfLines.push('CIRCLE');
    dxfLines.push('8');
    dxfLines.push('JUNCTIONS');
    dxfLines.push('10');
    dxfLines.push((node.point.x * scale).toFixed(6));
    dxfLines.push('20');
    dxfLines.push((node.point.y * scale).toFixed(6));
    dxfLines.push('30');
    dxfLines.push('0.0');
    dxfLines.push('40');
    dxfLines.push((radius * scale).toFixed(6));
  }
  
  dxfLines.push('0');
  dxfLines.push('ENDSEC');
  dxfLines.push('0');
  dxfLines.push('EOF');
  
  return dxfLines.join('\n');
};

export const generateSimulationReport = (
  designName: string,
  parameters: SimulationParameters,
  result: SimulationResult,
  dropletsGenerated: number
): SimulationReport => {
  const now = new Date();
  const timestamp = now.toISOString();
  
  return {
    designName,
    timestamp,
    parameters: { ...parameters },
    result: { ...result },
    dropletsGenerated,
    averageDropletSize: result.dropletSize,
    averageDropletFrequency: result.dropletFrequency,
    visualizationPath: '',
  };
};

export const exportReportAsJSON = (report: SimulationReport): string => {
  return JSON.stringify(report, null, 2);
};

export const exportReportAsText = (report: SimulationReport): string => {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('微流体芯片仿真报告');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`设计名称: ${report.designName}`);
  lines.push(`生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}`);
  lines.push('');
  
  lines.push('-'.repeat(60));
  lines.push('仿真参数');
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push(`通道宽度: ${report.parameters.channelWidth} μm`);
  lines.push(`通道高度: ${report.parameters.channelHeight} μm`);
  lines.push(`连续相流速: ${report.parameters.continuousPhaseFlowRate} μL/min`);
  lines.push(`分散相流速: ${report.parameters.dispersedPhaseFlowRate} μL/min`);
  lines.push(`流速比: ${report.parameters.flowRateRatio.toFixed(2)}:1`);
  lines.push(`入口压力: ${report.parameters.inletPressure} Pa`);
  lines.push(`出口压力: ${report.parameters.outletPressure} Pa`);
  lines.push(`黏度比: ${report.parameters.viscosityRatio}`);
  lines.push(`表面张力: ${report.parameters.surfaceTension} N/m`);
  lines.push('');
  
  lines.push('-'.repeat(60));
  lines.push('仿真结果');
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push(`液滴直径: ${report.result.dropletSize.toFixed(2)} μm`);
  lines.push(`液滴频率: ${report.result.dropletFrequency.toFixed(2)} Hz`);
  lines.push(`液滴体积: ${report.result.dropletVolume.toFixed(2)} pL`);
  lines.push(`总流量: ${report.result.totalFlowRate.toFixed(2)} μL/min`);
  lines.push('');
  
  lines.push('-'.repeat(60));
  lines.push('无量纲数');
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push(`毛细管数 (Ca): ${report.result.capillaryNumber.toExponential(4)}`);
  lines.push(`雷诺数 (Re): ${report.result.reynoldsNumber.toExponential(4)}`);
  lines.push('');
  
  lines.push('-'.repeat(60));
  lines.push('统计信息');
  lines.push('-'.repeat(60));
  lines.push('');
  lines.push(`生成液滴总数: ${report.dropletsGenerated}`);
  lines.push(`平均液滴尺寸: ${report.averageDropletSize.toFixed(2)} μm`);
  lines.push(`平均液滴频率: ${report.averageDropletFrequency.toFixed(2)} Hz`);
  lines.push('');
  
  lines.push('='.repeat(60));
  lines.push('报告结束');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadDXF = (channels: Channel[], nodes: Node[], filename: string = 'chip_design.dxf'): void => {
  const dxfContent = exportToDXF(channels, nodes);
  downloadFile(dxfContent, filename, 'application/dxf');
};

export const downloadReport = (
  designName: string,
  parameters: SimulationParameters,
  result: SimulationResult,
  dropletsGenerated: number,
  format: 'json' | 'txt' = 'txt'
): void => {
  const report = generateSimulationReport(designName, parameters, result, dropletsGenerated);
  const content = format === 'json' ? exportReportAsJSON(report) : exportReportAsText(report);
  const filename = format === 'json' ? 'simulation_report.json' : 'simulation_report.txt';
  const mimeType = format === 'json' ? 'application/json' : 'text/plain';
  
  downloadFile(content, filename, mimeType);
};
