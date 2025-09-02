
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

const AdminApp = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-tippa-light">
        <AdminHeader />
        
        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <AdminSidebar />
          
          <main className="flex-1 overflow-y-auto bg-tippa-light p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminApp;
