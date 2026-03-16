import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OcrMode } from '../dto/ingest-files.dto';
import { IngestService, IngestedFileResult } from './ingest.service';
import { ChromaService } from '../../chroma/chroma.service';

interface UploadedFile {
  originalname: string;
  path: string;
}

interface QueueFilesInput {
  files: UploadedFile[];
  project?: string;
  docType?: string;
  createdAt?: string;
  ocrMode?: OcrMode;
}

type IngestJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
type IngestJobFileStatus = 'queued' | 'processing' | 'ok' | 'failed';

interface IngestJobFile {
  filename: string;
  status: IngestJobFileStatus;
  docId?: string;
  ingested: number;
  reason?: string;
  extractionMethod?: 'native' | 'ocr';
  updatedAt: string;
}

export interface IngestJob {
  jobId: string;
  status: IngestJobStatus;
  collection: string;
  ocrMode: OcrMode;
  createdAt: string;
  updatedAt: string;
  files: IngestJobFile[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

@Injectable()
export class IngestJobService {
  private readonly jobs = new Map<string, IngestJob>();

  constructor(
    private readonly ingestService: IngestService,
    private readonly chromaService: ChromaService,
  ) {}

  queueFiles(input: QueueFilesInput): IngestJob {
    const timestamp = new Date().toISOString();
    const jobId = randomUUID();
    const job: IngestJob = {
      jobId,
      status: 'queued',
      collection: this.chromaService.getCollectionName(),
      ocrMode: input.ocrMode ?? 'off',
      createdAt: timestamp,
      updatedAt: timestamp,
      files: input.files.map((file) => ({
        filename: file.originalname,
        status: 'queued',
        ingested: 0,
        updatedAt: timestamp,
      })),
      summary: {
        total: input.files.length,
        succeeded: 0,
        failed: 0,
      },
    };

    this.jobs.set(jobId, job);
    setImmediate(() => {
      void this.processFiles(jobId, input);
    });

    return this.getJob(jobId);
  }

  getJob(jobId: string): IngestJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Ingest job not found: ${jobId}`);
    }

    return structuredClone(job);
  }

  private async processFiles(jobId: string, input: QueueFilesInput): Promise<void> {
    this.updateJob(jobId, (job) => {
      job.status = 'processing';
    });

    for (const [index, file] of input.files.entries()) {
      this.updateJob(jobId, (job) => {
        job.files[index].status = 'processing';
      });

      let result: IngestedFileResult;

      try {
        result = await this.ingestService.ingestFile({
          file,
          project: input.project,
          docType: input.docType,
          createdAt: input.createdAt,
          ocrMode: input.ocrMode ?? 'off',
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unexpected ingest failure';
        result = {
          filename: file.originalname,
          docId: 'n/a',
          ingested: 0,
          status: 'failed',
          reason,
          extractionMethod: 'native',
        };
      }

      this.updateJob(jobId, (job) => {
        job.files[index] = {
          filename: result.filename,
          status: result.status,
          docId: result.docId,
          ingested: result.ingested,
          reason: result.reason,
          extractionMethod: result.extractionMethod,
          updatedAt: new Date().toISOString(),
        };
      });
    }

    this.updateJob(jobId, (job) => {
      const succeeded = job.files.filter((file) => file.status === 'ok').length;
      const failed = job.files.filter((file) => file.status === 'failed').length;

      job.summary = {
        total: job.files.length,
        succeeded,
        failed,
      };
      job.status = failed === job.files.length ? 'failed' : 'completed';
    });
  }

  private updateJob(jobId: string, updater: (job: IngestJob) => void): void {
    const current = this.jobs.get(jobId);
    if (!current) {
      return;
    }

    updater(current);
    current.updatedAt = new Date().toISOString();
  }
}
