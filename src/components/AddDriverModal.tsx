import { adminCreateDriverWithFallback } from '../lib/api';
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import toast from 'react-hot-toast';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    license_number: '',
    vehicle_type: '',
    vehicle_plate: '',
    is_verified: true
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.email || !form.name || !form.phone || !form.license_number || !form.vehicle_plate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBusy(true);
    try {
      await adminCreateDriverWithFallback({
        email: form.email,
        password: form.password || undefined,
        name: form.name,
        phone: form.phone,
        license_number: form.license_number,
        vehicle_type: form.vehicle_type,
        vehicle_plate: form.vehicle_plate,
        is_verified: form.is_verified
      });
      toast.success('Driver created');
      onCreated();
      onClose();
      // Reset form
      setForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        license_number: '',
        vehicle_type: '',
        vehicle_plate: '',
        is_verified: true
      });
    } catch (e:any) {
      toast.error(e?.message ?? 'Driver creation failed');
      console.error('Driver creation failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const updateForm = (field: string, value: string | boolean) => {
    const normalized =
      value === 'true' ? true :
      value === 'false' ? false :
      value;
    setForm(prev => ({ ...prev, [field]: normalized }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Driver">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => updateForm('email', e.target.value)}
          placeholder="driver@example.com"
          required
        />
        
        <Input
          label="Password (optional)"
          type="password"
          value={form.password}
          onChange={(e) => updateForm('password', e.target.value)}
          placeholder="Leave empty for auto-generated"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="John Doe"
            required
          />
          <Input
            label="Phone *"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="+27123456789"
            required
          />
        </div>
        
        <Input
          label="License Number *"
          value={form.license_number}
          onChange={(e) => updateForm('license_number', e.target.value)}
          placeholder="ABC123456"
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Vehicle Type"
            value={form.vehicle_type}
            onChange={(e) => updateForm('vehicle_type', e.target.value)}
            options={[
              { value: '', label: 'Select vehicle type...' },
              { value: 'tuk-tuk', label: 'Tuk Tuk' },
              { value: 'sedan', label: 'Sedan' },
              { value: 'suv', label: 'SUV' },
              { value: 'hatchback', label: 'Hatchback' },
              { value: 'minibus', label: 'Minibus' }
            ]}
          />
          <Input
            label="Vehicle Plate *"
            value={form.vehicle_plate}
            onChange={(e) => updateForm('vehicle_plate', e.target.value)}
            placeholder="GP-123-ABC"
            required
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_verified"
            checked={form.is_verified}
            onChange={(e) => updateForm('is_verified', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="is_verified" className="text-sm text-gray-700">
            Mark as verified
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {busy ? 'Creating...' : 'Create Driver'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
