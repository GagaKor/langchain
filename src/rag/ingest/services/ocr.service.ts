import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ExtractedSegment } from './text-extractor.service';

const execFileAsync = promisify(execFile);
const OCR_UNAVAILABLE_MESSAGE =
  'OCR dependencies are unavailable. Install both tesseract and pdftoppm to enable OCR fallback.';

@Injectable()
export class OcrService {
  private readonly language = process.env.OCR_LANGUAGE?.trim() || 'eng';

  async extractPdf(filePath: string): Promise<ExtractedSegment[]> {
    await this.assertDependency('tesseract', ['--version']);
    await this.assertDependency('pdftoppm', ['-v']);

    const tempDir = await mkdtemp(join(tmpdir(), 'rag-ocr-'));

    try {
      const outputPrefix = join(tempDir, 'page');
      await execFileAsync('pdftoppm', ['-png', filePath, outputPrefix], {
        maxBuffer: 10 * 1024 * 1024,
      });

      const imageFiles = (await readdir(tempDir))
        .filter((entry) => entry.endsWith('.png'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const segments: ExtractedSegment[] = [];

      for (const [index, imageFile] of imageFiles.entries()) {
        const { stdout } = await execFileAsync(
          'tesseract',
          [join(tempDir, imageFile), 'stdout', '-l', this.language],
          {
            maxBuffer: 10 * 1024 * 1024,
          },
        );

        const text = stdout.trim();
        if (!text) {
          continue;
        }

        segments.push({
          text,
          pageOrSlide: index + 1,
        });
      }

      return segments;
    } catch (error) {
      if (error instanceof Error && error.message.includes('spawn')) {
        throw new Error(OCR_UNAVAILABLE_MESSAGE);
      }

      throw new Error('OCR extraction failed');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private async assertDependency(command: string, args: string[]): Promise<void> {
    try {
      await execFileAsync(command, args, {
        maxBuffer: 1024 * 1024,
      });
    } catch {
      throw new Error(OCR_UNAVAILABLE_MESSAGE);
    }
  }
}
