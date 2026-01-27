import { Module, Global } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsInterceptor } from './metrics.interceptor';

// HTTP 메트릭 Provider 정의
const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status', 'module'],
});

const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status', 'module'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpActiveConnections = makeGaugeProvider({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    httpRequestsTotal,
    httpRequestDuration,
    httpActiveConnections,
    MetricsInterceptor,
  ],
  exports: [PrometheusModule, MetricsInterceptor],
})
export class MetricsModule { }
