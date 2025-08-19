// client/src/pages/MyRequests.jsx
import React, { useEffect, useMemo ,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import ResizableTable from '../components/ResizableTable';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState(''); 
  const [idFilter, setIdFilter] = useState(''); // פילטר לפי ID
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
        r.attachmentUrl
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [requests, query]);

  const filteredRequests = useMemo(() => {
    const idq = idFilter.trim().toLowerCase();
    if (!idq) return freeSearchFiltered;
    return freeSearchFiltered.filter((r) => r._id?.toLowerCase().includes(idq));
  }, [freeSearchFiltered, idFilter]);
const getFileName = (attachmentUrl) => {
  if (!attachmentUrl) return null;
  const parts = attachmentUrl.split('-');   // חותך לפי '-'
  return parts.length > 1 ? parts.slice(1).join('-') : attachmentUrl;
};
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
             {getFileName(row.attachmentUrl)}
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

export default MyRequests;
