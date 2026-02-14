import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { IngestedFileResult, IngestService } from './services/ingest.service';
import { IngestTextDto } from './dto/ingest-text.dto';
import { IngestFilesDto } from './dto/ingest-files.dto';
import { ChromaService } from '../chroma/chroma.service';

interface UploadedFile {
  originalname: string;
  path: string;
}

@ApiTags('ingest')
@Controller('ingest')
export class IngestController {
  constructor(
    private readonly ingestService: IngestService,
    private readonly chromaService: ChromaService,
  ) {}

  @Post('text')
  async ingestText(@Body() body: IngestTextDto) {
    const ingested = await this.ingestService.ingestText({
      text: body.text,
      metadata: body.metadata,
    });

    return {
      ingested,
      collection: this.chromaService.getCollectionName(),
    };
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        project: { type: 'string' },
        docType: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const destination = 'data/uploads';
          if (!existsSync(destination)) {
            mkdirSync(destination, { recursive: true });
          }
          cb(null, destination);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname);
          const basename = file.originalname.replace(extension, '');
          const safeBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
          cb(null, `${Date.now()}-${safeBasename}${extension.toLowerCase()}`);
        },
      }),
    }),
  )
  async ingestFiles(@UploadedFiles() files: UploadedFile[], @Body() body: IngestFilesDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const fileResults: IngestedFileResult[] = [];

    for (const file of files ?? []) {
      try {
        const result = await this.ingestService.ingestFile({
          file,
          project: body.project,
          docType: body.docType,
          createdAt: body.createdAt,
        });
        fileResults.push(result);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unexpected ingest failure';
        fileResults.push({
          filename: file.originalname,
          docId: 'n/a',
          ingested: 0,
          status: 'failed' as const,
          reason,
        });
      }
    }

    return {
      files: fileResults,
      collection: this.chromaService.getCollectionName(),
    };
  }
}
