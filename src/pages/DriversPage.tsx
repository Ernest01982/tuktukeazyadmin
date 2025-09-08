import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { AddDriverModal } from '../components/AddDriverModal';
import toast from 'react-hot-toast';

export const DriversPage: React.FC = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ['drivers', q],
    queryFn: async () => {
      let query = supabase
        .from('drivers')
        .select('id,name,phone,license_number,vehicle_type,vehicle_plate,is_verified,online,rating,total_rides,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);
      const { data, error } = await query;
      if (error) throw error;
      return data!;
    }
  });

  const onCreated = () => { qc.invalidateQueries({ queryKey: ['drivers'] }); };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Drivers</h1>
        <button className="px-3 py-2 rounded-md bg-teal-600 text-white" onClick={()=>setOpen(true)}>Add Driver</button>
      </div>
      <div className="mb-3">
        <input className="w-full max-w-md rounded-md border p-2" placeholder="Search name/plate…"
          value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Plate</th>
              <th className="px-3 py-2 text-left">Verified</th>
              <th className="px-3 py-2 text-left">Online</th>
              <th className="px-3 py-2 text-right">Rating</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).filter(d => {
              if (!q) return true;
              return (d.name?.toLowerCase().includes(q.toLowerCase()) || d.vehicle_plate?.toLowerCase().includes(q.toLowerCase()));
            }).map(d => (
              <tr key={d.id} className="border-t">
                <td className="px-3 py-2">{d.name ?? '—'}</td>
                <td className="px-3 py-2">{d.vehicle_plate ?? '—'}</td>
                <td className="px-3 py-2">{d.is_verified ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{d.online ? 'Online' : 'Offline'}</td>
                <td className="px-3 py-2 text-right">{Number(d.rating ?? 0).toFixed(1)}</td>
              </tr>
            ))}
            {listQ.isLoading && <tr><td colSpan={5} className="px-3 py-6 text-center">Loading…</td></tr>}
            {listQ.isError && <tr><td colSpan={5} className="px-3 py-6 text-center text-red-600">{(listQ.error as any)?.message}</td></tr>}
          </tbody>
        </table>
      </div>

      <AddDriverModal open={open} onClose={()=>setOpen(false)} onCreated={onCreated} />
    </div>
  );
};