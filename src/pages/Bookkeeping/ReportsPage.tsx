import React from 'react';
import { Layout } from '../../components/ui/Layout';


export default function ReportsPage() {
  return (
    <Layout title="Bookkeeping · Reports">
      <p className="text-sm text-gray-600">MVP: Use the Transactions page totals for now. If you want, I can wire daily revenue/fees charts using simple SQL aggregates.</p>
    </Layout>
  );
}

export { ReportsPage };