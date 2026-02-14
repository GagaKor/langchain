import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ChromaService } from './chroma.service';

@Module({
  imports: [LlmModule],
  providers: [ChromaService],
  exports: [ChromaService],
})
export class ChromaModule {}
