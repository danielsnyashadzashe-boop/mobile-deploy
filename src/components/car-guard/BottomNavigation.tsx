
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, Wallet, User } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="bg-white border-t border-tippa-primary/20 flex justify-around py-2 sticky bottom-0 shadow-md">
      <Link
        to="/car-guard/dashboard"
        className={`flex flex-col items-center p-2 ${
          isActive('/car-guard/dashboard') ? 'text-tippa-secondary' : 'text-tippa-neutral'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      
      <Link
        to="/car-guard/history"
        className={`flex flex-col items-center p-2 ${
          isActive('/car-guard/history') ? 'text-tippa-secondary' : 'text-tippa-neutral'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span className="text-xs mt-1">History</span>
      </Link>
      
      <Link
        to="/car-guard/payouts"
        className={`flex flex-col items-center p-2 ${
          isActive('/car-guard/payouts') ? 'text-tippa-secondary' : 'text-tippa-neutral'
        }`}
      >
        <Wallet className="w-5 h-5" />
        <span className="text-xs mt-1">Payouts</span>
      </Link>
      
      <Link
        to="/car-guard/profile"
        className={`flex flex-col items-center p-2 ${
          isActive('/car-guard/profile') ? 'text-tippa-secondary' : 'text-tippa-neutral'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </div>
  );
};

export default BottomNavigation;
