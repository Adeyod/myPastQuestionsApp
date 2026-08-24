import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TextStyle } from '../../../common/enums/question-type.enum';

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  EQUATION = 'equation',
  TABLE = 'table',
  GRAPH = 'graph',
  LIST = 'list',
}

/* ------------------ Nested DTOs ------------------ */

class TextSegmentDto {
  @ApiProperty({ example: 'Hello world' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({
    enum: TextStyle,
    isArray: true,
    example: [TextStyle.BOLD],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TextStyle, { each: true })
  styles?: TextStyle[];
}

class GraphDatasetDto {
  @ApiProperty({ example: 'Sales' })
  @IsString()
  label!: string;

  @ApiProperty({ example: [10, 20, 30] })
  @IsArray()
  @IsNumber({}, { each: true })
  data!: number[];
}

class GraphDto {
  @ApiProperty({
    example: 'line',
    description: 'Type of chart',
  })
  @IsString()
  type!: 'line' | 'bar' | 'pie';

  @ApiProperty({ example: ['Jan', 'Feb'] })
  @IsArray()
  @IsString({ each: true })
  labels!: string[];

  @ApiProperty({ type: [GraphDatasetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphDatasetDto)
  datasets!: GraphDatasetDto[];
}

/* ------------------ Main DTO ------------------ */

export class ContentBlockDto {
  @ApiProperty({
    enum: ContentType,
    example: ContentType.TEXT,
  })
  @IsEnum(ContentType)
  type!: ContentType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order!: number;

  /* -------- TEXT -------- */

  @ApiPropertyOptional({
    example: 'What is x?',
  })
  @ValidateIf((o) => o.type === ContentType.TEXT)
  @IsString()
  text?: string;

  @ApiPropertyOptional({ type: [TextSegmentDto] })
  @ValidateIf((o) => o.type === ContentType.TEXT)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextSegmentDto)
  segments?: TextSegmentDto[];

  /* -------- IMAGE -------- */

  @ApiPropertyOptional({
    example: 'https://example.com/image.png',
  })
  @ValidateIf((o) => o.type === ContentType.IMAGE)
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 'An example image',
  })
  @ValidateIf((o) => o.type === ContentType.IMAGE)
  @IsString()
  @IsOptional()
  alt?: string;

  /* -------- EQUATION -------- */

  @ApiPropertyOptional({
    example: '\\frac{a}{b}',
  })
  @ValidateIf((o) => o.type === ContentType.EQUATION)
  @IsString()
  latex?: string;

  /* -------- TABLE -------- */

  @ApiPropertyOptional({
    example: [
      ['Year', 'Population'],
      ['2020', '1M'],
    ],
  })
  @ValidateIf((o) => o.type === ContentType.TABLE)
  @IsArray()
  @IsArray({ each: true })
  @IsString({ each: true })
  table?: string[][];

  /* -------- GRAPH -------- */

  @ApiPropertyOptional({ type: GraphDto })
  @ValidateIf((o) => o.type === ContentType.GRAPH)
  @IsObject()
  @ValidateNested()
  @Type(() => GraphDto)
  graph?: GraphDto;

  /* -------- LIST -------- */

  @ApiPropertyOptional({
    example: ['A', 'B', 'C'],
  })
  @ValidateIf((o) => o.type === ContentType.LIST)
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}
