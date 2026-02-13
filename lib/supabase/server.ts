/**
 * Supabase Admin Client Configuration
 * 
 * Provides a client that uses the service_role key to bypass RLS.
 * IMPORTANT: This client should ONLY be used in server-side routes (API routes, Server Components).
 * NEVER expose this key to the client side.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for server-side client');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
