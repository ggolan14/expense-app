import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import ExpenseForm from './pages/ExpenseForm';
import Requests from './pages/Requests';
import { AuthContext } from './auth/AuthContext';

const LoadingScreen = () => (
  <div style={{ padding: 40, textAlign: 'center' }} dir="rtl">טוען…</div>
);

const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext) || {};
  if (loading) return <LoadingScreen />;
  if (!user?.token) return <Navigate to="/login" replace />;

  if (roles?.length) {
    const role = (user.role || '').toLowerCase();
    if (!roles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

export default function App() {
  const { user, loading } = useContext(AuthContext) || {};

  const dashboardElement = loading
    ? <LoadingScreen />
    : user?.token
      ? ((user.role || '').toLowerCase() === 'budget'
          ? <Navigate to="/all-requests" replace />
          : <Navigate to="/my-requests" replace />)
      : <Navigate to="/login" replace />;

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ציבורי */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* מפצל תפקידים */}
        <Route path="/dashboard" element={dashboardElement} />

        {/* שני הנתיבים – אותו מסך מאוחד */}
        <Route
          path="/my-requests"
          element={
            <RequireAuth roles={['employee','budget']}>
              <Requests />
            </RequireAuth>
          }
        />
        <Route
          path="/all-requests"
          element={
            <RequireAuth roles={['employee','budget']}>
              <Requests />
            </RequireAuth>
          }
        />

        {/* טופס חדש לעובד רגיל בלבד (התאם לפי צורך) */}
        <Route
          path="/new-expense"
          element={
            <RequireAuth roles={['employee']}>
              <ExpenseForm />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
