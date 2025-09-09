import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Layout } from '../components/ui/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { StatusChip } from '../components/ui/StatusChip';
import { RideDetailDrawer } from './RideDetailDrawer';
import { formatCurrency, formatDateTime, truncateText } from '../lib/fmt';
import { Search, Filter, MapPin, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ride, Driver, Profile } from '../lib/types';

interface RideWithRelations extends Ride {
  riders?: Profile;
  drivers?: Driver & { profiles?: Profile };
}

const RIDE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ENROUTE', label: 'En Route' },
  { value: 'STARTED', label: 'Started' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const RidesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();
  const { data: ridesData, isLoading } = useQuery({
    queryKey: ['rides', searchTerm, statusFilter, unassignedOnly, currentPage],
    queryFn: async (): Promise<{ rides: RideWithRelations[]; total: number }> => {
      let query = supabase
        .from('rides')
        .select(`
          *,
          riders:profiles!rides_rider_id_fkey(id, email),
          drivers(
            id, name, vehicle_plate,
            profiles!drivers_id_fkey(email)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchTerm) {
        query = query.or(`pickup_address.ilike.%${searchTerm}%,dropoff_address.ilike.%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (unassignedOnly) {
        query = query.is('driver_id', null);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        rides: data || [],
        total: count || 0,
      };
    },
  });

  // Summary statistics
  const summaryData = React.useMemo(() => {
    if (!ridesData) return null;
    const requested = ridesData.rides.filter(r => r.status === 'REQUESTED').length;
    const unassigned = ridesData.rides.filter(r => !r.driver_id).length;
    const active = ridesData.rides.filter(r => ['ASSIGNED', 'ENROUTE', 'STARTED'].includes(r.status)).length;
    return { requested, unassigned, active };
  }, [ridesData]);

  const assignDriverMutation = useMutation({
    mutationFn: async ({ rideId, driverId }: { rideId: string; driverId: string }) => {
      const { data, error } = await supabase
        .from('rides')
        .update({ 
          driver_id: driverId,
          status: 'ASSIGNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .eq('status', 'REQUESTED')
        .is('driver_id', null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Driver assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: any) => {
      console.error('Assign driver error:', error);
      toast.error('Failed to assign driver');
    },
  });

  const updateRideStatusMutation = useMutation({
    mutationFn: async ({ rideId, status }: { rideId: string; status: string }) => {
      const { data, error } = await supabase
        .from('rides')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Ride status updated!');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: any) => {
      console.error('Update ride status error:', error);
      toast.error('Failed to update ride status');
    },
  });

  // Set up real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('rides-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rides'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const totalPages = ridesData ? Math.ceil(ridesData.total / pageSize) : 0;

  return (
    <Layout title="Rides">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested Rides</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.requested ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unassigned Rides</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.unassigned ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rides</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.active ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Ride Management</h2>
              <div className="text-sm text-gray-600">
                {ridesData ? `${ridesData.total} rides total` : ''}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                placeholder="All statuses"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={RIDE_STATUSES}
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="unassigned-only"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="unassigned-only" className="text-sm text-gray-700">
                  Unassigned only
                </label>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ridesData?.rides && ridesData.rides.length > 0 ? (
                      ridesData.rides.map((ride) => (
                        <TableRow
                          key={ride.id}
                          onClick={() => setSelectedRideId(ride.id)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium text-sm">
                                {truncateText(ride.pickup_address, 30)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                → {truncateText(ride.dropoff_address, 30)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {ride.riders?.email || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {ride.drivers ? (
                              <div>
                                <div className="font-medium text-sm">
                                  {ride.drivers.name}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {ride.drivers.vehicle_plate}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={ride.status} />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {formatCurrency(ride.estimated_fare)}
                              </div>
                              {ride.final_fare && (
                                <div className="text-gray-500 text-xs">
                                  Final: {formatCurrency(ride.final_fare)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDateTime(ride.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No rides found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, ridesData?.total || 0)} of {ridesData?.total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Ride Detail Drawer */}
        <RideDetailDrawer
          rideId={selectedRideId}
          isOpen={!!selectedRideId}
          onClose={() => setSelectedRideId(null)}
          onAssignDriver={assignDriverMutation.mutate}
          onUpdateStatus={updateRideStatusMutation.mutate}
        />
      </div>
    </Layout>
  );
};