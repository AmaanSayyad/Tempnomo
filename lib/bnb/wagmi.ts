import { createConfig, http } from 'wagmi';
import { TEMPO_CHAIN } from '@/lib/tempo/config';

// Define the Tempo Moderato chain for wagmi
const tempoModerato = {
    id: TEMPO_CHAIN.id,
    name: TEMPO_CHAIN.name,
    nativeCurrency: TEMPO_CHAIN.nativeCurrency,
    rpcUrls: TEMPO_CHAIN.rpcUrls,
    blockExplorers: TEMPO_CHAIN.blockExplorers,
    testnet: true,
} as const;

export const config = createConfig({
    chains: [tempoModerato],
    transports: {
        [tempoModerato.id]: http(TEMPO_CHAIN.rpcUrls.default.http[0]),
    },
});
