
import React from 'react';
import { Outlet } from 'react-router-dom';
import TippaLogo from '@/components/shared/TippaLogo';

const CarGuardApp = () => {
  return (
    <div className="min-h-screen bg-tippa-light flex flex-col items-center justify-center p-4">
      <div className="mobile-frame bg-white overflow-hidden flex flex-col relative">
        <div className="bg-tippa-secondary text-white p-4 text-center">
          <TippaLogo size="sm" className="justify-center" />
          <div className="text-xs mt-1 font-medium">Car Guard App</div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CarGuardApp;
