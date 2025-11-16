import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import '../styles/MyRequests.css';

const statusLabel = (s) =>
  ({
    pending: 'חדשה',
    new: 'חדשה',          // תאימות לשדות ישנים אם קיימים
    in_progress: 'בטיפול',
    approved: 'אושרה',
    rejected: 'נדחתה',
    closed: 'נסגרה',
  }[s] ?? 'חדשה');

const statusClass = (s) =>
  s === 'approved'
    ? 'status-approved'
    : s === 'rejected'
    ? 'status-rejected'
    : 'status-default';

const currencySymbol = (c) => (c === 'USD' ? '$' : '₪');

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/expenses/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => setRequests(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  const filtered = useMemo(() => {
    return (requests || []).filter((r) => {
      // סטטוס
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // חיפוש בסיבה
      if (searchText && !(r.reason || '').toLowerCase().includes(searchText.toLowerCase()))
        return false;

      // טווח תאריכים לפי createdAt
      if (r.createdAt) {
        const created = new Date(r.createdAt);
        if (dateFrom && created < new Date(dateFrom)) return false;
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (created > to) return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, searchText, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchText('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="my-requests-container" dir="rtl">
      <div className="header-row">
        <h2>הבקשות שלי</h2>
        <button className="primary-btn" onClick={() => navigate('/new-expense')}>
          + בקשה חדשה
        </button>
      </div>

      {/* 🔎 סרגל פילטרים */}
      <div className="filters-bar">
        <div className="filter-item">
          <label>סטטוס:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">הכול</option>
            <option value="pending">חדשה</option>
            <option value="in_progress">בטיפול</option>
            <option value="approved">אושרה</option>
            <option value="rejected">נדחתה</option>
            <option value="closed">נסגרה</option>
          </select>
        </div>

        <div className="filter-item">
          <label>חיפוש בסיבה:</label>
          <input
            type="text"
            placeholder="הקלד טקסט..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>מתאריך:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        <div className="filter-item">
          <label>עד תאריך:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="filter-actions">
          <button className="secondary-btn" onClick={clearFilters}>נקה מסננים</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>לא נמצאו בקשות בהתאם למסננים.</p>
          <button className="primary-btn" onClick={() => navigate('/new-expense')}>
            + צור בקשה חדשה
          </button>
        </div>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>סכום</th>
              <th>סיבה</th>
              <th>סטטוס</th>
              <th>קבצים</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.requestId || r._id}>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('he-IL') : '-'}</td>
                <td>
                  {typeof r.amount === 'number' ? r.amount.toLocaleString('he-IL') : r.amount}{' '}
                  {currencySymbol(r.currency)}
                </td>
                <td>{r.reason || '-'}</td>
                <td className={statusClass(r.status)}>{statusLabel(r.status)}</td>
                <td className="files-cell">
                  {Array.isArray(r.attachments) && r.attachments.length > 0 ? (
                    r.attachments.map((p, i) => (
                      <a
                        key={i}
                        href={`http://localhost:4000/${p}`}
                        target="_blank"
                        rel="noreferrer"
                        className="file-link"
                        title={p}
                      >
                        📎 קובץ {i + 1}
                      </a>
                    ))
                  ) : r.attachmentUrl ? (
                    <a
                      href={`http://localhost:4000/${r.attachmentUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                      title={r.attachmentUrl}
                    >
                      📎 קובץ
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyRequests;
