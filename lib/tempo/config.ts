/**
 * Tempo Network Configuration
 * Chain: Tempo Testnet (Moderato)
 * Chain ID: 42431
 */

// Tempo Testnet Token Addresses
export const TEMPO_TOKENS = {
    alphaUsd: '0x20c0000000000000000000000000000000000001' as `0x${string}`,
    betaUsd: '0x20c0000000000000000000000000000000000002' as `0x${string}`,
    thetaUsd: '0x20c0000000000000000000000000000000000003' as `0x${string}`,
    pathUsd: '0x20c0000000000000000000000000000000000000' as `0x${string}`,
} as const;

// Token names for display
export const TEMPO_TOKEN_NAMES: Record<string, string> = {
    [TEMPO_TOKENS.alphaUsd]: 'AlphaUSD',
    [TEMPO_TOKENS.betaUsd]: 'BetaUSD',
    [TEMPO_TOKENS.thetaUsd]: 'ThetaUSD',
    [TEMPO_TOKENS.pathUsd]: 'PathUSD',
};

// Token list for UI selectors
export const TEMPO_TOKEN_LIST = [
    { address: TEMPO_TOKENS.alphaUsd, symbol: 'αUSD', name: 'AlphaUSD', decimals: 6 },
    { address: TEMPO_TOKENS.betaUsd, symbol: 'βUSD', name: 'BetaUSD', decimals: 6 },
    { address: TEMPO_TOKENS.thetaUsd, symbol: 'θUSD', name: 'ThetaUSD', decimals: 6 },
    { address: TEMPO_TOKENS.pathUsd, symbol: 'pUSD', name: 'PathUSD', decimals: 6 },
];

// Default token for game play
export const DEFAULT_TOKEN = TEMPO_TOKENS.alphaUsd;
export const DEFAULT_TOKEN_SYMBOL = 'αUSD';
export const DEFAULT_TOKEN_DECIMALS = 6;

// Tempo Testnet Chain Config
export const TEMPO_CHAIN = {
    id: 42431,
    name: 'Tempo Testnet (Moderato)',
    network: 'tempo-moderato',
    nativeCurrency: {
        name: 'USD',
        symbol: 'USD',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://rpc.moderato.tempo.xyz'] },
        public: { http: ['https://rpc.moderato.tempo.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Tempo Explorer', url: 'https://explore.tempo.xyz' },
    },
    testnet: true,
} as const;

// Treasury address for the game (will be set via env)
export const getTreasuryAddress = (): `0x${string}` => {
    const addr = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    if (!addr) throw new Error('NEXT_PUBLIC_TREASURY_ADDRESS not set');
    return addr as `0x${string}`;
};

// Fee sponsor endpoint for gasless transactions
export const FEE_SPONSOR_URL = 'https://sponsor.testnet.tempo.xyz';
