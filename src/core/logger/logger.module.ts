import { Global, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { LogFormat } from '../config/env.validation';
import { loggerConfig } from '../config/logger.config';
import { LoggerService } from './logger.service';
import { ScopeLogger } from './scope-logger';

const jsonFormat = format.combine(format.timestamp(), format.json());

const toText = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value) || '';

const prettyFormat = format.combine(
  format.timestamp(),
  format.colorize(),
  format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      module,
      trace,
      traceId,
      spanId: _spanId,
      service: _service,
      ...rest
    } = info as Record<string, unknown>;

    const scope = module ? ` [${toText(module)}]` : '';
    const id = traceId ? ` [${toText(traceId)}]` : '';
    const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    const stack = trace ? `\n${toText(trace)}` : '';

    return `${toText(timestamp)} ${toText(level)}${scope}${id} ${toText(message ?? '')}${extras}${stack}`;
  }),
);

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [loggerConfig.KEY],
      useFactory: (config: ConfigType<typeof loggerConfig>) => ({
        level: config.level,
        format: config.format === LogFormat.Json ? jsonFormat : prettyFormat,
        transports: [new transports.Console()],
      }),
    }),
  ],
  providers: [LoggerService, ScopeLogger],
  exports: [LoggerService, ScopeLogger],
})
export class LoggerModule {}
