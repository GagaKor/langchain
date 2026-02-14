import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBED_MODEL, DEFAULT_OLLAMA_URL } from '../shared/constants';

@Injectable()
export class OllamaService {
  private readonly baseUrl = process.env.OLLAMA_BASE_URL?.trim() ?? DEFAULT_OLLAMA_URL;
  private readonly chatModelName = process.env.OLLAMA_CHAT_MODEL?.trim() ?? DEFAULT_CHAT_MODEL;
  private readonly embeddingModelName =
    process.env.OLLAMA_EMBED_MODEL?.trim() ?? DEFAULT_EMBED_MODEL;

  private chatModel?: ChatOllama;
  private embeddings?: OllamaEmbeddings;

  getChatModel(): ChatOllama {
    if (!this.chatModel) {
      this.chatModel = new ChatOllama({
        baseUrl: this.baseUrl,
        model: this.chatModelName,
        temperature: 0.1,
      });
    }
    return this.chatModel;
  }

  getEmbeddings(): OllamaEmbeddings {
    if (!this.embeddings) {
      this.embeddings = new OllamaEmbeddings({
        baseUrl: this.baseUrl,
        model: this.embeddingModelName,
      });
    }
    return this.embeddings;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getChatModelName(): string {
    return this.chatModelName;
  }

  getEmbeddingModelName(): string {
    return this.embeddingModelName;
  }

  async heartbeat(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama heartbeat failed: ${response.status}`);
      }
    } catch {
      throw new ServiceUnavailableException('Failed to connect to Ollama server');
    }
  }
}
