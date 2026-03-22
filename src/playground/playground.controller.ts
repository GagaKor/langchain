import { Controller, Get, Header } from '@nestjs/common';
import { PLAYGROUND_HTML } from './playground.page';

@Controller('playground')
export class PlaygroundController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPlayground(): string {
    return PLAYGROUND_HTML;
  }
}
