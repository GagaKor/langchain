import { Module } from '@nestjs/common';
import { ChromaModule } from '../chroma/chroma.module';
import { ChunkingService } from './services/chunking.service';
import { IngestService } from './services/ingest.service';
import { TextExtractorService } from './services/text-extractor.service';
import { IngestController } from './ingest.controller';

@Module({
  imports: [ChromaModule],
  controllers: [IngestController],
  providers: [TextExtractorService, ChunkingService, IngestService],
})
export class IngestModule {}
