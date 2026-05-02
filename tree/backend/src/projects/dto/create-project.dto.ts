import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TimberGrade } from '../../components/entities/component.entity';

class PositionDto {
  @IsOptional()
  x?: number;

  @IsOptional()
  y?: number;

  @IsOptional()
  z?: number;
}

class ComponentPlacementDto {
  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  rotation?: PositionDto;

  @IsOptional()
  customDimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['一等材', '二等材', '三等材', '四等材', '五等材', '六等材', '七等材', '八等材'])
  timberGrade?: TimberGrade;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentPlacementDto)
  components?: ComponentPlacementDto[];

  @IsOptional()
  @IsObject()
  settings?: {
    showGrid?: boolean;
    showLabels?: boolean;
    showDimensions?: boolean;
    scale?: number;
  };
}
