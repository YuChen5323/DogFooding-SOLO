import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ComponentCategory, TimberGrade } from '../entities/component.entity';

class DimensionsDto {
  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;

  @IsOptional()
  depth?: number;
}

class CaiFenRequirementsDto {
  @IsEnum(['一等材', '二等材', '三等材', '四等材', '五等材', '六等材', '七等材', '八等材'])
  grade: TimberGrade;

  @IsOptional()
  widthFen?: number;

  @IsOptional()
  heightFen?: number;

  @IsOptional()
  depthFen?: number;
}

export class CreateComponentDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  chineseName: string;

  @IsEnum(['column', 'beam', 'bracket', 'other'])
  category: ComponentCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  defaultDimensions?: DimensionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CaiFenRequirementsDto)
  caiFenRequirements?: CaiFenRequirementsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleMortises?: string[];

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}
