
import React from 'react';
import { Link } from 'react-router-dom';
import TippaLogo from '@/components/shared/TippaLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AppSelector = () => {
  return (
    <div className="min-h-screen bg-tippa-light flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <TippaLogo size="lg" />
      </div>
      
      <h1 className="text-3xl font-bold text-center text-tippa-accent mb-2">Nogada Car Guard System</h1>
      <p className="text-tippa-neutral mb-8 text-center max-w-md">Select which application you would like to access</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Car Guard App Card */}
        <Card className="hover:shadow-lg transition-shadow border-2 border-tippa-secondary/30 hover:border-tippa-secondary">
          <CardHeader className="pb-2 bg-tippa-secondary/5">
            <CardTitle className="text-tippa-accent">Car Guard App</CardTitle>
            <CardDescription className="text-tippa-neutral">For car guards to receive tips</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="mb-4 text-sm text-tippa-neutral">Display your QR code, track tips, and manage payouts</p>
            <Link to="/car-guard" className="tippa-btn-secondary block text-center">
              Access Car Guard App
            </Link>
          </CardContent>
        </Card>
        
        {/* Admin Application Card */}
        <Card className="hover:shadow-lg transition-shadow border-2 border-tippa-secondary/30 hover:border-tippa-secondary">
          <CardHeader className="pb-2 bg-tippa-secondary/5">
            <CardTitle className="text-tippa-accent">Admin Application</CardTitle>
            <CardDescription className="text-tippa-neutral">For system administrators and managers</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="mb-4 text-sm text-tippa-neutral">Manage guards, locations, monitor transactions, and process payouts</p>
            <Link to="/admin" className="tippa-btn-secondary block text-center">
              Access Admin App
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <p className="mt-8 text-sm text-tippa-neutral">© 2025 Nogada. All rights reserved.</p>
    </div>
  );
};

export default AppSelector;
