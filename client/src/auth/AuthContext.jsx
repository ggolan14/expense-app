import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data.user);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ הוספת הפונקציה החסרה שגורמת לשגיאה
export const useAuth = () => useContext(AuthContext);
