import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NetworkNameEnum } from '../../../../shared/enums/network-name.enum';
import { NATIVE_ADDRESS } from '../../../networks/network.interface';

export class GetBalanceQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public readonly tokenAddress: string = NATIVE_ADDRESS;

  @IsOptional()
  @IsEnum(NetworkNameEnum)
  public readonly network: NetworkNameEnum = NetworkNameEnum.solana;
}
