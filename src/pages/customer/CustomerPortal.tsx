
import React from 'react';
import { Outlet } from 'react-router-dom';
import TippaLogo from '@/components/shared/TippaLogo';

const CustomerPortal = () => {
  return (
    <div className="min-h-screen bg-tippa-light">
      <header className="bg-white shadow-sm border-b-2 border-tippa-secondary/20">
        <div className="tippa-container py-4 flex justify-between items-center">
          <TippaLogo size="md" />
          <div className="text-sm font-medium text-tippa-accent bg-tippa-primary px-3 py-1 rounded-full border border-tippa-accent/20">
            Customer Portal
          </div>
        </div>
      </header>
      
      <main className="tippa-container py-6">
        <Outlet />
      </main>
      
      <footer className="border-t-2 border-tippa-secondary/20 bg-white mt-12">
        <div className="tippa-container py-4">
          <div className="text-center text-sm text-tippa-neutral">
            &copy; 2025 Tippa. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortal;
