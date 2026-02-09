import { Module } from '@nestjs/common';
import { ChromaModule } from '../chroma/chroma.module';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [ChromaModule],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
