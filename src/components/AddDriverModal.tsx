import { adminCreateDriverWithFallback } from '../lib/api';
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';

interface AddDriverModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ open, onClose, onCreated }) => {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    vehicle_type: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_plate: ''
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateDriverWithFallback(form);
      toast.success('Driver created');
      onCreated();
      onClose();
    } catch (e:any) {
      toast.error(e?.message ?? 'Driver creation failed');
      console.error('Driver creation failed:', e);
    } finally {
      setBusy(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Driver">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            required
          />
        </div>
        
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateForm('email', e.target.value)}
          required
        />
        
        <Input
          label="License Number"
          value={form.license_number}
          onChange={(e) => updateForm('license_number', e.target.value)}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vehicle Type"
            value={form.vehicle_type}
            onChange={(e) => updateForm('vehicle_type', e.target.value)}
            placeholder="e.g., Sedan, SUV"
          />
          <Input
            label="Vehicle Plate"
            value={form.vehicle_plate}
            onChange={(e) => updateForm('vehicle_plate', e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vehicle Make"
            value={form.vehicle_make}
            onChange={(e) => updateForm('vehicle_make', e.target.value)}
            placeholder="e.g., Toyota"
          />
          <Input
            label="Vehicle Model"
            value={form.vehicle_model}
            onChange={(e) => updateForm('vehicle_model', e.target.value)}
            placeholder="e.g., Camry"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating...' : 'Create Driver'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
