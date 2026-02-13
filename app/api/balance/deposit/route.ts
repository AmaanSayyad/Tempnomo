/**
 * POST /api/balance/deposit endpoint
 * 
 * Tempo Migration: Updated to process multi-token deposits on Tempo network
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ethers } from 'ethers';

interface DepositRequest {
  userAddress: string;
  amount: number;
  txHash: string;
  tokenAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DepositRequest = await request.json();
    const { userAddress, amount, txHash, tokenAddress } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || !txHash || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, txHash, tokenAddress' },
        { status: 400 }
      );
    }

    // Basic address validation
    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid user wallet address' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than zero' },
        { status: 400 }
      );
    }

    // UPSERT balance logic
    // In a prod environment, you would verify the txHash on-chain here

    // First, check if balance exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('wallet_address', userAddress)
      .eq('token_address', tokenAddress)
      .single();

    let newBalance = amount;
    if (existing) {
      newBalance = parseFloat(existing.amount.toString()) + amount;
      const { error: updateError } = await supabaseAdmin
        .from('balances')
        .update({ amount: newBalance, updated_at: new Date().toISOString() })
        .eq('wallet_address', userAddress)
        .eq('token_address', tokenAddress);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('balances')
        .insert({
          wallet_address: userAddress,
          token_address: tokenAddress,
          amount: newBalance,
          tier: 'free'
        });

      if (insertError) throw insertError;
    }

    // Log the transaction (audit trail)
    // Note: You might want a separate audit table or just use History

    return NextResponse.json({
      success: true,
      newBalance,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/balance/deposit:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your deposit' },
      { status: 500 }
    );
  }
}
