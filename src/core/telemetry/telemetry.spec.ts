import { isTraced } from './telemetry';

describe('isTraced', () => {
  it.each(['/wallet', '/wallet/abc/balance', '/wallet/abc?network=solana'])(
    'traces %s',
    (path) => expect(isTraced(path)).toBe(true),
  );

  it.each(['/healthz', '/wallets', '/wallet-admin', '/'])('skips %s', (path) =>
    expect(isTraced(path)).toBe(false),
  );
});
