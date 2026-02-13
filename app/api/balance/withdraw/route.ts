import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ethers } from 'ethers';
import { transferTokenFromTreasury } from '@/lib/tempo/backend-client';

interface WithdrawRequest {
  userAddress: string;
  amount: number;
  tokenAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WithdrawRequest = await request.json();
    const { userAddress, amount, tokenAddress } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || amount === null || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, tokenAddress' },
        { status: 400 }
      );
    }

    // Validate Tempo address
    if (!ethers.isAddress(userAddress) && !/^0x[0-9a-fA-F]{64}$/.test(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid Tempo wallet address format' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than zero' },
        { status: 400 }
      );
    }

    // 1. Get house balance from Supabase and validate
    const { data: userData, error: userError } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('wallet_address', userAddress)
      .eq('token_address', tokenAddress)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User balance record not found' }, { status: 404 });
    }

    if (parseFloat(userData.amount.toString()) < amount) {
      return NextResponse.json({ error: 'Insufficient house balance' }, { status: 400 });
    }

    // 2. Perform transfer from treasury
    let signature: string;
    try {
      signature = await transferTokenFromTreasury(userAddress, amount, tokenAddress);
    } catch (e: any) {
      console.error('Transfer failed:', e);
      return NextResponse.json({ error: `Withdrawal failed: ${e.message}` }, { status: 500 });
    }

    // 3. Update Supabase balance
    const newBalance = parseFloat(userData.amount.toString()) - amount;
    const { error: updateError } = await supabaseAdmin
      .from('balances')
      .update({
        amount: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', userAddress)
      .eq('token_address', tokenAddress);

    if (updateError) {
      console.error('Database error in withdrawal update:', updateError);
      return NextResponse.json(
        {
          success: true,
          txHash: signature,
          warning: 'Tokens sent but balance update failed. Please contact support.',
          error: updateError.message
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash: signature,
      newBalance,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/balance/withdraw:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
