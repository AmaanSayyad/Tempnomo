/**
 * POST /api/balance/bet endpoint
 * 
 * Tempo Migration: Updated to process multi-token bets on Tempo network
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ethers } from 'ethers';

interface BetRequest {
  userAddress: string;
  betAmount: number;
  tokenAddress: string;
  multiplier: number;
  direction: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BetRequest = await request.json();
    const { userAddress, betAmount, tokenAddress, multiplier, direction } = body;

    // Validate required fields
    if (!userAddress || betAmount === undefined || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, betAmount, tokenAddress' },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid Tempo address format' },
        { status: 400 }
      );
    }

    if (betAmount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than zero' },
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
      return NextResponse.json(
        { error: 'Insufficient balance: Account not found' },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(userData.amount.toString());

    if (currentBalance < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient house balance' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - betAmount;

    // Deduct balance atomically (simple update for now, in prod use RPC/Transaction)
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
        { error: 'Failed to process bet' },
        { status: 500 }
      );
    }

    // Generate a bet ID
    const betId = `bet_${Date.now()}_${userAddress.slice(-6)}`;

    return NextResponse.json({
      success: true,
      remainingBalance: newBalance,
      betId,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/balance/bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
