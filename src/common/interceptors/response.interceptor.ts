import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiEnvelope } from '../types/api-response';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        const success = response.statusCode >= 200 && response.statusCode < 400;
        return {
          success,
          data: (data === undefined ? null : data) as T,
        };
      }),
    );
  }
}
