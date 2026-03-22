jest.mock('@langchain/ollama', () => ({
  ChatOllama: jest.fn().mockImplementation((config) => ({ kind: 'chat', config })),
  OllamaEmbeddings: jest.fn().mockImplementation((config) => ({ kind: 'embed', config })),
}));

import { ServiceUnavailableException } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { OllamaService } from './ollama.service';

describe('OllamaService', () => {
  const fetchMock = jest.fn();
  const envBackup = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_CHAT_MODEL;
    delete process.env.OLLAMA_EMBED_MODEL;
    global.fetch = fetchMock as typeof fetch;
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('lazily creates and caches chat and embedding clients', () => {
    process.env.OLLAMA_BASE_URL = ' http://ollama:11434 ';
    process.env.OLLAMA_CHAT_MODEL = ' llama3.1 ';
    process.env.OLLAMA_EMBED_MODEL = ' nomic ';
    const service = new OllamaService();

    const chatFirst = service.getChatModel();
    const chatSecond = service.getChatModel();
    const embedFirst = service.getEmbeddings();
    const embedSecond = service.getEmbeddings();

    expect(chatFirst).toBe(chatSecond);
    expect(embedFirst).toBe(embedSecond);
    expect(ChatOllama).toHaveBeenCalledWith({
      baseUrl: 'http://ollama:11434',
      model: 'llama3.1',
      temperature: 0.1,
    });
    expect(OllamaEmbeddings).toHaveBeenCalledWith({
      baseUrl: 'http://ollama:11434',
      model: 'nomic',
    });
  });

  it('returns configured connection metadata', () => {
    const service = new OllamaService();

    expect(service.getBaseUrl()).toBe('http://localhost:11434');
    expect(service.getChatModelName()).toBe('llama3:8b');
    expect(service.getEmbeddingModelName()).toBe('nomic-embed-text');
  });

  it('passes heartbeat when ollama responds with ok', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const service = new OllamaService();

    await expect(service.heartbeat()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags');
  });

  it('translates heartbeat failures to ServiceUnavailableException', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const service = new OllamaService();

    await expect(service.heartbeat()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
