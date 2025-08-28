
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      
      <div className="mt-6 text-center border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">
          Don't have an account?
        </p>
        <Link to="/car-guard/register" className="text-sm nogada-link font-semibold">
          Apply to become a Car Guard
        </Link>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        Contact your Nogada administrator if you need assistance.
      </p>
      
      <div className="mt-6 text-center">
        <Link to="/" className="text-sm nogada-link">
          Return to App Selection
        </Link>
      </div>
    </div>
  );
};

export default CarGuardLogin;
