import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    let message: string | string[] = 'Internal server error';
    let error = this.toStatusLabel(status);
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const maybeMessage = (exceptionResponse as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' || Array.isArray(maybeMessage)) {
        message = maybeMessage as string | string[];
      } else if (maybeMessage && typeof maybeMessage === 'object') {
        const messagePayload = maybeMessage as {
          message?: unknown;
          details?: unknown;
        };
        if (typeof messagePayload.message === 'string') {
          message = messagePayload.message;
        }
        if (messagePayload.details && typeof messagePayload.details === 'object') {
          details = messagePayload.details as Record<string, unknown>;
        }
      }
      const maybeError = (exceptionResponse as { error?: unknown }).error;
      if (typeof maybeError === 'string') {
        error = maybeError;
      }
      const maybeDetails = (exceptionResponse as { details?: unknown }).details;
      if (maybeDetails && typeof maybeDetails === 'object') {
        details = maybeDetails as Record<string, unknown>;
      }
    }

    if (!details) {
      details = {
        path: request.url,
        timestamp: new Date().toISOString(),
      };
    }

    if (Array.isArray(message)) {
      details = {
        ...details,
        errors: message,
      };
      message = 'Validation failed';
    }

    response.status(status).json({
      code: status,
      message: typeof message === 'string' ? message : error,
      details: {
        ...details,
        error,
      },
    });
  }

  private toStatusLabel(status: number): string {
    const label = HttpStatus[status];
    if (typeof label !== 'string') {
      return 'Internal Server Error';
    }

    return label
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
