import { SuiClient } from '@mysten/sui/client';

export const getClient = (network: string) => {
  return new SuiClient({
    url: network === 'mainnet'
      ? 'https://fullnode.mainnet.sui.io'
      : 'https://fullnode.testnet.sui.io',
  });
};
