// src/lib/api.ts (or in AddDriverModal)
import { supabase } from '../lib/supabaseClient';
import type { UUID, Account, LedgerTransaction, LedgerEntry, Driver, Profile } from './types';

export async function adminCreateDriverWithFallback(payload: {
  email: string; password?: string;
  name?: string; phone?: string; license_number?: string;
  vehicle_type?: string; vehicle_plate?: string; is_verified?: boolean;
}) {
  // Try Edge first
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const { data, error } = await supabase.functions.invoke('admin-create-driver', {
      body: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (error) {
      // Pull the server-provided JSON/body for clarity
      const ctx: any = (error as any).context;
      const status = ctx?.response?.status;
      let bodyText = '';
      try { bodyText = await ctx.response.text(); } catch {}
      throw new Error(`Edge ${status ?? ''}: ${bodyText || error.message}`);
    }
    return data;
  } catch (err: any) {
    const msg = String(err?.message || '');
    // Network / 404 / CORS → fallback path
    if (/Failed to send a request|network|404|Edge \d+:/i.test(msg)) {
      const { error: rpcErr } = await supabase.rpc('admin_create_driver', {
        p_email: payload.email,
        p_name: payload.name ?? null,
        p_phone: payload.phone ?? null,
        p_license: payload.license_number ?? null,
        p_vehicle_type: payload.vehicle_type ?? null,
        p_vehicle_plate: payload.vehicle_plate ?? null,
        p_is_verified: payload.is_verified ?? true,
      });
      if (rpcErr) {
        throw new Error(`Edge unreachable; RPC failed: ${rpcErr.message}`);
      }
      return { ok: true, fallback: 'rpc' };
    }
    throw err;
  }
}

// Bookkeeping API functions
export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('code');
  
  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
  return data || [];
}

export async function listLedgerTransactions(page: number = 0, limit: number = 20): Promise<LedgerTransaction[]> {
  const { data, error } = await supabase
    .from('ledger_transactions')
    .select('*')
    .order('occurred_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  
  if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
  return data || [];
}

export async function getEntriesForTxn(txnId: UUID): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('txn_id', txnId)
    .order('debit', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
  return data || [];
}

export async function getTotalsForTxns(txnIds: UUID[]): Promise<Map<UUID, { debit: number; credit: number }>> {
  if (txnIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('txn_id, debit, credit')
    .in('txn_id', txnIds);
  
  if (error) throw new Error(`Failed to fetch totals: ${error.message}`);
  
  const totals = new Map<UUID, { debit: number; credit: number }>();
  
  (data || []).forEach(entry => {
    const existing = totals.get(entry.txn_id) || { debit: 0, credit: 0 };
    existing.debit += parseFloat(entry.debit.toString());
    existing.credit += parseFloat(entry.credit.toString());
    totals.set(entry.txn_id, existing);
  });
  
  return totals;
}

export async function searchDrivers(query: string = ''): Promise<Driver[]> {
  let queryBuilder = supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (query.trim()) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,vehicle_plate.ilike.%${query}%`);
  }
  
  const { data, error } = await queryBuilder;
  
  if (error) throw new Error(`Failed to search drivers: ${error.message}`);
  return data || [];
}

export async function fetchProfilesByIds(ids: UUID[]): Promise<Map<UUID, Profile>> {
  if (ids.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);
  
  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
  
  const profileMap = new Map<UUID, Profile>();
  (data || []).forEach(profile => {
    profileMap.set(profile.id, profile);
  });
  
  return profileMap;
}

export async function postDriverPayout(driverId: UUID, amount: number, currency: string = 'ZAR', note: string = ''): Promise<void> {
  const { error } = await supabase.rpc('post_driver_payout', {
    p_driver_id: driverId,
    p_amount: amount,
    p_currency: currency,
    p_note: note || null
  });
  
  if (error) throw new Error(`Failed to post payout: ${error.message}`);
}