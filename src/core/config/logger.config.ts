import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { LogFormat, LogLevel, NodeEnv } from './env.validation';

export const LOGGER_CONFIG_NAMESPACE = 'logger';

export const loggerConfig = registerAs(LOGGER_CONFIG_NAMESPACE, () => {
  const isProduction = process.env.NODE_ENV === NodeEnv.Production;

  return {
    level:
      (process.env.LOG_LEVEL as LogLevel) ??
      (isProduction ? LogLevel.Info : LogLevel.Debug),
    format:
      (process.env.LOG_FORMAT as LogFormat) ??
      (isProduction ? LogFormat.Json : LogFormat.Pretty),
  };
});

export type LoggerConfig = ConfigType<typeof loggerConfig>;
