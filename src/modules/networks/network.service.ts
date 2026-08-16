import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { networkConfig } from '../../core/config/network.config';
import { NetworkNameEnum } from '../../shared/enums/network-name.enum';
import { INetwork } from './network.interface';
import { SolanaNetwork } from './solana.network';

@Injectable()
export class NetworkService {
  private readonly networks = new Map<NetworkNameEnum, INetwork>();

  public constructor(
    @Inject(networkConfig.KEY)
    private readonly config: ConfigType<typeof networkConfig>,
  ) {}

  public getNetwork(network: NetworkNameEnum): INetwork {
    const existing = this.networks.get(network);

    if (existing) {
      return existing;
    }

    const created = this.createNetwork(network);
    this.networks.set(network, created);

    return created;
  }

  private createNetwork(network: NetworkNameEnum): INetwork {
    switch (network) {
      case NetworkNameEnum.solana:
        return new SolanaNetwork(this.config.solanaRpcUrl);
      default:
        throw new Error(`Network ${String(network)} not supported`);
    }
  }
}
