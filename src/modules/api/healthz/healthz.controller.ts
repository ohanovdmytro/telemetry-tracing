import { Controller, Get } from '@nestjs/common';
import { HealthzService } from './healthz.service';
import type { HealthzStatus } from './healthz.service';
import { LoggerService } from '../../../core/logger/logger.service';

@Controller('healthz')
export class HealthzController {
  constructor(
    private readonly healthzService: HealthzService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  public getHealthz(): HealthzStatus {
    const logger = this.loggerService.toScopeLogger();

    return this.healthzService.getHealthz(logger);
  }
}
