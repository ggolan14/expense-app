import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../auth/AuthContext';
import '../styles/Requests.css';

const statusLabel = (s) =>
  ({
    pending: 'חדשה',
    new: 'חדשה',
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

export default function Requests() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext) || {};
  const isBudget = (user?.role || '').toLowerCase() === 'budget';

  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(false);

  // 🔎 פילטרים
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchText('');
    setDateFrom('');
    setDateTo('');
  };

  const apiPath = isBudget ? '/expenses/all' : '/expenses/my';

  useEffect(() => {
    if (!user?.token) return;
    (async () => {
      try {
        setFetching(true);
        const res = await axios.get(apiPath, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setRequests(res.data || []);
      } catch (e) {
        console.error(e);
        toast.error('שגיאה בטעינת הבקשות');
      } finally {
        setFetching(false);
      }
    })();
  }, [apiPath, user?.token]);

  const filtered = useMemo(() => {
    return (requests || []).filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (searchText) {
        const t = searchText.toLowerCase();
        const hay = [
          r.employeeId?.fullName,
          r.fullName,
          r.reason,
          r.faculty,
          r.idNumber,
          r.requestId,
          r.budgetNumber,
          r.amount?.toString(),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(t)) return false;
      }

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

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/expenses/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('הסטטוס עודכן בהצלחה');
      const res = await axios.get(apiPath, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('נכשל בעדכון הסטטוס');
    }
  };

  if (loading || !user?.token) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }} dir="rtl">
        טוען…
      </div>
    );
  }

  return (
    <div className="requests-page-container" dir="rtl">
      <div className="header-row">
        <h2>{isBudget ? 'כל בקשות ההחזר' : 'הבקשות שלי'}</h2>
        {!isBudget && (
          <button className="primary-btn" onClick={() => navigate('/new-expense')}>
            + בקשה חדשה
          </button>
        )}
      </div>

      {/* 🔎 סרגל מסננים */}
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
          <label>חיפוש חופשי:</label>
          <input
            type="text"
            placeholder="שם/סיבה/פקולטה/ת״ז/מס׳ בקשה/מס׳ תקציב/סכום…"
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

        <div className="filter-item" style={{ alignSelf: 'end' }}>
          <button className="secondary-btn" onClick={clearFilters}>
            נקה מסננים
          </button>
        </div>
      </div>

      {fetching ? (
        <p>טוען…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>לא נמצאו בקשות.</p>
          {!isBudget && (
            <button className="primary-btn" onClick={() => navigate('/new-expense')}>
              + צור בקשה חדשה
            </button>
          )}
        </div>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>{isBudget ? 'עובד' : 'תאריך'}</th>
              {isBudget && <th>תאריך</th>}
              <th>סכום</th>
              <th>סיבה</th>
              <th>סטטוס</th>
              <th>קבצים</th>
              {isBudget && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.requestId || r._id}>
                <td>
                  {isBudget
                    ? r.employeeId?.fullName || r.fullName || '-'
                    : r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString('he-IL')
                    : '-'}
                </td>
                {isBudget && (
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('he-IL') : '-'}</td>
                )}
                <td>
                  {typeof r.amount === 'number'
                    ? r.amount.toLocaleString('he-IL')
                    : r.amount}{' '}
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
                    >
                      📎 קובץ
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                {isBudget && (
                  <td>
                    <div className="actions">
                      <button
                        className="act act-approve"
                        onClick={() => updateStatus(r._id, 'approved')}
                      >
                        אשר
                      </button>
                      <button
                        className="act act-reject"
                        onClick={() => updateStatus(r._id, 'rejected')}
                      >
                        דחה
                      </button>
                      <button
                        className="act act-progress"
                        onClick={() => updateStatus(r._id, 'in_progress')}
                      >
                        טיפול
                      </button>
                      <button
                        className="act act-close"
                        onClick={() => updateStatus(r._id, 'closed')}
                      >
                        סגור
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
