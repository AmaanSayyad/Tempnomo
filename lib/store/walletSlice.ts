/**
 * Wallet state slice for Zustand store
 * Manages wallet connection status and address
 * 
 * Tempo Network: Single chain via Privy embedded wallets
 */

import { StateCreator } from "zustand";

export interface WalletState {
  // State
  address: string | null;
  walletBalance: number;
  isConnected: boolean;
  isConnecting: boolean;
  network: 'TEMPO' | 'BNB' | 'SOL' | null;
  /** Which chain's wallet drives the store (used by BNB/SOL sync hooks). */
  preferredNetwork: 'TEMPO' | 'BNB' | 'SOL' | null;
  selectedToken: string; // Selected token address for gameplay
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshWalletBalance: () => Promise<void>;
  clearError: () => void;

  // Setters for wallet integration
  setAddress: (address: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  setNetwork: (network: 'TEMPO' | 'BNB' | 'SOL' | null) => void;
  setPreferredNetwork: (network: 'TEMPO' | 'BNB' | 'SOL' | null) => void;
  setSelectedToken: (token: string) => void;
}

/**
 * Create wallet slice for Zustand store
 * Handles wallet state management for Tempo network
 */
export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  // Initial state
  address: null,
  walletBalance: 0,
  isConnected: false,
  isConnecting: false,
  network: null,
  preferredNetwork: null,
  selectedToken: '0x20c0000000000000000000000000000000000001', // Default: AlphaUSD
  error: null,

  /**
   * Connect wallet - opens Privy login
   */
  connect: async () => {
    console.log('Connect called - handled by Privy login()');
  },

  /**
   * Disconnect wallet
   */
  disconnect: () => {
    console.log('Disconnect called - handled by Privy');

    // Reset state
    set({
      address: null,
      walletBalance: 0,
      isConnected: false,
      isConnecting: false,
      network: null,
      error: null
    });
  },

  /**
   * Refresh token balance for connected wallet on Tempo
   */
  refreshWalletBalance: async () => {
    const { address, isConnected, network, selectedToken } = get();

    if (!isConnected || !address || !network) {
      return;
    }

    try {
      // Fetch balance from Tempo RPC for the selected token
      const { getTempoTokenBalance } = await import('@/lib/tempo/client');
      const bal = await getTempoTokenBalance(address, selectedToken);
      set({ walletBalance: bal });
    } catch (error) {
      console.error("Error refreshing wallet balance:", error);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  /**
   * Set address (used by wallet integration)
   */
  setAddress: (address: string | null) => {
    set({ address });
  },

  /**
   * Set connected status (used by wallet integration)
   */
  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  /**
   * Set active network
   */
  setNetwork: (network: 'TEMPO' | 'BNB' | 'SOL' | null) => {
    set({ network });
  },

  /**
   * Set preferred chain (which wallet drives the store; used by BNB/SOL hooks).
   */
  setPreferredNetwork: (network: 'TEMPO' | 'BNB' | 'SOL' | null) => {
    set({ preferredNetwork: network });
  },

  /**
   * Set selected token for gameplay
   */
  setSelectedToken: (token: string) => {
    const { address, isConnected, refreshWalletBalance } = get() as any;

    set({ selectedToken: token });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempnomo_selected_token', token);
    }

    // Refresh both wallet and house balances for the new token
    refreshWalletBalance();
    if (isConnected && address) {
      (get() as any).fetchBalance(address, token);
    }
  },
});
