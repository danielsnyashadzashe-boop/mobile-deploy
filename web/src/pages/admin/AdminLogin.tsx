
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TippaLogo from '@/components/shared/TippaLogo';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

const AdminLogin = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Simple mock authentication (would be replaced with actual auth)
      if (username === 'admin' && password === 'password') {
        toast.success('Login successful');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
        toast.error('Login failed');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('Password reset functionality would be implemented here');
  };
  
  return (
    <div className="min-h-screen bg-tippa-light flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <TippaLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-tippa-accent">Admin Login</h1>
          <p className="text-sm text-tippa-neutral mt-1">Sign in to the Tippa Admin Portal</p>
        </div>
        
        <div className="tippa-card">
          {error && (
            <div className="bg-tippa-danger/10 text-tippa-danger p-3 rounded-md mb-4 text-sm border border-tippa-danger/20">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-1 text-tippa-accent">
                Username / Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="tippa-input"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-tippa-accent">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tippa-input"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 accent-tippa-secondary" disabled={isLoading} />
                <span className="text-sm text-tippa-neutral">Remember me</span>
              </label>
              <Button 
                variant="link" 
                size="sm" 
                className="text-sm tippa-link p-0"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot Password?
              </Button>
            </div>
            
            <Button
              type="submit"
              className="tippa-btn-secondary w-full mb-4"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm tippa-link">
            Return to App Selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
