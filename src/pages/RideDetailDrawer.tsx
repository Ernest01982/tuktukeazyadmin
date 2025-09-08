import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Drawer } from '../components/ui/Drawer';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { StatusChip } from '../components/ui/StatusChip';
import { formatCurrency, formatDateTime, formatPhoneNumber } from '../lib/fmt';
import { MapPin, User, Car, CreditCard, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ride, Driver, Profile, Payment } from '../lib/types';

interface RideWithRelations extends Ride {
  riders?: Profile;
  drivers?: Driver & { profiles?: Profile };
  payments?: Payment;
}

interface RideDetailDrawerProps {
  rideId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignDriver: (params: { rideId: string; driverId: string }) => void;
  onUpdateStatus: (params: { rideId: string; status: string }) => void;
}

const RIDE_STATUSES = [
  'ASSIGNED',
  'ENROUTE', 
  'STARTED',
  'COMPLETED',
  'CANCELLED'
];

export const RideDetailDrawer: React.FC<RideDetailDrawerProps> = ({
  rideId,
  isOpen,
  onClose,
  onAssignDriver,
  onUpdateStatus,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride-detail', rideId],
    queryFn: async (): Promise<RideWithRelations | null> => {
      if (!rideId) return null;
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          riders:profiles!rides_rider_id_fkey(id, email),
          drivers(
            id, name, phone, vehicle_type, vehicle_plate,
            profiles!drivers_id_fkey(email)
          ),
          payments(*)
        `)
        .eq('id', rideId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!rideId,
  });

  const { data: availableDrivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async (): Promise<Driver[]> => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, vehicle_plate, vehicle_type')
        .eq('is_verified', true)
        .eq('online', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!ride && ride.status === 'REQUESTED' && !ride.driver_id,
  });

  const postPaymentMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const { data, error } = await supabase.rpc('post_ride_payment', {
        p_ride_id: rideId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Payment posted to ledger successfully!');
      queryClient.invalidateQueries({ queryKey: ['ride-detail', rideId] });
    },
    onError: (error: any) => {
      console.error('Post payment error:', error);
      toast.error('Failed to post payment to ledger');
    },
  });

  const handleAssignDriver = () => {
    if (!ride || !selectedDriverId) return;
    onAssignDriver({ rideId: ride.id, driverId: selectedDriverId });
    setSelectedDriverId('');
  };

  const handleUpdateStatus = () => {
    if (!ride || !selectedStatus) return;
    
    const confirmMessage = `Are you sure you want to change the ride status to ${selectedStatus}?`;
    if (window.confirm(confirmMessage)) {
      onUpdateStatus({ rideId: ride.id, status: selectedStatus });
      setSelectedStatus('');
    }
  };

  const handlePostPayment = () => {
    if (!ride?.payments?.id) return;
    
    const confirmMessage = 'Post this payment to the ledger? This action cannot be undone.';
    if (window.confirm(confirmMessage)) {
      postPaymentMutation.mutate(ride.id);
    }
  };

  if (isLoading) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </Drawer>
    );
  }

  if (!ride) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title="Ride Not Found">
        <div className="text-center py-8 text-gray-500">
          Ride details could not be loaded.
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Ride Details" className="w-full max-w-2xl">
      <div className="space-y-6">
        {/* Status Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Status</h3>
              <StatusChip status={ride.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-medium">{formatDateTime(ride.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-600">Updated:</span>
                <p className="font-medium">{formatDateTime(ride.updated_at || ride.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-600">Estimated Fare:</span>
                <p className="font-medium">{formatCurrency(ride.estimated_fare)}</p>
              </div>
              {ride.final_fare && (
                <div>
                  <span className="text-gray-600">Final Fare:</span>
                  <p className="font-medium">{formatCurrency(ride.final_fare)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium">Route</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 text-sm">Pickup Address:</span>
                <p className="font-medium">{ride.pickup_address}</p>
                <p className="text-xs text-gray-500">
                  ({ride.pickup_lat}, {ride.pickup_lng})
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Dropoff Address:</span>
                <p className="font-medium">{ride.dropoff_address}</p>
                <p className="text-xs text-gray-500">
                  ({ride.dropoff_lat}, {ride.dropoff_lng})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium">Rider</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{ride.riders?.email || 'Unknown rider'}</p>
          </CardContent>
        </Card>

        {/* Driver Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium">Driver</h3>
            </div>
          </CardHeader>
          <CardContent>
            {ride.drivers ? (
              <div className="space-y-2">
                <p className="font-medium">{ride.drivers.name}</p>
                <p className="text-sm text-gray-600">{ride.drivers.profiles?.email}</p>
                <p className="text-sm text-gray-600">{formatPhoneNumber(ride.drivers.phone)}</p>
                <div className="flex gap-4 text-sm">
                  <span>
                    <span className="text-gray-600">Vehicle:</span> {ride.drivers.vehicle_plate}
                  </span>
                  <span>
                    <span className="text-gray-600">Type:</span> {ride.drivers.vehicle_type}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500">No driver assigned</p>
                
                {ride.status === 'REQUESTED' && availableDrivers && (
                  <div className="space-y-3">
                    <Select
                      label="Assign Driver"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      options={[
                        { value: '', label: 'Select a driver...' },
                        ...availableDrivers.map((driver) => ({
                          value: driver.id,
                          label: `${driver.name} - ${driver.vehicle_plate} (${driver.vehicle_type})`,
                        })),
                      ]}
                    />
                    <Button
                      onClick={handleAssignDriver}
                      disabled={!selectedDriverId}
                      variant="primary"
                      size="sm"
                    >
                      Assign Driver
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        {ride.payments && (
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-medium">Payment</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(ride.payments.amount, ride.payments.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusChip status={ride.payments.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processor Fee:</span>
                  <span className="font-medium">{formatCurrency(ride.payments.processor_fee, ride.payments.currency)}</span>
                </div>
                {ride.payments.stripe_payment_intent_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stripe ID:</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {ride.payments.stripe_payment_intent_id}
                    </span>
                  </div>
                )}
                
                {ride.payments.status === 'SUCCEEDED' && (
                  <div className="pt-3 border-t">
                    <Button
                      onClick={handlePostPayment}
                      variant="primary"
                      size="sm"
                      loading={postPaymentMutation.isPending}
                    >
                      Post Payment to Ledger
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium">Admin Actions</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Select
                  label="Override Status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={[
                    { value: '', label: 'Select new status...' },
                    ...RIDE_STATUSES.map((status) => ({
                      value: status,
                      label: status,
                    })),
                  ]}
                />
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!selectedStatus || selectedStatus === ride.status}
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                >
                  Update Status
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
                <p className="font-medium">⚠️ Admin Override</p>
                <p>Changing ride status manually may cause inconsistencies. Use with caution.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Drawer>
  );
};