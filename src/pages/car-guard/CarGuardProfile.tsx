
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/car-guard/BottomNavigation';
import { mockCarGuards } from '@/data/mockData';

const CarGuardProfile = () => {
  const navigate = useNavigate();
  
  // Using the first mock guard as the logged-in guard
  const guard = mockCarGuards[0];
  
  const handleLogout = () => {
    // In a real app, clear authentication state
    navigate('/car-guard');
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-nogada-dark mb-4">My Profile</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-nogada-primary flex items-center justify-center text-white text-2xl font-bold">
              {guard.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <div className="font-medium">{guard.name}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Guard ID</label>
              <div className="font-medium">{guard.guardId}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500">Assigned Location</label>
              <div className="font-medium">{guard.location}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="font-medium mb-3">Help & Support</h2>
          
          <div className="space-y-3">
            <div className="p-2 text-sm border-b border-gray-100">
              <a href="#" className="text-nogada-primary">Frequently Asked Questions</a>
            </div>
            
            <div className="p-2 text-sm border-b border-gray-100">
              <a href="#" className="text-nogada-primary">Contact Nogada Support</a>
            </div>
            
            <div className="p-2 text-sm border-b border-gray-100">
              <a href="#" className="text-nogada-primary">Terms & Conditions</a>
            </div>
            
            <div className="p-2 text-sm border-b border-gray-100">
              <a href="#" className="text-nogada-primary">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
        
        <div className="text-center mt-6 text-xs text-gray-400">
          <div>App Version 1.0.0</div>
          <div>© 2025 Nogada SA</div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default CarGuardProfile;
