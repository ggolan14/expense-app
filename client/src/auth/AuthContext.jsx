import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../api/axios';

export const AuthContext = createContext({ user: null, setUser: () => {}, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // { token, role, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    // מציבים רק token זמני – בלי role מ-LS כדי לא לטעות בכיוון
    setUser({ token });

    axios.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const u = res.data?.user || res.data; // תאם לפורמט ה-API שלך
        if (u) {
          const role = (u.role || '').toLowerCase();
          setUser({ ...u, token, role });
          localStorage.setItem('role', role || '');
          if (u.fullName) localStorage.setItem('name', u.fullName);
        } else {
          throw new Error('No user in /auth/me');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
