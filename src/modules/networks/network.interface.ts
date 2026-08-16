import { SolanaTokenTypeEnum } from '../../shared/const/solana.const';

export interface ITransaction {
  hash: string;
  slot: number;
  blockTime: Date | null;
  succeeded: boolean;
  error: string | null;
  fee: number;
}

export interface IToken {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  supply: string;
  type?: SolanaTokenTypeEnum;
}

export const NATIVE_ADDRESS = 'NATIVE';

/** Caller's mistake: a malformed address or a mint that does not exist. */
export class InvalidInputError extends Error {}

export interface INetwork {
  getBalance(address: string): Promise<string>;
  getTokenBalance(tokenAddress: string, owner: string): Promise<string>;
  getTokenData(tokenAddress: string): Promise<IToken>;
  sendTransaction(rawTx: string): Promise<string>;
  getTransaction(hash: string): Promise<ITransaction | null>;
}
