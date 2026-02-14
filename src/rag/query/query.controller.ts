import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QueryDto } from './dto/query.dto';
import { QueryService } from './query.service';

@ApiTags('query')
@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  async query(@Body() body: QueryDto) {
    return this.queryService.query({
      question: body.question,
      topK: body.topK,
      filters: body.filters,
    });
  }
}
