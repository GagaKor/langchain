import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { LlmModule } from './llm/llm.module';
import { QueryModule } from './query/query.module';
import { VectorStoreModule } from './vector-store/vector-store.module';

@Module({
  imports: [VectorStoreModule, LlmModule, IngestModule, QueryModule, HealthModule],
})
export class RagModule {}
