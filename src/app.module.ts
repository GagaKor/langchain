import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RagModule],
  controllers: [AppController],
})
export class AppModule {}
