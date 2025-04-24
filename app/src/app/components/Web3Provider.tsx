'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

// Project ID is required by RainbowKit v2 even when only using browser-injected wallets
// This is used internally by RainbowKit for configuration purposes
const projectId = 'af88407f5dcd816d3b9fe76308234d47';

// Create config with minimal setup
const config = getDefaultConfig({
  appName: 'Expert Prediction Market',
  projectId,
  chains: [hardhat],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 