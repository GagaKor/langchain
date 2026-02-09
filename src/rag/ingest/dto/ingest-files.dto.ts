import { IsDateString, IsOptional, IsString } from 'class-validator';

export class IngestFilesDto {
  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  docType?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
