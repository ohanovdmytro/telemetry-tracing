// Order matters: telemetry must patch http/express/nest before they load.
import 'reflect-metadata';
import './core/telemetry/telemetry';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './core/config/app.config';
import { LoggerService } from './core/logger/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const loggerService = await app.resolve(LoggerService);
  app.useLogger(loggerService);
  app.enableShutdownHooks();

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const { name, port } = app.get(appConfig.KEY);
  const logger = loggerService.toScopeLogger();

  await app.listen(port);

  logger.log(`${name} is listening`);
}

bootstrap();
