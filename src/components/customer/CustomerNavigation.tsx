
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CustomerNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-white shadow-sm rounded-lg mb-6 border border-tippa-primary/20">
      <div className="flex">
        <Link
          to="/customer/dashboard"
          className={`flex-1 py-3 px-4 text-center text-sm ${
            isActive('/customer/dashboard')
              ? 'text-tippa-secondary font-medium border-b-2 border-tippa-primary'
              : 'text-tippa-neutral'
          }`}
        >
          Dashboard
        </Link>
        
        <Link
          to="/customer/history"
          className={`flex-1 py-3 px-4 text-center text-sm ${
            isActive('/customer/history')
              ? 'text-tippa-secondary font-medium border-b-2 border-tippa-primary'
              : 'text-tippa-neutral'
          }`}
        >
          Tip History
        </Link>
        
        <Link
          to="/customer/profile"
          className={`flex-1 py-3 px-4 text-center text-sm ${
            isActive('/customer/profile')
              ? 'text-tippa-secondary font-medium border-b-2 border-tippa-primary'
              : 'text-tippa-neutral'
          }`}
        >
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default CustomerNavigation;
