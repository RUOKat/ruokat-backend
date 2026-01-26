import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown> | unknown> {
    const request = context.switchToHttp().getRequest();
    const { url } = request;

    // /metrics 경로는 변환하지 않음
    if (url === '/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If already formatted, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<unknown>;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}


