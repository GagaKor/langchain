import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestTextDto {
  @ApiProperty({ description: 'Text to ingest' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ description: 'Optional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
