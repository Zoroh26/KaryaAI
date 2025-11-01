import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      navigate('/admin');
    } catch (error) {
      // Error handling is done in AuthContext with toast
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 relative" style={{ backgroundColor: '#121d20ff' }}>
        <img 
          src="/Halftone.png" 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
        />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-xl text-white/70">Sign in to your KaryaAI account</p>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm shadow-lg hover:border-primary hover:shadow-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-white">Sign In</h3>
              <p className="text-lg text-white/70">Enter your credentials to access your dashboard</p>
            </div>
            <div className="p-6 pt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">Email Address</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-3 top-3 h-4 w-4 text-muted-foreground"></i>
                    <input
                      id="email"
                      type="email"
                      placeholder="admin@karyaai.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">Password</label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-3 top-3 h-4 w-4 text-muted-foreground"></i>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <i className={`h-4 w-4 ${showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-input"
                    />
                    <label htmlFor="remember" className="text-lg text-white/70 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Remember me</label>
                  </div>
                  <Link to="/forgot-password" className="text-lg text-primary hover:text-accent transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-accent h-10 px-4 py-2 w-full transition-all duration-200 group text-[#0f181a]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <i className="fas fa-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-lg text-white/70">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium">
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 rounded-lg border border-white/20 bg-white/5">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-3">Demo Accounts:</h3>
              <div className="space-y-2 text-base text-white/70">
                <div><i className="fas fa-crown mr-2"></i>Admin: admin@karyaai.com / Admin@123</div>
                <div><i className="fas fa-briefcase mr-2"></i>Employee: employee@karyaai.com / Employee@123</div>
                <div><i className="fas fa-laptop mr-2"></i>Client: client@karyaai.com / Client@123</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-3/5" style={{ backgroundColor: '#0f181a' }}>
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
          <img 
            src="/LoginImg.png" 
            alt="Login" 
            className="w-1/2 h-1/2 object-cover rounded-lg mb-6"
          />
          <div className="text-center text-white max-w-md">
            <h2 className="text-6xl font-bold mb-4">Login</h2>
            <p className="text-white/80 mb-2">AI-powered project management platform</p>
            <p className="text-white/60">Streamline workflows with intelligent automation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;