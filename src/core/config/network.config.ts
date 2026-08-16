import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';

export const NETWORK_CONFIG_NAMESPACE = 'network';

export const networkConfig = registerAs(NETWORK_CONFIG_NAMESPACE, () => ({
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
}));

export type NetworkConfig = ConfigType<typeof networkConfig>;
