import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import { AuthContext } from './auth/AuthContext';
import ExpenseForm from './pages/ExpenseForm';
import MyRequests from './pages/MyRequests';
import AllExpenseRequests from "./pages/AllExpenseRequests";

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <ToastContainer /> {/* ✅ Toast container להצגת הודעות מכל מקום */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === 'employee' ? (
                <Navigate to="/my-requests" />
              ) : user.role === 'budget' ? (
                <Navigate to="/all-requests" />
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/new-expense" element={<ExpenseForm />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/all-requests" element={<AllExpenseRequests />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
};

export default App;
