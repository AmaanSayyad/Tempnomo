/**
 * Tempo Network Backend Client
 * Performs secure administrative operations (like transfers from treasury)
 * ONLY FOR SERVER-SIDE USE
 */

import { createWalletClient, http, publicActions, parseUnits, type Address, getAddress, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

/**
 * Normalize private key from env to format viem expects (Hex).
 * Handles: 0x-prefixed hex, raw hex, or JSON array string (e.g. from MetaMask export).
 */
function normalizePrivateKey(raw: string): Hex {
  const trimmed = raw.trim();
  if (trimmed.startsWith('0x')) {
    return trimmed as Hex;
  }
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed) as number[];
    if (!Array.isArray(arr) || arr.length !== 32) {
      throw new Error('Invalid private key: JSON array must have 32 bytes');
    }
    const bytes = Uint8Array.from(arr);
    const hex = '0x' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex as Hex;
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return ('0x' + trimmed) as Hex;
  }
  throw new Error('Invalid private key format: use 0x-prefixed hex, 64-char hex, or 32-byte JSON array');
}

// Define Tempo chain (reusing logic from providers)
const tempoChain = defineChain({
    id: 42431,
    name: 'Tempo Testnet (Moderato)',
    nativeCurrency: {
        name: 'USD',
        symbol: 'USD',
        decimals: 18,
    },
    rpcUrls: {
        default: {
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
});

const TIP20_ABI = [
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
] as const;

/**
 * Transfer TIP-20 tokens from the treasury to a user's wallet
 */
export async function transferTokenFromTreasury(
    recipientAddress: string,
    amount: number,
    tokenAddress: string
): Promise<string> {
    const rawKey = process.env.TEMPO_TREASURY_SECRET_KEY;

    if (!rawKey) {
        throw new Error('TEMPO_TREASURY_SECRET_KEY not configured');
    }

    const privateKey = normalizePrivateKey(rawKey);
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: tempoChain,
        transport: http(),
    }).extend(publicActions);

    const recipient = getAddress(recipientAddress);
    const token = getAddress(tokenAddress);

    // Get token decimals
    const decimals = await client.readContract({
        address: token,
        abi: TIP20_ABI,
        functionName: 'decimals',
    });

    // Execute transfer
    const hash = await client.writeContract({
        address: token,
        abi: TIP20_ABI,
        functionName: 'transfer',
        args: [recipient, parseUnits(amount.toString(), decimals)],
    });

    return hash;
}
