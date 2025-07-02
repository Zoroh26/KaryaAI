"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch user role from database
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data?.role;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUser(null);
          setUserRole(null);
          
          // Redirect to login if accessing protected routes
          if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/reset-password') {
            router.push('/login');
          }
        }
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname]);

  // Function to sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Protect routes based on authentication and role
  useEffect(() => {
    if (!loading) {
      // Check if the current route is protected
      const isProtectedRoute = !pathname.startsWith('/login') && 
                               !pathname.startsWith('/signup') && 
                               !pathname.startsWith('/reset-password');
      
      if (isProtectedRoute) {
        // If not authenticated, redirect to login
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Check if user has access to this role's routes
        if (userRole && pathname.includes('/')) {
          const routeRole = pathname.split('/')[1]; // Extract role from URL path
          
          // If user is trying to access a role they don't have
          if (routeRole !== userRole && routeRole !== 'login' && routeRole !== 'signup') {
            router.push(`/${userRole}/dashboard`);
          }
        }
      }
    }
  }, [user, userRole, pathname, loading, router]);

  const value = {
    user,
    userRole,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="w-full h-screen flex justify-center items-center bg-[#0F1B0E]">
          <div className="text-[#AACBB8] text-2xl">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}