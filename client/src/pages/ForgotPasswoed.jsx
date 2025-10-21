import React, { useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/forgot-password', { email });
      toast.success('If this email exists, we sent you a reset link!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to request password reset');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send reset link</button>
    </form>
  );
};

export default ForgotPassword;
