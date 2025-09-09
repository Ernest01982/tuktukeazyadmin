import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Layout } from '../components/ui/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/fmt';
import { Settings, Save, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AppSetting } from '../lib/types';

interface AppSettingsForm {
  base_fare: string;
  per_km: string;
  cancel_grace_seconds: string;
  commission_rate: string;
}

export const SettingsPage: React.FC = () => {
  const [settingsForm, setSettingsForm] = useState<AppSettingsForm>({
    base_fare: '25.00',
    per_km: '12.50',
    cancel_grace_seconds: '300',
    commission_rate: '0.15',
  });

  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async (): Promise<Record<string, any>> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      // Convert array to object
      const settingsObj = (data || []).reduce((acc: Record<string, any>, setting: AppSetting) => {
        acc[setting.key] = setting.value?.value || setting.value;
        return acc;
      }, {});

      return settingsObj;
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      setSettingsForm({
        base_fare: settings.base_fare?.toString() || '25.00',
        per_km: settings.per_km?.toString() || '12.50',
        cancel_grace_seconds: settings.cancel_grace_seconds?.toString() || '300',
        commission_rate: settings.commission_rate?.toString() || '0.15',
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (formData: AppSettingsForm) => {
      const settingsToUpdate = [
        { key: 'base_fare', value: { value: parseFloat(formData.base_fare) } },
        { key: 'per_km', value: { value: parseFloat(formData.per_km) } },
        { key: 'cancel_grace_seconds', value: { value: parseInt(formData.cancel_grace_seconds) } },
        { key: 'commission_rate', value: { value: parseFloat(formData.commission_rate) } },
      ];

      // Upsert each setting
      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'key' });

        if (error) throw error;
      }

      return settingsToUpdate;
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
    onError: (error: any) => {
      console.error('Update settings error:', error);
      toast.error('Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const baseFare = parseFloat(settingsForm.base_fare);
    const perKm = parseFloat(settingsForm.per_km);
    const graceSeconds = parseInt(settingsForm.cancel_grace_seconds);
    const commissionRate = parseFloat(settingsForm.commission_rate);

    if (isNaN(baseFare) || baseFare < 0) {
      toast.error('Base fare must be a valid positive number');
      return;
    }

    if (isNaN(perKm) || perKm < 0) {
      toast.error('Per km rate must be a valid positive number');
      return;
    }

    if (isNaN(graceSeconds) || graceSeconds < 0) {
      toast.error('Cancel grace period must be a valid positive number');
      return;
    }

    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      toast.error('Commission rate must be between 0 and 1');
      return;
    }

    updateSettingsMutation.mutate(settingsForm);
  };

  const handleInputChange = (field: keyof AppSettingsForm, value: string) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout title="Settings">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  <h2 className="text-lg font-semibold text-ink">App Settings</h2>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Base Fare (ZAR)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settingsForm.base_fare}
                        onChange={(e) => handleInputChange('base_fare', e.target.value)}
                        placeholder="25.00"
                        required
                      />
                      
                      <Input
                        label="Per Kilometer Rate (ZAR)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settingsForm.per_km}
                        onChange={(e) => handleInputChange('per_km', e.target.value)}
                        placeholder="12.50"
                        required
                      />
                    </div>
                    
                    <Input
                      label="Cancel Grace Period (seconds)"
                      type="number"
                      min="0"
                      value={settingsForm.cancel_grace_seconds}
                      onChange={(e) => handleInputChange('cancel_grace_seconds', e.target.value)}
                      placeholder="300"
                      required
                    />
                    
                    <Input
                      label="Commission Rate (0-1)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settingsForm.commission_rate}
                      onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                      placeholder="0.15"
                      required
                    />
                    
                    <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Setting Explanations:</h4>
                      <ul className="space-y-1">
                        <li><strong>Base Fare:</strong> Minimum charge for any ride</li>
                        <li><strong>Per KM Rate:</strong> Additional charge per kilometer</li>
                        <li><strong>Cancel Grace Period:</strong> Seconds riders can cancel without penalty</li>
                        <li><strong>Commission Rate:</strong> Platform's cut (0.15 = 15%)</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={updateSettingsMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview/Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <h3 className="text-lg font-medium">Pricing Preview</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Base Fare</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(parseFloat(settingsForm.base_fare || '0'))}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">5km Ride Estimate</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        parseFloat(settingsForm.base_fare || '0') + 
                        (5 * parseFloat(settingsForm.per_km || '0'))
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Base ({formatCurrency(parseFloat(settingsForm.base_fare || '0'))}) + 
                      5km × {formatCurrency(parseFloat(settingsForm.per_km || '0'))}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">10km Ride Estimate</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        parseFloat(settingsForm.base_fare || '0') + 
                        (10 * parseFloat(settingsForm.per_km || '0'))
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Commission Example</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ride Fare:</span>
                    <span className="font-medium">{formatCurrency(100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commission ({(parseFloat(settingsForm.commission_rate || '0') * 100).toFixed(1)}%):</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(100 * parseFloat(settingsForm.commission_rate || '0'))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Driver Receives:</span>
                    <span className="font-bold">
                      {formatCurrency(100 - (100 * parseFloat(settingsForm.commission_rate || '0')))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Cancel Policy</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Riders can cancel within{' '}
                  <span className="font-medium">
                    {Math.floor(parseInt(settingsForm.cancel_grace_seconds || '0') / 60)} minutes{' '}
                    {parseInt(settingsForm.cancel_grace_seconds || '0') % 60 > 0 && 
                      `${parseInt(settingsForm.cancel_grace_seconds || '0') % 60} seconds`
                    }
                  </span>{' '}
                  without penalty.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
