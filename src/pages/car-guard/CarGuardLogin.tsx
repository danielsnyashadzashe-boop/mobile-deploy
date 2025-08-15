
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCarGuards } from '@/data/mockData';

const CarGuardLogin = () => {
  const [guardId, setGuardId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple mock authentication (would be replaced with actual auth)
    if (guardId === 'NG001' && pin === '1234') {
      navigate('/car-guard/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-nogada-dark text-center mb-6">Car Guard Login</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="guardId" className="block text-sm font-medium mb-1">
            Guard ID / Phone Number
          </label>
          <input
            id="guardId"
            type="text"
            value={guardId}
            onChange={(e) => setGuardId(e.target.value)}
            className="nogada-input"
            placeholder="Enter your Guard ID"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="pin" className="block text-sm font-medium mb-1">
            PIN / Password
          </label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="nogada-input"
            placeholder="Enter your PIN"
            required
          />
          <div className="mt-1">
            <a href="#" className="text-xs nogada-link">
              Forgot PIN/Password?
            </a>
          </div>
        </div>
        
        <button
          type="submit"
          className="nogada-btn-primary w-full mb-4"
        >
          Login
        </button>
      </form>
      
      <p className="text-xs text-center text-gray-500 mt-6">
        Contact your Nogada administrator if you need assistance.
      </p>
      
      <div className="mt-8 text-center">
        <a href="/" className="text-sm nogada-link">
          Return to App Selection
        </a>
      </div>
    </div>
  );
};

export default CarGuardLogin;
