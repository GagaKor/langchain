import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IngestFilesDto {
  @ApiPropertyOptional({ description: 'Project name for filtering' })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiPropertyOptional({ description: 'Document type override' })
  @IsOptional()
  @IsString()
  docType?: string;

  @ApiPropertyOptional({ description: 'Created at ISO date string' })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
