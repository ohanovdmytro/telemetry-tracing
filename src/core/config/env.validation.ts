import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

export enum LogFormat {
  Json = 'json',
  Pretty = 'pretty',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  public readonly NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  public readonly PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  public readonly APP_NAME: string = 'telemetry-tracing';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly INSTANCE_ID?: string;

  @IsOptional()
  @IsEnum(LogLevel)
  public readonly LOG_LEVEL?: LogLevel;

  @IsOptional()
  @IsEnum(LogFormat)
  public readonly LOG_FORMAT?: LogFormat;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  public readonly SOLANA_RPC_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const environment = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(environment, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Invalid environment variables: ${details}`);
  }

  return environment;
}
