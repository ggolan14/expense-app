// client/src/pages/DashboardEmployee.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DashboardEmployee = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/expenses/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error loading requests', err);
      }
    };

    fetchMyRequests();
  }, []);

  return (
    <div>
      <h2>My Expense Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req._id}>
            Amount: {req.amount} | Reason: {req.reason} | Status: {req.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardEmployee;
