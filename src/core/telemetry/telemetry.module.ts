import {
  Catch,
  HttpException,
  Injectable,
  Module,
  type ArgumentsHost,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, BaseExceptionFilter } from '@nestjs/core';
import { trace } from '@opentelemetry/api';
import {
  OpenTelemetryModule,
  WideEventInterceptor,
  getLocalRootSpan,
} from 'nestjs-otel';
import { shutdownTelemetry } from './telemetry';

@Injectable()
class TelemetryLifecycle implements OnApplicationShutdown {
  public async onApplicationShutdown(): Promise<void> {
    await shutdownTelemetry();
  }
}

@Catch()
class ExceptionDetailFilter extends BaseExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const active = trace.getActiveSpan();
      const target = active
        ? (getLocalRootSpan(active.spanContext().traceId) ?? active)
        : undefined;

      target?.setAttribute(
        'exception.detail',
        typeof body === 'string' ? body : JSON.stringify(body),
      );
    }

    super.catch(exception, host);
  }
}

@Module({
  imports: [OpenTelemetryModule.forRoot()],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: WideEventInterceptor },
    { provide: APP_FILTER, useClass: ExceptionDetailFilter },
    TelemetryLifecycle,
  ],
})
export class TelemetryModule {}
