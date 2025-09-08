import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEntriesForTxn, getTotalsForTxns, listAccounts, listLedgerTransactions } from '../../lib/api';
import { Layout } from '../../components/ui/Layout';
import type { UUID, LedgerTransaction, LedgerEntry, Account } from '../../lib/types';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const txnsQ = useQuery({
    queryKey: ['txns', page],
    queryFn: () => listLedgerTransactions(page, limit),
  });

  const ids = useMemo(() => (txnsQ.data ?? []).map(t => t.id), [txnsQ.data]);
  const totalsQ = useQuery({
    queryKey: ['txnTotals', ids],
    queryFn: () => getTotalsForTxns(ids),
    enabled: ids.length > 0,
  });

  const accountsQ = useQuery({
    queryKey: ['accounts'],
    queryFn: () => listAccounts(),
  });

  const [openTxn, setOpenTxn] = useState<UUID | null>(null);

  return (
    <Layout title="Bookkeeping · Transactions">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md border" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page===0}>Prev</button>
          <button className="px-3 py-2 rounded-md border" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Ride</th>
              <th className="px-3 py-2 text-right">Debits</th>
              <th className="px-3 py-2 text-right">Credits</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(txnsQ.data ?? []).map(t => {
              const sum = totalsQ.data?.get(t.id) || { debit: 0, credit: 0 };
              return (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">{new Date(t.occurred_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{t.description ?? '—'}</td>
                  <td className="px-3 py-2">{t.ride_id ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{sum.debit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{sum.credit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="px-2 py-1 rounded-md border" onClick={() => setOpenTxn(t.id)}>View</button>
                  </td>
                </tr>
              );
            })}
            {txnsQ.isLoading && <tr><td className="px-3 py-6 text-center" colSpan={6}>Loading…</td></tr>}
            {!txnsQ.isLoading && (txnsQ.data ?? []).length === 0 && <tr><td className="px-3 py-6 text-center" colSpan={6}>No transactions</td></tr>}
          </tbody>
        </table>
      </div>

      {openTxn && <TxnDrawer txnId={openTxn} onClose={() => setOpenTxn(null)} accounts={accountsQ.data ?? []} />}
    </Layout>
  );
}

function TxnDrawer({ txnId, onClose, accounts }: { txnId: UUID; onClose: () => void; accounts: Account[] }) {
  const entriesQ = useQuery({
    queryKey: ['txnEntries', txnId],
    queryFn: () => getEntriesForTxn(txnId),
  });
  const accMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-[1fr_auto]">
      <div className="bg-black/40" onClick={onClose} />
      <div className="h-full w-[480px] bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Transaction {txnId.slice(0,8)}…</h2>
          <button className="px-3 py-1.5 rounded-md border" onClick={onClose}>Close</button>
        </div>
        <div className="text-sm">
          {entriesQ.isLoading && <div>Loading entries…</div>}
          {entriesQ.data && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-center">Currency</th>
                </tr>
              </thead>
              <tbody>
                {entriesQ.data.map((e: LedgerEntry) => {
                  const a = accMap.get(e.account_id);
                  return (
                    <tr key={e.id} className="border-t">
                      <td className="px-3 py-2">{a ? `${a.code} — ${a.name}` : e.account_id}</td>
                      <td className="px-3 py-2 text-right">{e.debit.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{e.credit.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{e.currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export { TransactionsPage }