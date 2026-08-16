import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { loggerConfig } from './logger.config';
import { networkConfig } from './network.config';
import { NodeEnv, validateEnv } from './env.validation';

const nodeEnv = process.env.NODE_ENV ?? NodeEnv.Development;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        `env/.env.${nodeEnv}.local`,
        `env/.env.${nodeEnv}`,
        'env/.env',
      ],
      load: [appConfig, loggerConfig, networkConfig],
      validate: validateEnv,
    }),
  ],
})
export class CoreConfigModule {}
