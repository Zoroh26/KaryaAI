"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';
import greenabstract from '../../../../public/images/greenabstract.jpg';
import logo from '../../../../public/images/logo1.svg';

const classes = {
  Main: 'w-full h-screen flex justify-center items-center bg-[#0F1B0E]',
  LoginLeft: 'w-[40vw] h-screen flex flex-col gap-2 justify-center items-center p-24',
  ImageContainer: 'w-[60vw] h-screen',
  Image: 'w-full h-full object-cover',
  LogoContainer: 'w-full h-20 flex mb-4',
  Logo: 'object-contain h-16 -ml-3',
  Welcome: 'text-[#AACBB8] text-[64px] -mb-6 qurova leading-none',
  LoginBox: 'w-full flex flex-col gap-2 items-start mt-12',
  LoginAsText: 'text-[#AACBB8] text-[32px] qurova leading-none',
  ToggleContainer: 'flex bg-[#052A04] rounded-full p-1 gap-1 w-full mt-4',
  ToggleOption: 'flex-1 text-center py-2 rounded-full cursor-pointer transition-colors duration-200 qurova',
  ActiveToggle: 'bg-[#AACBB8] text-[#0F1B0E]',
  InactiveToggle: 'text-[#AACBB8] hover:bg-[#063930]',
  LoginButton: 'w-full bg-[#AACBB8] text-[#0F1B0E] py-2 rounded-full mt-4 text-center cursor-pointer transition-colors duration-200 qurova',
  LoadingButton: 'w-full bg-[#AACBB8]/70 text-[#0F1B0E] py-2 rounded-full mt-4 text-center cursor-not-allowed qurova',
  ForgotPassword: 'text-[#AACBB8] text-sm hover:underline cursor-pointer mt-2 text-right w-full',
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created successfully! Please log in.');
    }
    if (searchParams.get('reset') === 'success') {
      setSuccess('Password has been reset. Please log in with your new password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      const roleTables = [
        { table: 'clients', column: 'id', path: 'client' },
        { table: 'admins', column: 'id', path: 'admin' },
        { table: 'employees', column: 'employee_id', path: 'employee' }
      ];

      for (let { table, column, path } of roleTables) {
        const { data, error } = await supabase
          .from(table)
          .select(column)
          .eq(column, userId)
          .maybeSingle();

        if (!error && data) {
          router.push(`/${path}`);
          return;
        }
      }

      throw new Error("User role not found. Please contact support.");

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setSuccess("Password reset link sent to your email");
      setError(null);
    } catch (err) {
      setError(err.message);
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
        <div className={classes.Welcome}>Welcome to KaryaAI</div>

        {success && (
          <div className="w-full p-4 mb-4 bg-[#052A04] text-green-400 text-center rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={classes.LoginBox}>
          <div className={classes.LoginAsText}>Login as</div>
          <div className={classes.ToggleContainer}>
            {['client', 'admin', 'employee'].map((role) => (
              <div
                key={role}
                className={`${classes.ToggleOption} ${selectedRole === role ? classes.ActiveToggle : classes.InactiveToggle}`}
                onClick={() => setSelectedRole(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 w-full mt-4">
            <div className='flex flex-col'>
              <label htmlFor="email" className="text-[#AACBB8] qurova text-lg">Email</label>
              <input
                type="email"
                id="email"
                required
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className='flex flex-col'>
              <label htmlFor="password" className="text-[#AACBB8] qurova text-lg">Password</label>
              <input
                type="password"
                id="password"
                required
                className="p-2 px-4 rounded-full qurova bg-[#063930] border border-[#052A04] text-white"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div className={classes.ForgotPassword} onClick={handleForgotPassword}>
                Forgot password?
              </div>
            </div>
          </div>

          {error && (
            <div className="w-full mt-4 p-3 bg-[#300D0D] text-red-400 text-center rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? classes.LoadingButton : classes.LoginButton}
          >
            {loading ? 'Logging in...' : 'Login now'}
          </button>
        </form>

        <div className="text-[#AACBB8] qurova text-sm mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-[#AACBB8] underline hover:text-white">
            Sign up
          </a>
        </div>
      </div>
      <div className={classes.ImageContainer}>
        <Image
          src={greenabstract}
          alt="login background"
          className={classes.Image}
        />
      </div>
    </div>
  );
}
