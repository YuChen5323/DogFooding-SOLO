import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('stress')
  async calculateStress(
    @Body()
    params: {
      components: Array<{
        id: string;
        dimensions: { width: number; height: number; depth: number };
        material: string;
      }>;
      joints: Array<{
        id: string;
        componentA: string;
        componentB: string;
        type: string;
      }>;
      load: { x: number; y: number; z: number };
    },
  ) {
    return this.analysisService.calculateStress(params);
  }
}
