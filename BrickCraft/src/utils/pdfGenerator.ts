import { jsPDF } from 'jspdf';
import { LDrawModelInstance } from '../types/ldraw';
import { BuildStep } from '../types/app';
import { getLDrawColor, getLDrawColorHex } from './ldrawColors';
import { CommonParts } from './ldrawParser';

/**
 * 乐高说明书PDF生成器
 */
export class InstructionPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
  }

  /**
   * 生成完整的说明书PDF
   */
  generate(
    projectName: string,
    parts: LDrawModelInstance[],
    steps?: BuildStep[]
  ): jsPDF {
    // 封面
    this.addCoverPage(projectName, parts);
    
    // 零件清单
    this.addPartsListPage(parts);
    
    // 拼装步骤
    if (steps && steps.length > 0) {
      this.addStepsPages(steps);
    } else {
      // 如果没有步骤，生成简化版
      this.addSimpleStepsPage(parts);
    }
    
    // 页脚
    this.addFooters();
    
    return this.doc;
  }

  /**
   * 添加封面页
   */
  private addCoverPage(projectName: string, parts: LDrawModelInstance[]): void {
    // 背景 - 乐高黄
    this.doc.setFillColor(255, 219, 0);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // 标题区域背景 - 乐高红
    this.doc.setFillColor(227, 0, 11);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    // 主标题
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(36);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('BrickCraft', this.pageWidth / 2, 25, { align: 'center' });
    
    // 项目名称
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(projectName, this.pageWidth / 2, 70, { align: 'center' });
    
    // 乐高风格装饰
    this.drawLegoBrickDecorations();
    
    // 零件数量
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.setTextColor(89, 89, 89);
    this.doc.text(
      `包含 ${parts.length} 个零件`,
      this.pageWidth / 2,
      this.pageHeight - 60,
      { align: 'center' }
    );
    
    // 生成日期
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.doc.setFontSize(12);
    this.doc.text(
      `生成日期: ${date}`,
      this.pageWidth / 2,
      this.pageHeight - 45,
      { align: 'center' }
    );
  }

  /**
   * 绘制乐高砖块装饰
   */
  private drawLegoBrickDecorations(): void {
    const startY = 100;
    const brickWidth = 40;
    const brickHeight = 30;
    
    // 绘制一排砖块
    const colors = [
      [227, 0, 11],   // 红
      [0, 109, 183],  // 蓝
      [0, 158, 61],   // 绿
      [240, 125, 19], // 橙
      [227, 0, 11],   // 红
    ];
    
    for (let i = 0; i < 5; i++) {
      const x = this.margin + i * (brickWidth + 5);
      const y = startY;
      
      // 砖块主体
      this.doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
      this.doc.rect(x, y, brickWidth, brickHeight, 'F');
      
      // 阴影效果
      this.doc.setFillColor(0, 0, 0, 0.2);
      this.doc.rect(x + brickWidth - 3, y, 3, brickHeight, 'F');
      this.doc.rect(x, y + brickHeight - 3, brickWidth, 3, 'F');
      
      // 高光
      this.doc.setFillColor(255, 255, 255, 0.3);
      this.doc.rect(x, y, 3, brickHeight - 3, 'F');
      this.doc.rect(x, y, brickWidth - 3, 3, 'F');
      
      // 凸点
      const studRadius = 5;
      const studsPerRow = 4;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < studsPerRow; col++) {
          const studX = x + 5 + col * (brickWidth - 10) / (studsPerRow - 1);
          const studY = y + 8 + row * 14;
          
          this.doc.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
          this.doc.circle(studX, studY, studRadius, 'F');
          
          // 凸点高光
          this.doc.setFillColor(255, 255, 255, 0.4);
          this.doc.circle(studX - 1.5, studY - 1.5, studRadius * 0.5, 'F');
        }
      }
    }
  }

  /**
   * 添加零件清单页
   */
  private addPartsListPage(parts: LDrawModelInstance[]): void {
    this.doc.addPage();
    
    // 标题
    this.doc.setFillColor(227, 0, 11);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('零件清单', this.margin, 17);
    
    // 按零件ID和颜色分组统计
    const partCounts: Record<string, { 
      partId: string; 
      color: number; 
      count: number;
      name: string;
    }> = {};
    
    parts.forEach((part) => {
      const key = `${part.partId}_${part.color}`;
      if (!partCounts[key]) {
        const partData = CommonParts[part.partId];
        partCounts[key] = {
          partId: part.partId,
          color: part.color,
          count: 0,
          name: partData?.name || part.partId,
        };
      }
      partCounts[key].count++;
    });
    
    // 绘制表格
    const tableStartY = 35;
    const rowHeight = 12;
    let currentY = tableStartY;
    
    // 表头
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    
    const colWidths = {
      count: 15,
      color: 20,
      partId: 30,
      name: 110,
    };
    
    let colX = this.margin;
    this.doc.text('数量', colX, currentY);
    colX += colWidths.count;
    
    this.doc.text('颜色', colX, currentY);
    colX += colWidths.color;
    
    this.doc.text('零件ID', colX, currentY);
    colX += colWidths.partId;
    
    this.doc.text('名称', colX, currentY);
    
    currentY += rowHeight;
    
    // 分隔线
    this.doc.setDrawColor(169, 169, 169);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, currentY - 5, this.pageWidth - this.margin, currentY - 5);
    
    // 数据行
    this.doc.setFont('helvetica', 'normal');
    
    Object.values(partCounts).forEach((item, index) => {
      // 检查是否需要换页
      if (currentY > this.pageHeight - this.margin - 20) {
        this.doc.addPage();
        currentY = this.margin + 10;
      }
      
      const color = getLDrawColor(item.color);
      
      let colX = this.margin;
      
      // 数量
      this.doc.text(item.count.toString(), colX, currentY);
      colX += colWidths.count;
      
      // 颜色方块
      this.doc.setFillColor(color.hex.substring(1));
      this.doc.rect(colX - 2, currentY - 6, 10, 8, 'F');
      this.doc.setDrawColor(89, 89, 89);
      this.doc.rect(colX - 2, currentY - 6, 10, 8, 'S');
      
      colX += colWidths.color;
      
      // 零件ID
      this.doc.text(item.partId, colX, currentY);
      colX += colWidths.partId;
      
      // 名称
      this.doc.text(item.name, colX, currentY);
      
      currentY += rowHeight;
    });
    
    // 汇总
    currentY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(227, 0, 11);
    this.doc.text(
      `总计: ${parts.length} 个零件`,
      this.margin,
      currentY
    );
  }

  /**
   * 添加拼装步骤页面
   */
  private addStepsPages(steps: BuildStep[]): void {
    steps.forEach((step, index) => {
      this.doc.addPage();
      
      // 标题
      this.doc.setFillColor(0, 109, 183);
      this.doc.rect(0, 0, this.pageWidth, 25, 'F');
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(18);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(`步骤 ${step.stepNumber}`, this.margin, 17);
      
      if (step.description) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
        this.doc.text(step.description, this.pageWidth - this.margin, 17, { align: 'right' });
      }
      
      // 步骤示意图区域 (简化版本)
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(this.margin, 35, this.pageWidth - 2 * this.margin, 100, 'F');
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.setTextColor(89, 89, 89);
      this.doc.text(
        '步骤示意图 (3D渲染)',
        this.pageWidth / 2,
        85,
        { align: 'center' }
      );
      
      // 本步骤零件列表
      const listStartY = 145;
      let currentY = listStartY;
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text('本步骤添加的零件:', this.margin, currentY);
      
      currentY += 15;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      
      step.parts.forEach((part, i) => {
        const color = getLDrawColor(part.color);
        const partData = CommonParts[part.partId];
        
        this.doc.text(
          `${i + 1}. ${part.partId} - ${partData?.name || '零件'} (${color.name})`,
          this.margin + 5,
          currentY
        );
        currentY += 8;
      });
      
      // 位置信息
      currentY += 5;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        `位置: (${step.parts.map(p => `(${p.position.join(', ')})`).join(', ')})`,
        this.margin + 5,
        currentY
      );
    });
  }

  /**
   * 添加简化版步骤页面
   */
  private addSimpleStepsPage(parts: LDrawModelInstance[]): void {
    this.doc.addPage();
    
    // 标题
    this.doc.setFillColor(0, 109, 183);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('拼装说明', this.margin, 17);
    
    // 说明文字
    const currentY = 40;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    
    const instructions = [
      '1. 按照从下到上的顺序拼装',
      '2. 确保每个零件都稳固地连接',
      '3. 参考零件颜色确保使用正确的零件',
      '4. 按压零件直到听到"咔嗒"声',
    ];
    
    instructions.forEach((inst, i) => {
      this.doc.text(inst, this.margin, currentY + i * 10);
    });
    
    // 所有零件列表
    const listStartY = currentY + 60;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('所有零件:', this.margin, listStartY);
    
    let currentY2 = listStartY + 15;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    parts.forEach((part, i) => {
      const color = getLDrawColor(part.color);
      const partData = CommonParts[part.partId];
      
      this.doc.text(
        `${i + 1}. ${part.partId} - ${partData?.name || '零件'} (${color.name})`,
        this.margin,
        currentY2
      );
      currentY2 += 7;
    });
  }

  /**
   * 添加页脚
   */
  private addFooters(): void {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // 页脚文字
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      this.doc.setTextColor(128, 128, 128);
      
      this.doc.text(
        `BrickCraft - 乐高搭建说明书`,
        this.margin,
        this.pageHeight - 10
      );
      
      this.doc.text(
        `第 ${i} 页 / 共 ${pageCount} 页`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
      
      // 底部装饰线 (乐高红)
      this.doc.setDrawColor(227, 0, 11);
      this.doc.setLineWidth(3);
      this.doc.line(0, this.pageHeight, this.pageWidth, this.pageHeight);
    }
  }

  /**
   * 保存PDF
   */
  save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * 获取PDF blob
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }
}

