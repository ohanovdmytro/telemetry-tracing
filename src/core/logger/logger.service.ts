import {
  Injectable,
  Inject,
  Scope,
  NotImplementedException,
  ConsoleLogger,
} from '@nestjs/common';
import {
  isSpanContextValid,
  trace as otelTrace,
  type SpanContext,
} from '@opentelemetry/api';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as Winston } from 'winston';
import { ScopeLogger } from './scope-logger';

export enum LogLevel {
  ERROR = 'error',
  WARNING = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  public readonly service: string;

  public constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winston: Winston,
  ) {
    super();
    this.service = process.env.LOG_SERVICE_NAME as string;
  }

  public log(message: any, context?: string): any {
    this.winston.log(LogLevel.INFO, this.buildLogObject(message, context));
  }

  public error(message: any, trace?: string, context?: string): any {
    this.winston.log(
      LogLevel.ERROR,
      this.buildLogObject(message, context, trace),
    );
  }

  public warn(message: any, context?: string): any {
    this.winston.log(LogLevel.WARNING, this.buildLogObject(message, context));
  }

  public debug(message: any, context?: string): any {
    this.winston.log(LogLevel.DEBUG, this.buildLogObject(message, context));
  }

  public verbose(): any {
    throw new NotImplementedException();
  }

  private buildLogObject(message: any, context?: string, trace?: string): any {
    const module = context || this.context;
    const spanContext = this.validSpanContext();

    let data: any = {
      service: this.service,
      trace,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      module: module?.replace('Controller', ''),
    };

    if (message instanceof Object) {
      data = { ...data, ...message };
    } else {
      data.message = message;
    }

    return data;
  }

  private validSpanContext(): SpanContext | undefined {
    const spanContext = otelTrace.getActiveSpan()?.spanContext();

    return spanContext && isSpanContextValid(spanContext)
      ? spanContext
      : undefined;
  }

  public toScopeLogger(): ScopeLogger {
    return new ScopeLogger(this);
  }
}
