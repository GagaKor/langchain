import { Injectable } from '@nestjs/common';
import { ChromaService } from '../chroma/chroma.service';
import { OllamaService } from '../llm/ollama.service';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  chroma: 'ok' | 'failed';
  ollama: 'ok' | 'failed';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly chromaService: ChromaService,
    private readonly ollamaService: OllamaService,
  ) {}

  async check(): Promise<HealthStatus> {
    const [chroma, ollama] = await Promise.allSettled([
      this.chromaService.heartbeat(),
      this.ollamaService.heartbeat(),
    ]);

    const chromaStatus = chroma.status === 'fulfilled' ? 'ok' : 'failed';
    const ollamaStatus = ollama.status === 'fulfilled' ? 'ok' : 'failed';

    return {
      status: chromaStatus === 'ok' && ollamaStatus === 'ok' ? 'ok' : 'degraded',
      chroma: chromaStatus,
      ollama: ollamaStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
