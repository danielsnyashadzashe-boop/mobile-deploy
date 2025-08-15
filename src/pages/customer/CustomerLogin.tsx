
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple mock authentication (would be replaced with actual auth)
    if (email === 'customer@example.com' && password === 'password') {
      navigate('/customer/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-nogada-dark text-center mb-6">Customer Login</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="nogada-card">
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email / Mobile Number
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="nogada-input"
              placeholder="Enter your email or mobile"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="nogada-input"
              placeholder="Enter your password"
              required
            />
            <div className="mt-1">
              <a href="#" className="text-xs nogada-link">
                Forgot Password?
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
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/customer/register" className="nogada-link">
              Register
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link to="/" className="text-sm nogada-link">
          Return to App Selection
        </Link>
      </div>
    </div>
  );
};

export default CustomerLogin;
