import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EarthquakeService } from './earthquake.service';

@Controller('earthquake')
export class EarthquakeController {
  constructor(private readonly earthquakeService: EarthquakeService) {}

  @Get('waves')
  async getAvailableWaves() {
    return this.earthquakeService.getAvailableWaves();
  }

  @Get('waves/:id')
  async getWaveData(@Param('id') id: string) {
    return this.earthquakeService.getWaveData(id);
  }

  @Post('simulate')
  async runSimulation(
    @Body()
    params: {
      waveId: string;
      magnitude: number;
      components: any[];
      joints: any[];
    },
  ) {
    return this.earthquakeService.runSimulation(params);
  }
}
