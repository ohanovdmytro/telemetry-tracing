import { Injectable } from '@nestjs/common';
import { ScopeLogger } from '../../../core/logger/scope-logger';

export interface HealthzStatus {
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class HealthzService {
  public getHealthz(logger: ScopeLogger): HealthzStatus {
    logger.log('Healthz checked');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
