import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAccounts } from '../../lib/api';
import { Layout } from '../../components/ui/Layout';

export default function AccountsPage() {
  const q = useQuery({ queryKey: ['accounts'], queryFn: () => listAccounts() });
  return (
    <Layout title="Bookkeeping · Accounts">
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">{a.code}</td>
                <td className="px-3 py-2">{a.name}</td>
                <td className="px-3 py-2 uppercase">{a.type}</td>
                <td className="px-3 py-2">{a.is_active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {q.isLoading && <tr><td className="px-3 py-6 text-center" colSpan={4}>Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export { AccountsPage }