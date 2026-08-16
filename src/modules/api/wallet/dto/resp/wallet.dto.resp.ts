import { NetworkNameEnum } from '../../../../../shared/enums/network-name.enum';
import { IToken } from '../../../../networks/network.interface';

export class WalletBalanceRespDto {
  public address: string;
  public network: NetworkNameEnum;
  public token: TokenRespDto;
  public amount: string;
  public formatted: string;

  public constructor(
    address: string,
    network: NetworkNameEnum,
    token: IToken,
    amount: string,
    formatted: string,
  ) {
    this.address = address;
    this.network = network;
    this.token = new TokenRespDto(
      token.address,
      token.symbol,
      token.name,
      token.decimals,
    );
    this.amount = amount;
    this.formatted = formatted;
  }
}

export class TokenRespDto {
  public address: string;
  public symbol: string;
  public name: string;
  public decimals: number;

  public constructor(
    address: string,
    symbol: string,
    name: string,
    decimals: number,
  ) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }
}
