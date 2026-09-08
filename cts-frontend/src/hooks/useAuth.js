import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_tokenrefsh');
    localStorage.removeItem('user_id');
    setUser(null);
    setRole(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      clearSession();
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.user ?? null;
      if (!userData) throw new Error('Session invalide');

      setUser(userData);
      setRole(userData.role);
      localStorage.setItem('user_id', userData.id);
      return userData;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // A locally expired session is still safe to clear.
    }
    clearSession();
    setLoading(false);
  }, [clearSession]);

  const value = {
    user,
    role,
    isAdmin: role === 'admin',
    isElecteur: role === 'electeur',
    loading,
    logout,
    refreshUser,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};
