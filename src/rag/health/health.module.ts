import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [VectorStoreModule, LlmModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
