import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import ResizableTable from '../components/ResizableTable';
import { toast } from 'react-toastify';
import { AuthContext } from '../auth/AuthContext';  // ✅ נוספה גישה ל־AuthContext

const ExpenseRequests = () => {
  const { user } = useContext(AuthContext);   // ✅ הוצאנו את userRole מה־Context
  console.log("---> user="+user)
  console.log("---> user.role="+user.role)
  const userRole = user?.role;
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const url = userRole === 'budget' ? '/expenses/all' : '/expenses/my';
      const res = await axios.get(url);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
      toast.error('Failed to fetch requests');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/expenses/${id}/status`, { status });
      toast.success('Status updated');
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update');
    }
  };

  // חיפוש חופשי
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

  // פילטר לפי ID
  const filteredRequests = useMemo(() => {
    const idq = idFilter.trim().toLowerCase();
    if (!idq) return freeSearchFiltered;
    return freeSearchFiltered.filter((r) => r._id?.toLowerCase().includes(idq));
  }, [freeSearchFiltered, idFilter]);

  const baseColumns = [
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
      key: 'attachments',
      label: 'Attachments',
      render: (row) =>
        row.attachments && row.attachments.length > 0 ? (
          <ul className="attachments-list">
            {row.attachments.map((file, index) => (
              <li key={index}>
                <a
                  href={`/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {file.split('/').pop()}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          '—'
        ),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
  ];

  // עמודת Actions רק לתקציבנית
  const actionColumn = {
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
          onClick={() => handleStatusChange(row._id, 'closed')}
          disabled={row.status === 'closed'}
        >
          Close
        </button>
      </div>
    ),
  };

  const columns = userRole === 'budget' ? [...baseColumns, actionColumn] : baseColumns;

  return (
    <div>
      <h2>{userRole === 'budget' ? 'All Requests' : 'My Requests'}</h2>

      {/* כפתור יצירת בקשה חדשה למשתמש רגיל בלבד */}
      {userRole !== 'budget' && (
        <div style={{ margin: '10px 0' }}>
          <button onClick={() => navigate('/new-expense')}>➕ New Expense Request</button>
        </div>
      )}

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

export default ExpenseRequests;
