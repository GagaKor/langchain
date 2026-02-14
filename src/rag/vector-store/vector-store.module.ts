import { Module } from '@nestjs/common';
import { ChromaModule } from '../chroma/chroma.module';

@Module({
  imports: [ChromaModule],
  exports: [ChromaModule],
})
export class VectorStoreModule {}
