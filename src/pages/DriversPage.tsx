import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Layout } from '../components/ui/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { StatusChip } from '../components/ui/StatusChip';
import { AddDriverModal } from '../components/AddDriverModal';
import { Search, Plus, Car, UserCheck, Users, Star } from 'lucide-react';
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
      
      if (q.trim()) {
        query = query.or(`name.ilike.%${q}%,vehicle_plate.ilike.%${q}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data!;
    }
  });

  // Summary statistics
  const summaryData = React.useMemo(() => {
    if (!listQ.data) return null;
    const total = listQ.data.length;
    const verified = listQ.data.filter(d => d.is_verified).length;
    const online = listQ.data.filter(d => d.online).length;
    const avgRating = listQ.data.reduce((sum, d) => sum + (d.rating || 0), 0) / total;
    return { total, verified, online, avgRating: avgRating || 0 };
  }, [listQ.data]);

  const onCreated = () => { qc.invalidateQueries({ queryKey: ['drivers'] }); };

  return (
    <Layout title="Drivers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.total ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.verified ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online Now</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData?.online ?? '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Car className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {summaryData ? summaryData.avgRating.toFixed(1) : '...'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Driver Management</h2>
              <Button onClick={() => setOpen(true)} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or plate..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            {listQ.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Rides</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listQ.data ?? []).length > 0 ? (
                    listQ.data!.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{d.name ?? '—'}</div>
                            <div className="text-gray-500 text-xs">{d.phone ?? '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{d.vehicle_plate ?? '—'}</div>
                            <div className="text-gray-500 text-xs">{d.vehicle_type ?? '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={d.online ? 'ONLINE' : 'OFFLINE'} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={d.is_verified ? 'VERIFIED' : 'PENDING'} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{Number(d.rating ?? 0).toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{d.total_rides ?? 0}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {q ? 'No drivers found matching your search' : 'No drivers found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            
            {listQ.isError && (
              <div className="text-center py-8 text-red-600">
                Error loading drivers: {(listQ.error as any)?.message}
              </div>
            )}
          </CardContent>
        </Card>
        <AddDriverModal open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
      </div>
    </Layout>
  );
};