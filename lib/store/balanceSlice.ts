/**
 * Balance state slice for Zustand store
 * Manages house balance state and operations (deposit, withdraw, bet)
 * 
 * Tempo Migration: Updated for multi-token support on Tempo Testnet
 */

import { StateCreator } from "zustand";

export interface BalanceState {
  // State
  houseBalance: number;
  demoBalance: number;
  accountType: 'real' | 'demo';
  userTier: 'free' | 'standard' | 'vip';
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBalance: (address: string, tokenAddress?: string) => Promise<void>;
  setBalance: (balance: number) => void;
  updateBalance: (amount: number, operation: 'add' | 'subtract') => void;
  depositFunds: (address: string, amount: number, txHash: string, tokenAddress?: string) => Promise<any>;
  withdrawFunds: (address: string, amount: number, tokenAddress?: string) => Promise<any>;
  toggleAccountType: () => void;
  clearError: () => void;
}

/**
 * Create balance slice for Zustand store
 * Handles house balance fetching, updates, deposits, and withdrawals
 */
export const createBalanceSlice: StateCreator<any> = (set, get) => ({
  // Initial state
  houseBalance: 0,
  demoBalance: 10000, // 10,000 demo credits
  accountType: 'real',
  userTier: 'free',
  isLoading: false,
  error: null,

  /**
   * Fetch house balance for a user address and specific token
   * @param address - Wallet address
   * @param tokenAddress - Optional TIP-20 token address
   */
  fetchBalance: async (address: string, tokenAddress?: string) => {
    const { accountType, selectedToken } = get();
    const token = tokenAddress || selectedToken;

    // Skip API fetch for demo mode as it uses local state only
    if (!address || accountType === 'demo' || address.startsWith('0xDEMO')) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Pass token query param to backend
      const response = await fetch(`/api/balance/${address}?token=${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data = await response.json();

      set({
        houseBalance: data.balance || 0,
        userTier: data.tier || 'free',
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      });
    }
  },

  /**
   * Set house balance directly
   */
  setBalance: (balance: number) => {
    set({ houseBalance: balance });
  },

  /**
   * Update house balance optimistically
   */
  updateBalance: (amount: number, operation: 'add' | 'subtract') => {
    const { houseBalance, demoBalance, accountType } = get();

    if (accountType === 'demo') {
      const newDemoBalance = operation === 'add'
        ? demoBalance + amount
        : Math.max(0, demoBalance - amount);
      set({ demoBalance: newDemoBalance });
      return;
    }

    const newBalance = operation === 'add'
      ? houseBalance + amount
      : Math.max(0, houseBalance - amount);

    set({ houseBalance: newBalance });
  },

  /**
   * Toggle between real and demo accounts
   */
  toggleAccountType: () => {
    const { accountType } = get();
    set({ accountType: accountType === 'real' ? 'demo' : 'real' });
  },

  /**
   * Process deposit funds operation
   */
  depositFunds: async (address: string, amount: number, txHash: string, tokenAddress?: string) => {
    const { selectedToken } = get();
    const token = tokenAddress || selectedToken;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          amount,
          txHash,
          tokenAddress: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process deposit');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });

      // Confirm with a refresh
      setTimeout(() => get().fetchBalance(address, token), 1500);

      return data;
    } catch (error) {
      console.error('Error processing deposit:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process deposit'
      });
      throw error;
    }
  },

  /**
   * Process withdraw funds operation
   */
  withdrawFunds: async (address: string, amount: number, tokenAddress?: string) => {
    const { selectedToken } = get();
    const token = tokenAddress || selectedToken;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          amount,
          tokenAddress: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process withdrawal');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });

      // Confirm with a refresh
      setTimeout(() => get().fetchBalance(address, token), 1500);

      return data;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process withdrawal'
      });
      throw error;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  }
});
