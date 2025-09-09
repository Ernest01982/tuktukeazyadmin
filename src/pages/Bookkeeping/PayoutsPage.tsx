import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchProfilesByIds, postDriverPayout, searchDrivers } from '../../lib/api';
import { Layout } from '../../components/ui/Layout';
import toast from 'react-hot-toast';
import type { Driver } from '../../lib/types';

export default function PayoutsPage() {
  const [q, setQ] = useState('');
  const driversQ = useQuery({ queryKey: ['drivers', q], queryFn: () => searchDrivers(q) });
  const ids = useMemo(() => (driversQ.data ?? []).map(d => d.id), [driversQ.data]);
  const profsQ = useQuery({ queryKey: ['profiles', ids], queryFn: () => fetchProfilesByIds(ids), enabled: ids.length > 0 });

  const [selected, setSelected] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const payout = useMutation({
    mutationFn: () => postDriverPayout(selected, amount, 'ZAR', note),
    onSuccess: () => { toast.success('Payout posted to ledger'); setAmount(0); setNote(''); },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to post payout'),
  });

  const emailOf = (driverId: string) => profsQ.data?.get(driverId)?.email ?? '—';

  return (
    <Layout title="Bookkeeping · Payouts">
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <div className="md:col-span-2">
          <label className="text-sm">Find Driver
            <input className="mt-1 w-full rounded-md border p-2" placeholder="Search by name, email, or plate"
              value={q} onChange={e=>setQ(e.target.value)} />
          </label>
          <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Select</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Plate</th>
                  <th className="px-3 py-2 text-left">Verified</th>
                </tr>
              </thead>
              <tbody>
                {(driversQ.data ?? []).map((d: Driver) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2">
                      <input type="radio" name="driver" checked={selected===d.id} onChange={()=>setSelected(d.id)} />
                    </td>
                    <td className="px-3 py-2">{d.name ?? '—'}</td>
                    <td className="px-3 py-2">{emailOf(d.id)}</td>
                    <td className="px-3 py-2">{d.vehicle_plate ?? '—'}</td>
                    <td className="px-3 py-2">{d.is_verified ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {driversQ.isLoading && <tr><td className="px-3 py-6 text-center" colSpan={5}>Loading…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="rounded-lg border p-3">
            <h2 className="font-medium mb-2">Create Payout</h2>
            <label className="text-sm block mb-2">Amount (ZAR)
              <input type="number" min={0} step="0.01" className="mt-1 w-full rounded-md border p-2"
                value={amount} onChange={e=>setAmount(parseFloat(e.target.value))} />
            </label>
            <label className="text-sm block mb-3">Note (optional)
              <input className="mt-1 w-full rounded-md border p-2" value={note} onChange={e=>setNote(e.target.value)} />
            </label>
            <button disabled={!selected || amount<=0 || payout.isPending}
              className="w-full px-3 py-2 rounded-md bg-teal-600 text-white"
              onClick={() => payout.mutate()}>
              {payout.isPending ? 'Posting…' : 'Post Payout'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export { PayoutsPage };
