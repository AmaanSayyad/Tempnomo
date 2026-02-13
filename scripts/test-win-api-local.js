


async function main() {
    console.log("Testing /api/balance/win endpoint...");
    try {
        const response = await fetch('http://localhost:3000/api/balance/win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: '0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6',
                winAmount: 100,
                betId: 'test-bet-' + Date.now(),
                tokenAddress: '0x20c0000000000000000000000000000000000001'
            })
        });

        if (!response.ok) {
            console.error('API Error Status:', response.status);
            console.error('API Error Body:', await response.text());
        } else {
            console.log('API Success:', await response.json());
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

main();
