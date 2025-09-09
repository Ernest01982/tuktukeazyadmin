import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  MapPin, 
  Settings,
  FileText,
  CreditCard,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/drivers', label: 'Drivers', icon: Car },
    { href: '/rides', label: 'Rides', icon: MapPin },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const bookkeepingNavItems = [
    { href: '/bookkeeping/transactions', label: 'Transactions', icon: FileText },
    { href: '/bookkeeping/accounts', label: 'Accounts', icon: CreditCard },
    { href: '/bookkeeping/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/bookkeeping/reports', label: 'Reports', icon: BarChart3 },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <div className="flex items-center">
              <Car className="w-8 h-8 text-primary mr-2" />
              <span className="text-xl font-bold text-ink">Tuk Tuk Eazy</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {/* Main Navigation */}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            {/* Bookkeeping Section */}
            <div className="mt-8">
              <div className="px-3 mb-2">
                <div className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Bookkeeping
                </div>
              </div>
              {bookkeepingNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};
