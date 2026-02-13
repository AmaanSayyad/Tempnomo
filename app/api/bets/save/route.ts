/**
 * API Route: Save a bet result to Supabase
 * POST /api/bets/save
 * 
 * Tempo Migration: Updated to support multi-token history and Tempo network
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            walletAddress,
            asset,
            direction,
            amount,
            multiplier,
            strikePrice,
            endPrice,
            payout,
            won,
            mode,
            network,
            tokenAddress
        } = body;

        if (!id || !walletAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('bet_history')
            .upsert({
                id,
                wallet_address: walletAddress.toLowerCase(),
                asset: asset || 'BTC',
                direction: direction || 'UP',
                amount: parseFloat(amount) || 0,
                multiplier: parseFloat(multiplier) || 1.9,
                strike_price: parseFloat(strikePrice) || 0,
                end_price: parseFloat(endPrice) || 0,
                payout: parseFloat(payout) || 0,
                won: !!won,
                mode: mode || 'classic',
                network: network || 'TEMPO',
                token_address: tokenAddress || '0x20c0000000000000000000000000000000000001', // Default AlphaUSD
                resolved_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('Supabase bet save error:', error);
            return NextResponse.json({ error: 'Failed to save bet' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving bet:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
