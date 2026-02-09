import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ChromaService } from './rag/chroma/chroma.service';

@Controller()
export class AppController {
  constructor(private readonly chromaService: ChromaService) {}

  @Get('health')
  async health() {
    try {
      await this.chromaService.heartbeat();
      return {
        status: 'ok',
        chroma: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Chroma connection failed');
    }
  }
}
