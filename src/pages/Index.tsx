
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NogadaLogo from '@/components/shared/NogadaLogo';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to app selector after a brief delay
    const timeout = setTimeout(() => {
      navigate('/');
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-nogada-light">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <NogadaLogo size="lg" />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-nogada-dark">Nogada Car Guard Tipping System</h1>
        <p className="text-xl text-gray-600 mb-4">Redirecting to App Selection...</p>
        <div className="w-12 h-1 bg-nogada-primary mx-auto animate-pulse"></div>
      </div>
    </div>
  );
};

export default Index;
