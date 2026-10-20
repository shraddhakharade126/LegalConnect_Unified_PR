import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Lawyer, UserRole } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../api/index.ts';

interface AuthContextType {
  user: User | null;
  lawyer: Lawyer | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setLawyer(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setLawyer(data.lawyer || null);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setLawyer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await api.login(credentials);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setLawyer(data.lawyer || null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setLawyer(res.lawyer || null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setLawyer(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    setLoading(true);
    try {
      const data = await api.demoLogin(role);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setLawyer(data.lawyer || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        lawyer,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
