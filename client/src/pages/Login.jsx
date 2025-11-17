import React, { useState, useContext } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../auth/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext) || { setUser: () => {} };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('אנא הזן אימייל וסיסמה');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/auth/login', form);
      const { token, user } = res.data || {};
      const role = (user?.role || '').toLowerCase();

      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (user?.fullName) localStorage.setItem('name', user.fullName);

      setUser({ ...user, role, token });

      toast.success('התחברת בהצלחה!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      toast.error('אימייל או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" dir="rtl">
      <div className="login-overlay" />
      <div className="login-box">
        <h2 className="login-title">התחברות למערכת החזר הוצאות</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="הזן אימייל"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="הזן סיסמה"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'מתחבר…' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
