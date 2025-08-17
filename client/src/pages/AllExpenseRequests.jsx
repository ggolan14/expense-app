import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import ResizableTable from '../components/ResizableTable';
import { toast } from 'react-toastify';

const AllExpenseRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');   // חיפוש חופשי
  const [idFilter, setIdFilter] = useState(''); // פילטר לפי ID
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const res = await axios.get('/expenses/all');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch all requests', err);
      toast.error('Failed to fetch requests');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/expenses/${id}/status`, { status });
      toast.success('Status updated');
      fetchAllRequests();
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update');
    }
  };

  // --- חיפוש חופשי בכל השדות המרכזיים ---
  const query = search.trim().toLowerCase();
  const freeSearchFiltered = useMemo(() => {
    if (!query) return requests;
    return requests.filter((r) => {
      const haystack = [
        r._id,
        r.reason,
        r.amount?.toString(),
        r.currency,
        r.status,
        r.employeeId?.fullName,
        r.employeeId?.email,
        r.createdAt && new Date(r.createdAt).toLocaleString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [requests, query]);

  // --- פילטר ייעודי לפי ID (contains) ---
  const filteredRequests = useMemo(() => {
    const idq = idFilter.trim().toLowerCase();
    if (!idq) return freeSearchFiltered;
    return freeSearchFiltered.filter((r) => r._id?.toLowerCase().includes(idq));
  }, [freeSearchFiltered, idFilter]);

  const columns = [
    {
      key: '_id',
      label: 'ID',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <code style={{ fontSize: 12 }}>{row._id}</code>
          <button onClick={() => navigator.clipboard.writeText(row._id)} title="Copy ID">
            Copy
          </button>
        </div>
      ),
    },
    { key: 'reason', label: 'Reason' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    {
      key: 'employeeId',
      label: 'Employee',
      render: (row) =>
        row.employeeId ? `${row.employeeId.fullName} (${row.employeeId.email})` : '—',
    },
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
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleStatusChange(row._id, 'approved')}
            disabled={row.status === 'approved'}
          >
            Approve
          </button>
          <button
            onClick={() => handleStatusChange(row._id, 'rejected')}
            disabled={row.status === 'rejected'}
          >
            Reject
          </button>
          <button
            onClick={() => handleStatusChange(row._id, 'in_progress')}
            disabled={row.status === 'in_progress'}
          >
            In Progress
          </button>
          <button
            onClick={() => handleStatusChange(row._id, 'closed')}
            disabled={row.status === 'closed'}
          >
            Close
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2>All Requests</h2>

      {/* כפתור יצירת בקשה חדשה לתקציבנית */}
      <div style={{ margin: '10px 0' }}>
        <button onClick={() => navigate('/new-expense')}>➕ New Expense Request</button>
      </div>

      {/* חיפוש ופילטרים */}
      <div style={{ margin: '10px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Free search (ID, employee, email, reason, status, currency, amount...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 420, padding: 8 }}
        />
        <input
          type="text"
          placeholder="Filter by ID (contains)"
          value={idFilter}
          onChange={(e) => setIdFilter(e.target.value)}
          style={{ width: 260, padding: 8 }}
        />
        <button onClick={() => { setSearch(''); setIdFilter(''); }}>
          Clear
        </button>
      </div>

      <ResizableTable columns={columns} data={filteredRequests} />
    </div>
  );
};

export default AllExpenseRequests;
