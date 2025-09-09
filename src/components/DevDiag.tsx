import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DevDiag() {
  if (import.meta.env.PROD) return null;
  const { user, profile, isAdmin } = useAuth();
  return (
    <div className="fixed bottom-2 right-2 rounded bg-black/80 text-white text-xs px-3 py-2 space-y-1">
      <div>User: {user?.email ?? '—'}</div>
      <div>Role: {profile?.role ?? '—'} {isAdmin ? '(admin)' : ''}</div>
      <div>URL: {import.meta.env.VITE_SUPABASE_URL ? 'ok' : 'missing'}</div>
    </div>
  );
}
