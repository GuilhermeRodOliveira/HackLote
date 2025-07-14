'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  usuario?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  function logout() {
    fetch('/api/logout', { method: 'POST' })
      .then(() => setUser(null))
      .catch(() => setUser(null));
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
