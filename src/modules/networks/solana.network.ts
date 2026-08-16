import {
  Connection,
  ParsedAccountData,
  PublicKey,
  SolanaJSONRPCError,
} from '@solana/web3.js';
import {
  INetwork,
  InvalidInputError,
  IToken,
  ITransaction,
  NATIVE_ADDRESS,
} from './network.interface';
import {
  METADATA_PROGRAM_ID,
  SolanaTokenTypeEnum,
} from '../../shared/const/solana.const';
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getMetadataAccountDataSerializer } from '@metaplex-foundation/mpl-token-metadata';
import { formatUnits } from 'ethers';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

export class SolanaNetwork implements INetwork {
  private readonly ZERO_ADDRESS = '11111111111111111111111111111111';
  private readonly provider: Connection;

  public constructor(rpcUrl: string) {
    this.provider = new Connection(rpcUrl, {
      commitment: 'processed',
      fetch: this.createRpcFetch(),
    });
  }

  private createRpcFetch(): typeof fetch {
    type RpcCall = { method: string; params: unknown };

    const paramsLimit = 512;

    const unknownCall: RpcCall = { method: 'unknown', params: undefined };
    const tracer = trace.getTracer('solana-rpc');

    const readCall = (body: BodyInit | null | undefined): RpcCall => {
      if (typeof body !== 'string') {
        return unknownCall;
      }

      try {
        return JSON.parse(body) as RpcCall;
      } catch {
        return unknownCall;
      }
    };

    const describeParams = (params: unknown): string => {
      const serialised = JSON.stringify(params ?? null);

      return serialised.length > paramsLimit
        ? `${serialised.slice(0, paramsLimit)}…`
        : serialised;
    };

    return (input, init) => {
      const { method, params } = readCall(init?.body);

      return tracer.startActiveSpan(method, { kind: SpanKind.CLIENT }, (span) =>
        fetch(input, init)
          .then((response) => {
            span.setAttributes({
              'rpc.system': 'jsonrpc',
              'rpc.method': method,
              'rpc.params': describeParams(params),
              'rpc.http.status_code': response.status,
            });

            if (!response.ok) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: `HTTP ${response.status}`,
              });
            }

            return response;
          })
          .catch((error: Error) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });

            throw error;
          })
          .finally(() => span.end()),
      );
    };
  }

  public async getBalance(address: string): Promise<string> {
    const lamports = await this.provider.getBalance(
      this.toPublicKey(address),
      'processed',
    );

    return lamports.toString();
  }

  public async getTokenBalance(
    tokenAddress: string,
    owner: string,
  ): Promise<string> {
    const tokenData = await this.getTokenData(tokenAddress);
    try {
      const tokenAccount = getAssociatedTokenAddressSync(
        this.toPublicKey(tokenAddress),
        this.toPublicKey(owner),
        true,
        tokenData.type === SolanaTokenTypeEnum.token2022
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID,
      );

      return await this.provider
        .getTokenAccountBalance(tokenAccount, 'processed')
        .then((res) => res.value.amount);
    } catch (error) {
      if (error instanceof SolanaJSONRPCError) {
        return '0';
      }

      throw error;
    }
  }

  public async getTokenData(tokenAddress: string): Promise<IToken> {
    if (tokenAddress === NATIVE_ADDRESS) {
      return {
        address: this.ZERO_ADDRESS,
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
        supply: '0',
      };
    }

    const mint = await this.provider.getParsedAccountInfo(
      this.toPublicKey(tokenAddress),
    );
    const mintAccount = mint.value;
    const parsedMint = mintAccount?.data as ParsedAccountData;

    if (!mintAccount || !parsedMint?.parsed?.info) {
      throw new InvalidInputError(
        `Mint account not found or invalid: ${tokenAddress}`,
      );
    }

    const decimals = parsedMint.parsed.info.decimals;
    const isToken2022 = mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID);
    const type = isToken2022
      ? SolanaTokenTypeEnum.token2022
      : SolanaTokenTypeEnum.splToken;

    const extensions = parsedMint.parsed.info.extensions as Array<{
      extension: string;
      state?: { symbol: string; name: string };
    }>;

    const metadataExtension = extensions?.find(
      (ext) => ext.extension === 'tokenMetadata',
    );

    let symbol: string;
    let name: string;

    if (isToken2022 && metadataExtension?.state) {
      symbol = metadataExtension.state.symbol;
      name = metadataExtension.state.name;
    } else {
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          this.toPublicKey(tokenAddress).toBuffer(),
        ],
        METADATA_PROGRAM_ID,
      );
      const accountInfo = await this.provider.getAccountInfo(metadataPda);

      if (!accountInfo?.data) {
        symbol = 'TKN';
        name = 'TKN';
      } else {
        try {
          const [mintData] = getMetadataAccountDataSerializer().deserialize(
            accountInfo.data,
          );
          symbol = mintData.symbol;
          name = mintData.name;
        } catch {
          symbol = 'TKN';
          name = 'TKN';
        }
      }
    }

    const supply = formatUnits(BigInt(parsedMint.parsed.info.supply), decimals);

    return {
      address: tokenAddress,
      decimals,
      symbol,
      name,
      type,
      supply,
    };
  }

  public async sendTransaction(rawTx: string): Promise<string> {
    const signature = await this.provider.sendEncodedTransaction(rawTx, {
      skipPreflight: true,
    });

    return signature;
  }

  public async getTransaction(hash: string): Promise<ITransaction | null> {
    const transaction = await this.provider.getParsedTransaction(hash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 5,
    });

    if (transaction === null) {
      return null;
    }

    const error = transaction.meta?.err ?? null;

    return {
      hash,
      slot: transaction.slot,
      blockTime: transaction.blockTime
        ? new Date(transaction.blockTime * 1000)
        : null,
      succeeded: error === null,
      error: error === null ? null : JSON.stringify(error),
      fee: transaction.meta?.fee ?? 0,
    };
  }

  private toPublicKey(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch {
      throw new InvalidInputError(`Invalid Solana address: ${address}`);
    }
  }
}
