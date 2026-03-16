import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const OCR_MODES = ['off', 'auto'] as const;
export type OcrMode = (typeof OCR_MODES)[number];

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

  @ApiPropertyOptional({
    description: 'OCR fallback mode for scanned PDFs',
    enum: OCR_MODES,
    default: 'off',
  })
  @IsOptional()
  @IsIn(OCR_MODES)
  ocrMode?: OcrMode;
}
