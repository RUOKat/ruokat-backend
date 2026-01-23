import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_active_connections')
    private readonly httpActiveConnections: Gauge<string>,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // 경로 정규화 (파라미터 제거)
    const path = this.normalizePath(url);

    // /metrics 경로는 제외
    if (path === '/metrics') {
      return next.handle();
    }

    const startTime = Date.now();
    this.httpActiveConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const status = response.statusCode;
          this.recordMetrics(method, path, status, startTime);
        },
        error: (error) => {
          const status = error.status || 500;
          this.recordMetrics(method, path, status, startTime);
        },
      }),
    );
  }

  private recordMetrics(
    method: string,
    path: string,
    status: number,
    startTime: number,
  ) {
    const duration = (Date.now() - startTime) / 1000;
    const statusStr = String(status);

    this.httpRequestsTotal.inc({ method, path, status: statusStr });
    this.httpRequestDuration.observe({ method, path, status: statusStr }, duration);
    this.httpActiveConnections.dec();
  }

  private normalizePath(url: string): string {
    // 쿼리 파라미터 제거
    const pathOnly = url.split('?')[0];

    // UUID 패턴을 :id로 치환
    return pathOnly.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );
  }
}
