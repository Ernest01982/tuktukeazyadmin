import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';
import { LogOut, Menu } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  onMenuClick?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, onMenuClick }) => {
  const { signOut, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-ink">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 hidden sm:block">
            {profile?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-gray-600 hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:block">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
