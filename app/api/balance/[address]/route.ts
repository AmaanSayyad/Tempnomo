/**
 * GET /api/balance/[address] endpoint
 * 
 * Tempo Migration: Updated to support multi-token balances on Tempo network
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Basic Tempo address validation (must be 0x hex)
    if (!ethers.isAddress(address) && !/^0x[0-9a-fA-F]{64}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Tempo wallet address format' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required query parameter: token' },
        { status: 400 }
      );
    }

    // Query balances table by wallet_address and token_address
    const { data, error } = await supabase
      .from('balances')
      .select('amount, updated_at, tier')
      .eq('wallet_address', address)
      .eq('token_address', token)
      .single();

    // Handle database errors
    if (error) {
      // If user not found (PGRST116), return 0 balance
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          balance: 0,
          updatedAt: null,
          tier: 'free'
        });
      }

      console.error('Database error fetching balance:', error);
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      balance: parseFloat(data.amount.toString()),
      updatedAt: data.updated_at,
      tier: data.tier || 'free'
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/balance/[address]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
