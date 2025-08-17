// client/src/pages/MyRequests.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import ResizableTable from '../components/ResizableTable';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMy = async () => {
      try {
        const res = await axios.get('/expenses/my');
        setRequests(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch my requests', err);
        setRequests([]);
      }
    };
    fetchMy();
  }, []);

  const columns = [
    {
      key: '_id',
      label: 'ID',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <code style={{ fontSize: 12 }}>{row._id}</code>
          <button
            onClick={() => navigator.clipboard.writeText(row._id)}
            title="Copy ID"
          >
            Copy
          </button>
        </div>
      ),
    },
    { key: 'reason', label: 'Reason' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    {
      key: 'attachmentUrl',
      label: 'Attachment',
      render: (row) =>
        row.attachmentUrl ? (
          <a href={`/${row.attachmentUrl}`} target="_blank" rel="noopener noreferrer">
            View PDF
          </a>
        ) : (
          '—'
        ),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'),
    },
  ];

  return (
    <div>
      <h2>My Expense Requests</h2>

      <div style={{ margin: '10px 0' }}>
        <button onClick={() => navigate('/new-expense')}>➕ New Expense Request</button>
      </div>

      <ResizableTable columns={columns} data={requests} />
    </div>
  );
};

export default MyRequests;
