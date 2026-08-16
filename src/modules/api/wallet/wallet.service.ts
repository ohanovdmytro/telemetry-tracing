import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { formatUnits } from 'ethers';
import { Span, WideEventService } from 'nestjs-otel';
import { ScopeLogger } from '../../../core/logger/scope-logger';
import { NetworkNameEnum } from '../../../shared/enums/network-name.enum';
import {
  InvalidInputError,
  NATIVE_ADDRESS,
} from '../../networks/network.interface';
import { NetworkService } from '../../networks/network.service';
import { WalletBalanceRespDto } from './dto/resp/wallet.dto.resp';

@Injectable()
export class WalletService {
  public constructor(
    private readonly networkService: NetworkService,
    private readonly wideEvent: WideEventService,
  ) {}

  public add(logger: ScopeLogger): string {
    logger.log(`Wallet created`);

    return 'Wallet created!';
  }

  @Span()
  public async getBalance(
    walletId: string,
    tokenAddress: string,
    networkName: NetworkNameEnum,
    logger: ScopeLogger,
  ): Promise<WalletBalanceRespDto> {
    logger.log(
      `Getting ${tokenAddress} balance of wallet ${walletId} on ${networkName}`,
    );

    this.wideEvent.setMany({
      'wallet.address': walletId,
      'wallet.network': networkName,
      'wallet.token': tokenAddress,
    });

    const network = this.networkService.getNetwork(networkName);

    try {
      const token = await network.getTokenData(tokenAddress);

      const amount =
        tokenAddress === NATIVE_ADDRESS
          ? await network.getBalance(walletId)
          : await network.getTokenBalance(tokenAddress, walletId);

      const formatted = formatUnits(amount, token.decimals);

      this.wideEvent.set('wallet.balance', formatted);

      return new WalletBalanceRespDto(
        walletId,
        networkName,
        token,
        amount,
        formatted,
      );
    } catch (error) {
      trace.getActiveSpan()?.recordException(error as Error);

      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.message);
      }

      logger.error('Balance lookup failed', (error as Error)?.stack);

      throw new BadGatewayException('Balance provider unavailable');
    }
  }

  public delete(walletId: string, logger: ScopeLogger): string {
    logger.log(`Wallet ${walletId} deleted`);

    return 'Wallet deleted!';
  }
}
