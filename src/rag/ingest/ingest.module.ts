import { Module } from '@nestjs/common';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { ChunkingService } from './services/chunking.service';
import { IngestService } from './services/ingest.service';
import { TextExtractorService } from './services/text-extractor.service';
import { IngestController } from './ingest.controller';

@Module({
  imports: [VectorStoreModule],
  controllers: [IngestController],
  providers: [TextExtractorService, ChunkingService, IngestService],
})
export class IngestModule {}
