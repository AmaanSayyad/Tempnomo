'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { TEMPO_CHAIN } from '@/lib/tempo/config';



// Define Tempo chain for Privy manually to ensure consistent 18 decimals 
// as expected by EVM wallets (viem's tempoModerato sometimes has 6).
const tempoChain = {
  id: 42431,
  name: 'Tempo Testnet (Moderato)',
  network: 'tempo-moderato',
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.moderato.tempo.xyz'],
    },
    public: {
      http: ['https://rpc.moderato.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz',
    },
  },
  testnet: true,
};

// Wallet Sync component to bridge Privy wallet state with our Zustand store
function WalletSync() {
  const { authenticated, ready: privyReady } = usePrivy();
  const { wallets: privyWallets } = useWallets();

  const {
    setAddress,
    setIsConnected,
    setNetwork,
    refreshWalletBalance,
  } = useOverflowStore();

  useEffect(() => {
    if (!privyReady) return;

    const syncWallet = async () => {
      // Check if Privy wallet is connected
      if (authenticated && privyWallets[0]) {
        const wallet = privyWallets[0];

        // Force switch to Tempo if on wrong chain
        // Using hex for comparison as some providers return hex
        const targetChainId = `eip155:${tempoChain.id}`;
        if (wallet.chainId !== targetChainId && wallet.chainId !== tempoChain.id.toString()) {
          try {
            console.log('Switching to Tempo network...');
            await wallet.switchChain(tempoChain.id);
          } catch (error) {
            console.error('Failed to switch network:', error);
          }
        }

        setAddress(wallet.address);
        setIsConnected(true);
        setNetwork('TEMPO');
        refreshWalletBalance();
        return;
      }

      // No wallet connected - clear state
      setAddress(null);
      setIsConnected(false);
      setNetwork(null);
    };

    syncWallet();
  }, [
    authenticated, privyWallets, privyReady,
    setAddress, setIsConnected, setNetwork, refreshWalletBalance
  ]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeApp = async () => {
      try {
        const { updateAllPrices, loadTargetCells, startGlobalPriceFeed } = useOverflowStore.getState();

        await loadTargetCells().catch(console.error);
        const stopPriceFeed = startGlobalPriceFeed(updateAllPrices);
        setIsReady(true);
        return () => { if (stopPriceFeed) stopPriceFeed(); };
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmhiu5j2w001zkz0cbqtihjee';

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#A855F7',
            showWalletLoginFirst: true,
          },
          supportedChains: [tempoChain as any],
          defaultChain: tempoChain as any,
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <div key="providers-wrapper" style={{ display: 'contents' }}>
          <WalletSync key="wallet-sync" />
          {children}
          <ToastProvider key="toast-provider" />
        </div>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
