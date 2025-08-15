
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import TippaLogo from '@/components/shared/TippaLogo';
import { useNavigate } from 'react-router-dom';

const AdminHeader = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // In a real app, clear authentication state
    navigate('/admin');
  };
  
  return (
    <header className="h-16 bg-white border-b-2 border-tippa-secondary/20 flex items-center px-4 shadow-sm">
      <SidebarTrigger className="mr-4 text-tippa-accent hover:text-tippa-secondary" />
      <TippaLogo size="sm" />
      <div className="ml-auto flex items-center space-x-4">
        <div className="text-sm text-tippa-accent font-medium">Admin</div>
        <button
          onClick={handleLogout}
          className="text-sm text-tippa-secondary hover:text-tippa-accent transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
