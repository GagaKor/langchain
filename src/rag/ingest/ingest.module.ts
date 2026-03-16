import { Module } from '@nestjs/common';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { ChunkingService } from './services/chunking.service';
import { IngestJobService } from './services/ingest-job.service';
import { IngestService } from './services/ingest.service';
import { OcrService } from './services/ocr.service';
import { TextExtractorService } from './services/text-extractor.service';
import { IngestController } from './ingest.controller';

@Module({
  imports: [VectorStoreModule],
  controllers: [IngestController],
  providers: [OcrService, TextExtractorService, ChunkingService, IngestService, IngestJobService],
})
export class IngestModule {}
