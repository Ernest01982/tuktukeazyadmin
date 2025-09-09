import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Car, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, signIn } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to sign in';
      
      if (error?.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = async () => {
    try {
      // Clear Supabase-related localStorage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tuktuk-admin-auth') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('tuktuk-admin-auth') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      // Clear service worker caches if present
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast.success('Session cleared successfully');
      
      // Force reload to reset all state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Reset session error:', error);
      toast.error('Failed to reset session');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">Tuk Tuk Eazy</h1>
            <p className="text-gray-600">Admin Dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuktuk.com"
              required
              error={error && !email ? 'Email is required' : undefined}
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              error={error && !password ? 'Password is required' : undefined}
            />
            
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={!email || !password}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetSession}
            >
              Reset Stuck Session
            </Button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Clear cached auth data if you're having login issues
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Admin access required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
