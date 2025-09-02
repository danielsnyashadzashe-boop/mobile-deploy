
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';

const AdminAdministration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the current tab from the URL
  const currentTab = location.pathname.split('/').pop() || 'roles';
  
  const handleTabChange = (value: string) => {
    navigate(`/admin/administration/${value}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-tippa-accent">Administration</h1>
        <p className="text-tippa-neutral mt-2">
          Manage system roles, users, tenants, and application settings
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="saas">SaaS</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  );
};

export default AdminAdministration;
