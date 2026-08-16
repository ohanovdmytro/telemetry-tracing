import { Module } from '@nestjs/common';
import { CoreConfigModule } from './core/config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { TelemetryModule } from './core/telemetry/telemetry.module';
import { ApiModule } from './modules/api/api.module';

@Module({
  imports: [CoreConfigModule, LoggerModule, TelemetryModule, ApiModule],
})
export class AppModule {}
