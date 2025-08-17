import React, { useState } from 'react';
import axios from '../api/axios';
import { isValidIsraeliID } from '../utils/idValidation';

const Register = () => {
  const [form, setForm] = useState({ email: '', fullName: '', nationalId: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidIsraeliID(form.nationalId)) {
      alert('תעודת זהות לא תקינה');
      return;
    }
    try {
      await axios.post('/auth/register', { ...form, role: 'employee' });
      alert('נרשמת בהצלחה! ניתן להתחבר');
      window.location.href = '/login';
    } catch {
      alert('שגיאה בהרשמה');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="fullName" placeholder="Full Name" onChange={handleChange} />
      <input name="nationalId" placeholder="Teudat Zehut" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
