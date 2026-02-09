import { Module } from '@nestjs/common';
import { ChromaModule } from './chroma/chroma.module';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [ChromaModule, IngestModule, QueryModule],
  exports: [ChromaModule],
})
export class RagModule {}
