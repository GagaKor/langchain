import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('formats validation errors with a normalized message and error list', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost('/query', status);

    filter.catch(new BadRequestException(['question should not be empty']), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: 400,
      message: 'Validation failed',
      details: expect.objectContaining({
        path: '/query',
        error: 'Bad Request',
        errors: ['question should not be empty'],
      }),
    });
  });

  it('preserves nested details payloads from http exceptions', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost('/health', status);

    filter.catch(
      new ServiceUnavailableException({
        message: 'Service unhealthy',
        details: {
          status: 'degraded',
        },
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      code: 503,
      message: 'Service unhealthy',
      details: {
        status: 'degraded',
        error: 'Service Unavailable',
      },
    });
  });

  it('falls back to an internal server error payload for unknown exceptions', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHost('/ingest/text', status);

    filter.catch(new Error('boom'), host);

    expect(json).toHaveBeenCalledWith({
      code: 500,
      message: 'Internal server error',
      details: expect.objectContaining({
        path: '/ingest/text',
        error: 'Internal Server Error',
      }),
    });
  });
});

function createHost(url: string, status: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as ArgumentsHost;
}
