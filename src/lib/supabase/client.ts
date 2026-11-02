import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalClient = globalThis as typeof globalThis & {
  __b42Supabase?: { signature: string; client: SupabaseClient };
};

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Supabase is not configured.");
  const signature = `${url}|${key}`;
  if (!globalClient.__b42Supabase || globalClient.__b42Supabase.signature !== signature) {
    globalClient.__b42Supabase = {
      signature,
      client: createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    };
  }
  return globalClient.__b42Supabase.client;
}
