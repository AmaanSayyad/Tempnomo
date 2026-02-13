/**
 * Tempo Network Backend Client
 * Performs secure administrative operations (like transfers from treasury)
 * ONLY FOR SERVER-SIDE USE
 */

import { createWalletClient, http, publicActions, parseUnits, type Address, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

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
    const privateKey = process.env.TEMPO_TREASURY_SECRET_KEY;

    if (!privateKey) {
        throw new Error('TEMPO_TREASURY_SECRET_KEY not configured');
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
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
