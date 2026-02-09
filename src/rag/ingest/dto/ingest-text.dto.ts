import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class IngestTextDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
