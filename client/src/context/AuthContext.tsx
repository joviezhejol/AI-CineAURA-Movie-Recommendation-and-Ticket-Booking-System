import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'customer' | 'manager' | 'employee') => Promise<void>;
  isCustomer: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  switchRole: async () => {},
  isCustomer: true,
  isManager: false,
  isEmployee: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cineaura_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore user from storage or switch to customer by default
  useEffect(() => {
    const savedUser = localStorage.getItem('cineaura_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      // Default to guest/demo customer
      setUser({
        id: 'usr-customer-1',
        name: 'Aditya Raman',
        email: 'customer@cineaura.com',
        role: 'customer',
        phone: '+91 98401 23456',
        district_id: 'chennai'
      });
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('cineaura_token', res.token);
      localStorage.setItem('cineaura_user', JSON.stringify(res.user));
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid credentials' };
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('cineaura_token', res.token);
      localStorage.setItem('cineaura_user', JSON.stringify(res.user));
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cineaura_token');
    localStorage.removeItem('cineaura_user');
  };

  const switchRole = async (role: 'customer' | 'manager' | 'employee') => {
    const res = await api.switchRole(role);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('cineaura_token', res.token);
      localStorage.setItem('cineaura_user', JSON.stringify(res.user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        isCustomer: user?.role === 'customer' || !user,
        isManager: user?.role === 'manager',
        isEmployee: user?.role === 'employee'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
