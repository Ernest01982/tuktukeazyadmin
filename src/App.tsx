import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DriversPage } from './pages/DriversPage';
import { TransactionsPage } from './pages/Bookkeeping/TransactionsPage';
import { AccountsPage } from './pages/Bookkeeping/AccountsPage';
import { PayoutsPage } from './pages/Bookkeeping/PayoutsPage';
import { ReportsPage } from './pages/Bookkeeping/ReportsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><DriversPage/></ProtectedRoute>} />
      <Route path="/bookkeeping/transactions" element={<ProtectedRoute><TransactionsPage/></ProtectedRoute>} />
      <Route path="/bookkeeping/accounts" element={<ProtectedRoute><AccountsPage/></ProtectedRoute>} />
      <Route path="/bookkeeping/payouts" element={<ProtectedRoute><PayoutsPage/></ProtectedRoute>} />
      <Route path="/bookkeeping/reports" element={<ProtectedRoute><ReportsPage/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}