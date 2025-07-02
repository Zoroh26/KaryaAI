"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';
import greenabstract from '../../../../public/images/greenabstract.jpg';
import logo from '../../../../public/images/logo1.svg';

const classes = {
  Main: 'w-full h-screen flex justify-center items-center bg-[#0F1B0E]',
  LoginLeft: 'w-[40vw] h-screen flex flex-col gap-2 justify-center items-center p-24',
  ImageContainer: 'w-[60vw] h-screen',
  Image: 'w-full h-full object-cover',
  LogoContainer: 'w-full h-16 flex mb-4',
  Logo: 'object-contain h-16 -ml-3',
  Welcome: 'text-[#AACBB8] text-[64px] -ml-12 mb-8 qurova leading-none',
  LoginBox: 'w-full flex flex-col gap-2 items-start',
  LoginAsText: 'text-[#AACBB8] text-[32px] qurova leading-none',
  ToggleContainer: 'flex bg-[#052A04] rounded-full p-1 gap-1 w-full',
  ToggleOption: 'flex-1 text-center py-2 rounded-full cursor-pointer transition-colors duration-200 qurova',
  ActiveToggle: 'bg-[#AACBB8] text-[#0F1B0E]',
  InactiveToggle: 'text-[#AACBB8] hover:bg-[#063930]',
  ActionButton: 'w-full bg-[#AACBB8] text-[#0F1B0E] py-2 rounded-full mt-4 text-center cursor-pointer transition-colors duration-200 qurova',
  LoadingButton: 'w-full bg-[#AACBB8]/50 text-[#0F1B0E] py-2 rounded-full mt-4 text-center cursor-not-allowed qurova',
  SuccessMessage: 'text-[#AACBB8] text-xl text-center p-4 bg-[#052A04] rounded-lg',
  ErrorMessage: 'w-full mt-4 p-3 bg-[#300D0D] text-red-400 text-center rounded-lg',
};

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          // You can uncomment this if you want to disable auto-confirmation for email verification
          // emailRedirectTo: `${window.location.origin}/auth/login?verified=true`
        }
      });

      if (authError) throw authError;
      
      if (!authData?.user?.id) {
        throw new Error("Failed to create user account");
      }

      // 2. Insert into public.users table
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role
        }]);

      if (dbError) throw dbError;
      
      // 3. Sign out the user so they need to log in again (especially if email verification is required)
      await supabase.auth.signOut();

      // 4. Redirect to login with success state
      router.push('/login?signup=success');

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.Main}>
      <div className={classes.LoginLeft}>
        <div className={classes.LogoContainer}>
          <Image src={logo} alt="logo" className={classes.Logo} priority />
        </div>
        <div className={classes.Welcome}>Join KaryaAI</div>
        
        <form onSubmit={handleSubmit} className={classes.LoginBox}>
          <div className={classes.LoginAsText}>Register As</div>
          
          <div className={classes.ToggleContainer}>
            {['client', 'admin', 'employee'].map((role) => (
              <div
                key={role}
                className={`${classes.ToggleOption} ${
                  formData.role === role ? classes.ActiveToggle : classes.InactiveToggle
                }`}
                onClick={() => setFormData({...formData, role})}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 w-full mt-4">
            <div className='flex flex-col'>
              <label htmlFor="full_name" className="text-[#AACBB8] qurova text-lg">Full Name</label>
              <input
                type="text"
                id="full_name"
                required
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className='flex flex-col'>
              <label htmlFor="email" className="text-[#AACBB8] qurova text-lg">Email</label>
              <input
                type="email"
                id="email"
                required
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className='flex flex-col'>
              <label htmlFor="password" className="text-[#AACBB8] qurova text-lg">Password</label>
              <input
                type="password"
                id="password"
                required
                minLength={8}
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className='flex flex-col'>
              <label htmlFor="confirmPassword" className="text-[#AACBB8] qurova text-lg">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                required
                minLength={8}
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          {error && (
            <div className={classes.ErrorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? classes.LoadingButton : classes.ActionButton}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-[#AACBB8] qurova text-sm mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-[#AACBB8] underline hover:text-white">
            Log in
          </a>
        </div>
      </div>
      <div className={classes.ImageContainer}>
        <Image 
          src={greenabstract} 
          alt="signup background" 
          className={classes.Image}
        />
      </div>
    </div>
  );
}
