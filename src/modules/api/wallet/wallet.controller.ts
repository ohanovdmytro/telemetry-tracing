import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { GetBalanceQueryDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { WalletBalanceRespDto } from './dto/resp/wallet.dto.resp';

@Controller('wallet')
export class WalletController {
  public constructor(
    private readonly walletService: WalletService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  public add(): string {
    const logger = this.loggerService.toScopeLogger();

    return this.walletService.add(logger);
  }

  @Get(':walletId/balance')
  public async getBalance(
    @Param('walletId') walletId: string,
    @Query() query: GetBalanceQueryDto,
  ): Promise<WalletBalanceRespDto> {
    const logger = this.loggerService.toScopeLogger();

    return this.walletService.getBalance(
      walletId,
      query.tokenAddress,
      query.network,
      logger,
    );
  }

  @Delete(':walletId')
  public delete(@Param('walletId') walletId: string): string {
    const logger = this.loggerService.toScopeLogger();

    return this.walletService.delete(walletId, logger);
  }
}
