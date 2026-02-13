import { createPublicClient, createWalletClient, http, publicActions, parseUnits, formatUnits, type Address, getAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

// Tempo Testnet (Moderato) definition
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
})

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
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const

async function main() {
    const privateKey = '0x2b9e3b8a095940cf3461e27bfb2bebb498df9a6381b76b9f9c48c9bbdc3c8192'
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const recipient = getAddress('0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6')
    const tokenAddress = getAddress('0x20c0000000000000000000000000000000000001') // αUSD

    const client = createPublicClient({
        chain: tempoChain,
        transport: http(),
    })

    const walletClient = createWalletClient({
        account,
        chain: tempoChain,
        transport: http(),
    }).extend(publicActions)

    console.log(`Checking balance for ${account.address} on token ${tokenAddress}...`)

    try {
        const decimals = await client.readContract({
            address: tokenAddress,
            abi: TIP20_ABI,
            functionName: 'decimals',
        })

        const balance = await client.readContract({
            address: tokenAddress,
            abi: TIP20_ABI,
            functionName: 'balanceOf',
            args: [account.address],
        })

        console.log(`Balance: ${formatUnits(balance, decimals)} (Decimals: ${decimals})`)

        const amountToSend = '50000'
        const parsedAmount = parseUnits(amountToSend, decimals)

        if (balance < parsedAmount) {
            console.error(`Insufficient balance. Have ${formatUnits(balance, decimals)}, need ${amountToSend}`)
            return
        }

        console.log(`Sending ${amountToSend} αUSD to ${recipient}...`)

        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: TIP20_ABI,
            functionName: 'transfer',
            args: [recipient, parsedAmount],
        })

        console.log('Transaction sent! Hash:', hash)
        console.log(`View on explorer: https://explore.tempo.xyz/tx/${hash}`)
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
