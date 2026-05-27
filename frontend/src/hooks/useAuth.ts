'use client';
import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface User { id: string; username: string; role: string; }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sentinel_user');
    const token = localStorage.getItem('sentinel_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    const { accessToken, user } = res.data;
    localStorage.setItem('sentinel_token', accessToken);
    localStorage.setItem('sentinel_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return { user, loading, login, logout, isAuthenticated: !!user };
}
