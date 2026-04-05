/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ENV } from '../config/env';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('financeflow-token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('financeflow-token', token);
      fetchUser();
    } else {
      localStorage.removeItem('financeflow-token');
      setUser(null);
      setIsLoading(false);
    }
  }, [fetchUser, token]);

  useEffect(() => {
    if (!token) return undefined;

    const handleWindowFocus = () => {
      fetchUser();
    };

    const sessionCheckInterval = window.setInterval(() => {
      fetchUser();
    }, 60000);

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(sessionCheckInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchUser, token]);

  const login = async (email, password) => {
    const res = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${ENV.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    
    setToken(data.data.token);
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
