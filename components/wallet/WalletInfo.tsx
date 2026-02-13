import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/lib/store';

/**
 * WalletInfo Component - Tempo Network Version
 * Displays current wallet address and balance for the selected token
 */
export const WalletInfo: React.FC = () => {
  const address = useStore((state) => state.address);
  const isConnected = useStore((state) => state.isConnected);
  const walletBalance = useStore((state) => state.walletBalance);
  const selectedToken = useStore((state) => state.selectedToken);
  const refreshWalletBalance = useStore((state) => state.refreshWalletBalance);

  // Polling for balance updates
  useEffect(() => {
    if (isConnected && address) {
      refreshWalletBalance();
      const interval = setInterval(() => {
        refreshWalletBalance();
      }, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [isConnected, address, selectedToken, refreshWalletBalance]);

  if (!isConnected || !address) {
    return null;
  }

  // Format address
  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const currencySymbol = 'αUSD'; // Default for Tempo rebranding
  const networkName = 'Tempo Network';
  const balance = walletBalance.toFixed(4);

  return (
    <Card className="min-w-[200px] border border-white/10 !bg-black/40 backdrop-blur-md">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center p-1 border border-white/10 shrink-0">
            <div className="w-full h-full rounded bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">T</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{networkName} Address</p>
            <p className="text-white font-mono text-[11px] leading-tight">{formatAddress(address)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">Wallet Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-[#00f5ff] font-bold text-lg font-mono drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]">
              {balance}
            </p>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">{currencySymbol}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
