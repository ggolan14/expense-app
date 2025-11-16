import React, { useState } from 'react';
import axios from '../api/axios';
import { isValidIsraeliID } from '../utils/idValidation';
import { toast } from 'react-toastify';

const Register = () => {
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    nationalId: '',
    password: ''
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ פונקציה לבדוק תקינות אימייל
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isValidIsraeliID(form.nationalId)) {
      toast.error('Invalid Israeli ID');
      return;
    }

    try {
      await axios.post('/auth/register', { ...form, role: 'employee' });
      toast.success('Registration successful! You can now log in.');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.warn('This email is already in use');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Register</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#f8f8f8',
          padding: '20px',
          borderRadius: '10px'
        }}
      >
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={{ padding: '8px' }}
        />
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          style={{ padding: '8px' }}
        />
        <input
          name="nationalId"
          placeholder="National ID"
          value={form.nationalId}
          onChange={handleChange}
          style={{ padding: '8px' }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{ padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px', fontWeight: 'bold' }}>
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
