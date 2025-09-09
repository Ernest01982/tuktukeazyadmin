import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Layout } from '../components/ui/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { StatusChip } from '../components/ui/StatusChip';
import { formatCurrency, formatDateTime } from '../lib/fmt';
import { Users, Car, MapPin, Activity, TrendingUp } from 'lucide-react';
import type { Ride } from '../lib/types';
import DevDiag from '../components/DevDiag';

interface KPIData {
  activeRides: number;
  requestedRides: number;
  onlineDrivers: number;
  completedToday: number;
}

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: async (): Promise<KPIData> => {
      const today = new Date().toISOString().split('T')[0];
      
      const [activeRides, requestedRides, onlineDrivers, completedToday] = await Promise.all([
        supabase
          .from('rides')
          .select('id', { count: 'exact' })
          .in('status', ['ASSIGNED', 'ENROUTE', 'STARTED']),
        supabase
          .from('rides')
          .select('id', { count: 'exact' })
          .eq('status', 'REQUESTED'),
        supabase
          .from('drivers')
          .select('id', { count: 'exact' })
          .eq('is_verified', true)
          .eq('online', true),
        supabase
          .from('rides')
          .select('id', { count: 'exact' })
          .eq('status', 'COMPLETED')
          .gte('created_at', today)
      ]);

      return {
        activeRides: activeRides.count || 0,
        requestedRides: requestedRides.count || 0,
        onlineDrivers: onlineDrivers.count || 0,
        completedToday: completedToday.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async (): Promise<Ride[]> => {
      const { data, error } = await supabase
        .from('rides')
        .select('id, pickup_address, dropoff_address, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Set up real-time subscription for rides
  React.useEffect(() => {
    const channel = supabase
      .channel('dashboard-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpi'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const kpiCards = [
    {
      title: 'Active Rides',
      value: kpiData?.activeRides || 0,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Requested Rides',
      value: kpiData?.requestedRides || 0,
      icon: MapPin,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Online Drivers',
      value: kpiData?.onlineDrivers || 0,
      icon: Car,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Completed Today',
      value: kpiData?.completedToday || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-ink mt-1">
                        {kpiLoading ? '...' : card.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-ink">Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {ride.pickup_address} → {ride.dropoff_address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(ride.updated_at || ride.created_at)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <StatusChip status={ride.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <DevDiag />
    </Layout>
  );
};
