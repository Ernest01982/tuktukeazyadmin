export type UUID = string;

export type Account = {
  id: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  is_active: boolean;
};

export type LedgerTransaction = {
  id: UUID;
  occurred_at: string;
  created_by: UUID | null;
  ride_id: UUID | null;
  description: string | null;
  external_ref: string | null;
};

export type LedgerEntry = {
  id: UUID;
  txn_id: UUID;
  account_id: number;
  debit: number;
  credit: number;
  currency: string;
};

export type Driver = {
  id: UUID;
  name: string | null;
  phone: string | null;
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_verified: boolean;
  online: boolean;
  rating: number;
  total_rides: number;
  updated_at: string;
};

export type Profile = {
  id: UUID;
  email: string | null;
  role: 'rider' | 'driver' | 'admin';
  created_at?: string;
  updated_at?: string;
};

export type Ride = {
  id: UUID;
  rider_id: UUID;
  driver_id?: UUID;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_fare: number;
  final_fare?: number;
  status: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
};

export type Payment = {
  id: UUID;
  ride_id: UUID;
  amount: number;
  status: string;
  currency: string;
  processor_fee: number;
  stripe_payment_intent_id: string;
  created_at: string;
  updated_at?: string;
};

export type AppSetting = {
  key: string;
  value: any;
};

export type DriverLocation = {
  driver_id: UUID;
  updated_at: string;
};

// Database interface for Supabase client typing
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
      };
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<Driver>;
      };
      rides: {
        Row: Ride;
        Insert: Omit<Ride, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Ride>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Payment>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id'> & {
          id?: number;
        };
        Update: Partial<Account>;
      };
      ledger_transactions: {
        Row: LedgerTransaction;
        Insert: Omit<LedgerTransaction, 'id'> & {
          id?: UUID;
        };
        Update: Partial<LedgerTransaction>;
      };
      ledger_entries: {
        Row: LedgerEntry;
        Insert: Omit<LedgerEntry, 'id'> & {
          id?: UUID;
        };
        Update: Partial<LedgerEntry>;
      };
      app_settings: {
        Row: AppSetting;
        Insert: AppSetting;
        Update: Partial<AppSetting>;
      };
      driver_locations: {
        Row: DriverLocation;
        Insert: Omit<DriverLocation, 'updated_at'> & {
          updated_at?: string;
        };
        Update: Partial<DriverLocation>;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_create_driver: {
        Args: {
          p_email: string;
          p_name: string;
          p_phone: string;
          p_license: string;
          p_vehicle_type: string;
          p_vehicle_plate: string;
          p_is_verified: boolean;
        };
        Returns: UUID;
      };
      post_ride_payment: {
        Args: {
          p_ride_id: UUID;
        };
        Returns: UUID;
      };
      post_driver_payout: {
        Args: {
          p_driver_id: UUID;
          p_amount: number;
          p_currency?: string;
          p_note?: string;
        };
        Returns: UUID;
      };
    };
  };
}