import {
  NotImplementedException,
  LoggerService as NestLoggerService,
} from '@nestjs/common';
import { LoggerService } from './logger.service';

export class ScopeLogger implements NestLoggerService {
  public constructor(private readonly loggerService: LoggerService | null) {}

  public log(message: any, context?: string): any {
    this.loggerService?.log(message, context);
  }

  public error(message: any, trace?: string, context?: string): any {
    this.loggerService?.error(message, trace, context);
  }

  public warn(message: any, context?: string): any {
    this.loggerService?.warn(message, context);
  }

  public debug(message: any, context?: string): any {
    this.loggerService?.debug(message, context);
  }

  public verbose(): any {
    throw new NotImplementedException();
  }
}
