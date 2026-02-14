import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Where } from 'chromadb';
import { ChromaService } from '../chroma/chroma.service';
import { OllamaService } from '../llm/ollama.service';

interface QueryInput {
  question: string;
  topK?: number;
  filters?: Where;
}

@Injectable()
export class QueryService {
  constructor(
    private readonly chromaService: ChromaService,
    private readonly ollamaService: OllamaService,
  ) {}

  async query(input: QueryInput) {
    const topK = input.topK ?? 6;
    const searchResults = await this.chromaService.similaritySearchWithScore(
      input.question,
      topK,
      input.filters,
    );

    const retrieved = searchResults.map(([doc, score]) => ({
      source: String(doc.metadata?.source ?? 'unknown'),
      score,
      excerpt: this.toExcerpt(doc.pageContent),
      metadata: doc.metadata ?? {},
    }));

    if (retrieved.length === 0) {
      return {
        answer: '근거 부족: 질의와 관련된 문서를 찾지 못했습니다. 문서 인덱싱 상태를 확인해주세요.',
        citations: [],
        retrieved: [],
      };
    }

    const citations = retrieved.map((item) => ({
      source: item.source,
      docId: this.toOptionalString(item.metadata.docId),
      pageOrSlide: this.toOptionalNumber(item.metadata.pageOrSlide),
      chunkId: this.toOptionalString(item.metadata.chunkId),
      excerpt: item.excerpt,
    }));

    const answer = await this.generateGroundedAnswer(input.question, citations);

    return {
      answer,
      citations,
      retrieved,
    };
  }

  private async generateGroundedAnswer(
    question: string,
    citations: Array<{
      source: string;
      docId?: string;
      pageOrSlide?: number;
      chunkId?: string;
      excerpt: string;
    }>,
  ): Promise<string> {
    const llm = this.ollamaService.getChatModel();

    const context = citations
      .map(
        (item, index) =>
          `[${index + 1}] source=${item.source}, docId=${item.docId ?? 'n/a'}, pageOrSlide=${item.pageOrSlide ?? 'n/a'}, chunkId=${item.chunkId ?? 'n/a'}\n${item.excerpt}`,
      )
      .join('\n\n');

    const response = await llm.invoke([
      new SystemMessage(
        [
          'You are a grounded assistant for internal planning documents.',
          'Use only the provided context.',
          'If evidence is weak or missing, explicitly say "근거 부족".',
          'Answer in Korean.',
          'When appropriate, reference the citation numbers in brackets like [1].',
        ].join(' '),
      ),
      new HumanMessage(`질문:\n${question}\n\n근거 컨텍스트:\n${context}`),
    ]);

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
  }

  private toExcerpt(text: string): string {
    const trimmed = text.trim();
    return trimmed.length <= 300 ? trimmed : `${trimmed.slice(0, 300)}...`;
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }
}
