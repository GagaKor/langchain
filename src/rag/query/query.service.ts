import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChromaService } from '../chroma/chroma.service';

interface QueryInput {
  question: string;
  topK?: number;
  filters?: Record<string, unknown>;
}

@Injectable()
export class QueryService {
  constructor(private readonly chromaService: ChromaService) {}

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
        answer:
          '근거 부족: 질의와 관련된 문서를 찾지 못했습니다. 문서 인덱싱 상태를 확인해주세요.',
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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is missing');
    }

    const llm = new ChatOpenAI({
      apiKey,
      model: 'gpt-4o-mini',
      temperature: 0.1,
    });

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
