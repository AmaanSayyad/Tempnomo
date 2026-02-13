-- TEMPNOMO SUPABASE SCHEMA
-- Migration to Tempo Testnet

-- 1. Balances Table (Token-aware)
CREATE TABLE IF NOT EXISTS public.balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    token_address TEXT NOT NULL, -- TIP-20 Token address on Tempo
    amount DECIMAL NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'free',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(wallet_address, token_address)
);

-- Enable RLS for balances
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read balances" ON public.balances FOR SELECT USING (true);

-- 2. Bet History Table
CREATE TABLE IF NOT EXISTS public.bet_history (
    id TEXT PRIMARY KEY, -- Unique ID from frontend
    wallet_address TEXT NOT NULL,
    asset TEXT NOT NULL, -- e.g. BTC, ETH, BNB
    direction TEXT NOT NULL, -- UP or DOWN
    amount DECIMAL NOT NULL,
    multiplier DECIMAL NOT NULL,
    strike_price DECIMAL NOT NULL,
    end_price DECIMAL NOT NULL,
    payout DECIMAL NOT NULL,
    won BOOLEAN NOT NULL,
    mode TEXT NOT NULL, -- classic or box
    network TEXT NOT NULL DEFAULT 'TEMPO',
    token_address TEXT NOT NULL, -- The currency used for the bet
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for history
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read history" ON public.bet_history FOR SELECT USING (true);

-- 3. Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    wallet_address,
    SUM(payout - amount) as total_profit,
    COUNT(*) as total_bets,
    COUNT(*) FILTER (WHERE won) as wins,
    token_address
FROM 
    public.bet_history
GROUP BY 
    wallet_address, token_address
ORDER BY 
    total_profit DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_balances_address ON public.balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_history_address ON public.bet_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_history_token ON public.bet_history(token_address);
