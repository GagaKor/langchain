import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagModule } from './rag/rag.module';
import { PlaygroundModule } from './playground/playground.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RagModule, PlaygroundModule],
})
export class AppModule {}
