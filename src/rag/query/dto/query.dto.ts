import { Type } from 'class-transformer';
import type { Where } from 'chromadb';
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDto {
  @ApiProperty({ description: 'User question' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({ description: 'Top-K results (1-20)', default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ description: 'Metadata filters' })
  @IsOptional()
  @IsObject()
  filters?: Where;
}
