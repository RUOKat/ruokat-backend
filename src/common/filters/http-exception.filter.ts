import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as any).message || exception.message;
      code = (res as any).code || exception.name;
      details = typeof res === 'object' ? res : undefined;
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name;
    }

    this.logger.error(
      `Request ${request.method} ${request.url} failed`,
      (exception as any)?.stack,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  }
}


