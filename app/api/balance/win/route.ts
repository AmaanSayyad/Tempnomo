/**
 * POST /api/balance/win endpoint
 * 
 * Tempo Migration: Updated to credit winnings on the new balances table with token support
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ethers } from 'ethers';

interface WinRequest {
    userAddress: string;
    winAmount: number;
    betId: string;
    tokenAddress: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: WinRequest = await request.json();
        const { userAddress, winAmount, betId, tokenAddress } = body;

        // Validate required fields
        if (!userAddress || winAmount === undefined || !tokenAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: userAddress, winAmount, tokenAddress' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(userAddress)) {
            return NextResponse.json(
                { error: 'Invalid Tempo address format' },
                { status: 400 }
            );
        }

        if (winAmount <= 0) {
            return NextResponse.json(
                { error: 'Win amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Get current balance
        const { data: userData, error: fetchError } = await supabaseAdmin
            .from('balances')
            .select('amount')
            .eq('wallet_address', userAddress)
            .eq('token_address', tokenAddress)
            .single();

        if (fetchError || !userData) {
            console.error('Error fetching balance:', fetchError);
            return NextResponse.json(
                { error: 'Balance record not found' },
                { status: 404 }
            );
        }

        const currentBalance = parseFloat(userData.amount.toString());
        const newBalance = currentBalance + winAmount;

        // Update balance
        const { error: updateError } = await supabaseAdmin
            .from('balances')
            .update({
                amount: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('wallet_address', userAddress)
            .eq('token_address', tokenAddress);

        if (updateError) {
            console.error('Error updating balance:', updateError);
            return NextResponse.json(
                { error: 'Failed to credit winnings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            newBalance: newBalance,
        });

    } catch (error) {
        console.error('Unexpected error in POST /api/balance/win:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
