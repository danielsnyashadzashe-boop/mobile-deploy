
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavigation from '@/components/customer/CustomerNavigation';
import { mockCustomers } from '@/data/mockData';

const CustomerProfile = () => {
  const navigate = useNavigate();
  
  // Using first mock customer as the logged-in customer
  const customer = mockCustomers[0];
  
  const handleLogout = () => {
    // In a real app, clear authentication state
    navigate('/customer');
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-nogada-dark mb-4">My Profile</h1>
      
      <CustomerNavigation />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="nogada-card mb-6">
            <h2 className="font-semibold mb-4">Personal Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <div className="font-medium">{customer.name}</div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <div className="font-medium">{customer.email}</div>
              </div>
              
              <div className="pt-2">
                <button className="nogada-btn-secondary text-sm">
                  Edit Personal Details
                </button>
              </div>
            </div>
          </div>
          
          <div className="nogada-card">
            <h2 className="font-semibold mb-4">Security</h2>
            
            <div className="space-y-4">
              <div>
                <button className="nogada-btn-secondary text-sm w-full mb-2">
                  Change Password
                </button>
                
                <button className="nogada-btn-secondary text-sm w-full">
                  Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="nogada-card mb-6">
            <h2 className="font-semibold mb-4">Payment Methods</h2>
            
            <div className="border rounded-md p-3 bg-gray-50 mb-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">••••  ••••  ••••  4321</div>
                  <div className="text-xs text-gray-500">Expires: 05/27</div>
                </div>
                <div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Default
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button className="nogada-btn-secondary text-sm">
                Add Payment Method
              </button>
            </div>
          </div>
          
          <div className="nogada-card">
            <h2 className="font-semibold mb-4">Notification Preferences</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Tip Confirmations</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Wallet Updates</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Marketing Communications</span>
                <input type="checkbox" className="h-4 w-4" />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
        
        <div className="text-xs text-gray-400 mt-6">
          © 2025 Nogada SA. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
