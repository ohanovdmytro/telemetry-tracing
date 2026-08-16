import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { NodeEnv } from './env.validation';

export const APP_CONFIG_NAMESPACE = 'app';

export const appConfig = registerAs(APP_CONFIG_NAMESPACE, () => {
  const env = (process.env.NODE_ENV as NodeEnv) ?? NodeEnv.Development;

  return {
    name: process.env.APP_NAME ?? 'telemetry-tracing',
    env,
    port: Number(process.env.PORT ?? 3000),
    isProduction: env === NodeEnv.Production,
    instanceId: process.env.INSTANCE_ID ?? process.env.NODE_APP_INSTANCE ?? '0',
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
