# Tuk Tuk Eazy - Admin Dashboard

A comprehensive admin dashboard for the Tuk Tuk Eazy ride-hailing platform, built with React, TypeScript, and Supabase.

## Features

- **Secure Authentication**: Admin-only access with role-based authentication
- **Real-time Dashboard**: Live KPIs, activity feeds, and driver tracking
- **Driver Management**: Admin-only driver creation with verification controls
- **Ride Management**: Complete ride tracking with status updates and assignment
- **Double-Entry Bookkeeping**: Full accounting system with transactions, accounts, payouts, and reports
- **Settings Management**: Configurable app settings for pricing and policies

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom brand colors
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Edge Functions)
- **Routing**: React Router
- **UI Components**: Custom component library
- **Notifications**: React Hot Toast

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_optional
```

### Setting Up Your First Admin User

1. **Via Supabase Dashboard**:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - After creation, go to Table Editor → profiles
   - Find the user row and set `role = 'admin'`

2. **Via Environment Variable**:
   - Add the user's email to `VITE_ADMIN_EMAILS` in your `.env` file
   - When they first log in, they'll automatically be promoted to admin

## Installation & Development

```bash
# Clone the repository
git clone <repository-url>
cd tuk-tuk-admin

# Install dependencies
npm install

# Start development server
npm run dev
```

## Database Schema

The application expects these Supabase tables with RLS enabled:

### Core Tables
- `profiles` - User profiles with roles (rider/driver/admin)
- `drivers` - Driver information and verification status
- `rides` - Ride requests and tracking
- `driver_locations` - Real-time driver locations
- `payments` - Payment processing records

### Bookkeeping Tables
- `accounts` - Chart of accounts
- `ledger_transactions` - Transaction headers
- `ledger_entries` - Double-entry journal entries
- `app_settings` - Application configuration

### Required RPC Functions
- `is_admin()` - Check admin privileges
- `admin_create_driver()` - Create driver with verification
- `post_ride_payment()` - Process ride payments to ledger
- `post_driver_payout()` - Process driver payouts

## Optional Edge Functions

For enhanced functionality, deploy these Supabase Edge Functions:

### 1. admin-create-driver
**Path**: `/functions/v1/admin-create-driver`
**Purpose**: Create auth users and driver profiles securely

**Request Body**:
```json
{
  "email": "driver@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "phone": "+27123456789",
  "license_number": "ABC123456",
  "vehicle_type": "tuk-tuk",
  "vehicle_plate": "GP-123-ABC",
  "is_verified": true
}
```

### 2. stripe-webhook
**Path**: `/functions/v1/stripe-webhook`
**Purpose**: Handle Stripe payment webhooks and update payment records

**Webhook Events**: `payment_intent.succeeded`, `payment_intent.failed`

## Application Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   └── ProtectedRoute.tsx  # Route protection
├── contexts/
│   └── AuthContext.tsx     # Authentication state
├── lib/
│   ├── supabaseClient.ts   # Supabase configuration
│   ├── types.ts            # TypeScript definitions
│   ├── fmt.ts              # Formatting utilities
│   └── csv.ts              # CSV export utilities
├── pages/
│   ├── DashboardPage.tsx
│   ├── DriversPage.tsx
│   ├── RidesPage.tsx
│   ├── Bookkeeping/        # Accounting module
│   └── SettingsPage.tsx
└── App.tsx                 # Main application
```

## Key Features

### Dashboard
- Active rides count
- Pending ride requests
- Online drivers count
- Daily completion metrics
- Real-time activity feed

### Driver Management
- Search and filter drivers
- Verification status management
- Online/offline status control
- Driver creation (admin-only)
- Performance metrics display

### Ride Management
- Real-time ride tracking
- Driver assignment
- Status override capabilities
- Payment integration
- Route visualization

### Bookkeeping System
- Double-entry transaction recording
- Chart of accounts management
- Driver payout processing
- Financial reporting
- CSV export capabilities

## Troubleshooting

### Common Issues

1. **RLS Permission Denied**
   - Ensure user has admin role in profiles table
   - Check RLS policies are correctly configured
   - Verify authentication token is valid

2. **Driver Creation Fails**
   - Ensure Edge Function is deployed or use manual creation
   - Check admin privileges
   - Verify all required fields are provided

3. **Missing Maps**
   - Google Maps API key is optional
   - App will function without maps, but driver locations won't show

4. **Real-time Updates Not Working**
   - Check Supabase project settings
   - Ensure RLS allows reading for subscriptions
   - Verify network connectivity

### Database Setup Issues

If you encounter missing tables or functions:

1. Ensure all required tables exist with proper RLS
2. Create necessary RPC functions using the Supabase SQL editor
3. Set up proper foreign key relationships
4. Configure Row Level Security policies

## Production Deployment

1. **Environment Variables**: Set production values for all required variables
2. **Database**: Ensure production database has all required tables and functions
3. **Edge Functions**: Deploy optional Edge Functions for enhanced functionality
4. **Security**: Review and test all RLS policies
5. **Monitoring**: Set up error tracking and performance monitoring

## Support

For issues related to:
- **Authentication**: Check Supabase Auth configuration
- **Database**: Verify table schemas and RLS policies
- **Real-time**: Check Supabase Realtime settings
- **Edge Functions**: Ensure proper deployment and permissions

The application includes comprehensive error handling and user feedback to help diagnose issues in development and production.