/**
 * Tempo Network Client
 * Provides functions to interact with Tempo testnet tokens (TIP-20)
 */

import { createPublicClient, http, formatUnits, parseUnits, type Address } from 'viem';
import { TEMPO_CHAIN, TEMPO_TOKEN_LIST, DEFAULT_TOKEN_DECIMALS } from './config';

// TIP-20 Token ABI (minimal for balance + transfer)
const TIP20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
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
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
] as const;

// Create a public client for reading data
const publicClient = createPublicClient({
    chain: {
        id: TEMPO_CHAIN.id,
        name: TEMPO_CHAIN.name,
        nativeCurrency: TEMPO_CHAIN.nativeCurrency,
        rpcUrls: TEMPO_CHAIN.rpcUrls,
        blockExplorers: TEMPO_CHAIN.blockExplorers,
    },
    transport: http(TEMPO_CHAIN.rpcUrls.default.http[0]),
});

/**
 * Get token balance for a wallet on Tempo
 * @param walletAddress - The wallet address
 * @param tokenAddress - The TIP-20 token contract address
 * @returns Balance as a floating point number
 */
export async function getTempoTokenBalance(
    walletAddress: string,
    tokenAddress: string
): Promise<number> {
    try {
        const balance = await publicClient.readContract({
            address: tokenAddress as Address,
            abi: TIP20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as Address],
        });

        // Find token decimals from config, default to 6
        const tokenInfo = TEMPO_TOKEN_LIST.find(
            (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        const decimals = tokenInfo?.decimals ?? DEFAULT_TOKEN_DECIMALS;

        return parseFloat(formatUnits(balance as bigint, decimals));
    } catch (error) {
        console.error('Error fetching Tempo token balance:', error);
        return 0;
    }
}

/**
 * Get all token balances for a wallet
 * @param walletAddress - The wallet address
 * @returns Object with token addresses mapped to balances
 */
export async function getAllTempoBalances(
    walletAddress: string
): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};

    await Promise.all(
        TEMPO_TOKEN_LIST.map(async (token) => {
            const bal = await getTempoTokenBalance(walletAddress, token.address);
            balances[token.address] = bal;
        })
    );

    return balances;
}

/**
 * Get the Tempo Explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
    return `${TEMPO_CHAIN.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Get the Tempo Explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
    return `${TEMPO_CHAIN.blockExplorers.default.url}/address/${address}`;
}
