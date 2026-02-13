'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useOverflowStore } from '@/lib/store';
import { useToast } from '@/lib/hooks/useToast';
import { TEMPO_TOKEN_LIST, TEMPO_CHAIN } from '@/lib/tempo/config';
import { parseUnits, createWalletClient, custom, type Address } from 'viem';

// TIP-20 transfer ABI
const TIP20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, txHash: string) => void;
  onError?: (error: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { wallets: privyWallets } = useWallets();
  const { authenticated } = usePrivy();

  const { depositFunds, walletBalance, refreshWalletBalance, address, selectedToken } = useOverflowStore();
  const toast = useToast();

  // Get current token info
  const currentToken = TEMPO_TOKEN_LIST.find(t => t.address === selectedToken) || TEMPO_TOKEN_LIST[0];
  const currencySymbol = currentToken.symbol;

  // Quick select amounts (stablecoin amounts)
  const quickAmounts = [10, 50, 100, 500];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Please enter an amount';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }

    if (numValue <= 0) {
      return 'Amount must be greater than zero';
    }

    if (numValue > walletBalance) {
      return `Insufficient ${currencySymbol} balance`;
    }

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleQuickSelect = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };

  const handleMaxClick = () => {
    if (walletBalance > 0) {
      setAmount(walletBalance.toFixed(4));
      setError(null);
    }
  };

  const handleDeposit = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const depositAmount = parseFloat(amount);

      // Get Privy wallet
      if (!authenticated) throw new Error('Not authenticated');
      const wallet = privyWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (!wallet) throw new Error('Wallet not found');

      const ethereumProvider = await wallet.getEthereumProvider();

      // Ensure we're on Tempo chain
      try {
        await ethereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${TEMPO_CHAIN.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added yet, add it
        if (switchError.code === 4902) {
          await ethereumProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${TEMPO_CHAIN.id.toString(16)}`,
              chainName: TEMPO_CHAIN.name,
              rpcUrls: [TEMPO_CHAIN.rpcUrls.default.http[0]],
              nativeCurrency: TEMPO_CHAIN.nativeCurrency,
              blockExplorerUrls: [TEMPO_CHAIN.blockExplorers.default.url],
            }],
          });
        }
      }

      toast.info('Please confirm the transaction in your wallet...');

      // Send TIP-20 token transfer to treasury
      const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as Address;
      if (!treasuryAddress) throw new Error('Treasury address not configured');

      const amountWei = parseUnits(depositAmount.toString(), currentToken.decimals);

      // Use Privy's ethereum provider to send the transaction
      const txHash = await ethereumProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: currentToken.address,
          data: encodeTIP20Transfer(treasuryAddress, amountWei),
        }],
      }) as string;

      toast.info('Transaction submitted. Waiting for confirmation...');

      // Update balance in database
      await depositFunds(address, depositAmount, txHash);

      // Refresh balances
      refreshWalletBalance();

      toast.success(
        `Successfully deposited ${depositAmount.toFixed(2)} ${currencySymbol}! Balance updated.`
      );

      if (onSuccess) onSuccess(depositAmount, txHash);
      onClose();
    } catch (err: any) {
      console.error('Deposit error:', err);
      const errorMessage = err.message || 'Failed to deposit funds';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deposit ${currencySymbol}`}
      showCloseButton={!isLoading}
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-[#00f5ff]/10 to-purple-500/10 border border-[#00f5ff]/30 rounded-lg p-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#00f5ff]/20 text-[#00f5ff] text-[8px] font-bold uppercase tracking-tighter rounded-bl-lg">
            Tempo Testnet
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-mono">
            Wallet Balance
          </p>
          <p className="text-[#00f5ff] text-xl font-bold font-mono flex items-center gap-2">
            {walletBalance.toFixed(4)} {currencySymbol}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="deposit-amount" className="text-gray-400 text-xs font-mono uppercase">Amount to Deposit</label>
          <div className="relative">
            <input
              id="deposit-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isLoading}
              className={`
                w-full px-4 py-3 bg-black/50 border rounded-lg text-lg
                text-white font-mono
                focus:outline-none focus:ring-1 focus:ring-[#00f5ff]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-[#00f5ff]/30'}
              `}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
              {currencySymbol}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleMaxClick}
              disabled={isLoading}
              className="text-[10px] text-[#00f5ff] hover:text-cyan-400 font-mono disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              Use Max
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickSelect(quickAmount)}
              disabled={isLoading}
              className={`
                px-2 py-2 rounded border font-mono text-xs
                transition-all duration-200
                ${amount === quickAmount.toString()
                  ? 'bg-[#00f5ff]/20 border-[#00f5ff] text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                  : 'bg-black/30 border-[#00f5ff]/30 text-gray-300 hover:border-[#00f5ff] hover:text-[#00f5ff]'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {quickAmount}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs font-mono">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            variant="primary"
            className="flex-1"
            disabled={isLoading || !amount || parseFloat(amount || '0') <= 0}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing</span>
              </span>
            ) : (
              `Deposit ${currencySymbol}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper: Encode TIP-20 transfer function call
function encodeTIP20Transfer(to: Address, amount: bigint): `0x${string}` {
  // function selector for transfer(address,uint256) = 0xa9059cbb
  const selector = 'a9059cbb';
  const toParam = to.slice(2).padStart(64, '0');
  const amountParam = amount.toString(16).padStart(64, '0');
  return `0x${selector}${toParam}${amountParam}` as `0x${string}`;
}
