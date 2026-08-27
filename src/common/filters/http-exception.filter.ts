import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../errors/error-codes';
import { ApiEnvelope } from '../types/api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const error = this.normalizeHttpException(exception);
      if (status >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
      const body: ApiEnvelope = { success: false, error };
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    } satisfies ApiEnvelope);
  }

  private normalizeHttpException(exception: HttpException): {
    code: string;
    message: string;
  } {
    const status = exception.getStatus();
    const raw = exception.getResponse();

    if (typeof raw === 'string') {
      return { code: this.statusToCode(status), message: raw };
    }

    const payload = raw as Record<string, unknown>;
    const rawMessage = payload.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.map(String).join('; ')
      : String(rawMessage ?? exception.message);
    const code =
      typeof payload.code === 'string'
        ? payload.code
        : this.statusToCode(status);

    return { code, message };
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.ORDER_STATE_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
