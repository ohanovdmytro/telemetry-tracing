import { Module } from '@nestjs/common';
import { NetworksModule } from '../../networks/networks.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [NetworksModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
