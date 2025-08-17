// client/src/pages/DashboardBudget.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DashboardBudget = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchAllRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/expenses/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error loading requests', err);
      }
    };

    fetchAllRequests();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/expenses/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, status: newStatus } : req
        )
      );
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  return (
    <div>
      <h2>All Expense Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req._id}>
            {req.employeeId.fullName} | Amount: {req.amount} | Reason: {req.reason} | Status: {req.status}
            <select
              value={req.status}
              onChange={(e) => updateStatus(req._id, e.target.value)}
            >
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="closed">closed</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardBudget;
