import { Module } from '@nestjs/common';
import { WalletModule } from './wallet/wallet.module';
import { HealthzModule } from './healthz/healthz.module';

const apiModules = [WalletModule, HealthzModule];

@Module({
  imports: apiModules,
})
export class ApiModule {}
