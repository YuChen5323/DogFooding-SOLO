import { Module } from '@nestjs/common';
import { EarthquakeController } from './earthquake.controller';
import { EarthquakeService } from './earthquake.service';

@Module({
  controllers: [EarthquakeController],
  providers: [EarthquakeService],
  exports: [EarthquakeService],
})
export class EarthquakeModule {}
