
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions');
      return;
    }
    
    // In a real app, this would send registration data to API
    navigate('/customer/dashboard');
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-nogada-dark text-center mb-6">Create Account</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="nogada-card">
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="nogada-input"
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="mobile" className="block text-sm font-medium mb-1">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="nogada-input"
              placeholder="Enter your mobile number"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="nogada-input"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="nogada-input"
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="nogada-input"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1"
                required
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="nogada-link">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="nogada-link">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>
          
          <button
            type="submit"
            className="nogada-btn-primary w-full mb-4"
          >
            Register
          </button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/customer" className="nogada-link">
              Login
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

export default CustomerRegister;