/**
 * 生成拼装步骤 (拓扑排序)
 * 基于零件的位置关系确定拼装顺序
 */
export function generateBuildSteps(parts: LDrawModelInstance[]): BuildStep[] {
  if (parts.length === 0) return [];
  
  // 按Y坐标分组 (从下到上)
  const partsByY = new Map<number, LDrawModelInstance[]>();
  
  parts.forEach((part) => {
    const y = Math.round(part.position[1] * 10) / 10; // 保留一位小数
    if (!partsByY.has(y)) {
      partsByY.set(y, []);
    }
    partsByY.get(y)!.push(part);
  });
  
  // 按Y坐标排序
  const sortedYs = Array.from(partsByY.keys()).sort((a, b) => a - b);
  
  // 生成步骤
  const steps: BuildStep[] = [];
  let stepNumber = 1;
  
  sortedYs.forEach((y) => {
    const layerParts = partsByY.get(y)!;
    
    // 每层可以分成多个步骤 (如果零件太多)
    const partsPerStep = 4;
    for (let i = 0; i < layerParts.length; i += partsPerStep) {
      const stepParts = layerParts.slice(i, i + partsPerStep);
      steps.push({
        stepNumber,
        parts: stepParts,
        description: `高度层: ${y}`,
      });
      stepNumber++;
    }
  });
  
  return steps;
}

export default InstructionPDFGenerator;
