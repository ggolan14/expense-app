import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ExpenseForm.css';

const ExpenseForm = () => {
  const [organization, setOrganization] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    fullName: '',
    idNumber: '',
    faculty: '',
    phone: '',
    amount: '',
    budgetNumber: '',
    description: '',
  });
  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organization) {
      toast.error('אנא בחרו ארגון');
      return;
    }

    const data = new FormData();
    data.append('organization', organization);
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    attachments.forEach((f) => {
      data.append('attachments', f.file);
    });

    try {
      await axios.post('/expenses', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast.success('הבקשה נשלחה בהצלחה');
      setTimeout(() => navigate('/my-requests'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('אירעה שגיאה, נסו שוב מאוחר יותר');
    }
  };

  return (
    <div className="expense-form-container" dir="rtl">
      <h2>הגשת בקשה חדשה להחזר הוצאות</h2>

      {/* בחירת ארגון */}
      <div className="form-group inline-field">
        <label>ארגון:</label>
        <select
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          required
        >
          <option value="">-- בחרו --</option>
          <option value="Technion">טכניון</option>
          <option value="Institute">מכון</option>
        </select>
      </div>

      {organization === 'Technion' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group inline-field">
            <label>תאריך:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>שם מלא:</label>
            <input
              type="text"
              name="fullName"
              placeholder="שם פרטי ושם משפחה"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>תעודת זהות:</label>
            <input
              type="text"
              name="idNumber"
              placeholder="תעודת זהות"
              value={formData.idNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>פקולטה:</label>
            <input
              type="text"
              name="faculty"
              placeholder="שם הפקולטה"
              value={formData.faculty}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>טלפון:</label>
            <input
              type="text"
              name="phone"
              placeholder="מספר טלפון"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>סכום מבוקש:</label>
            <input
              type="number"
              name="amount"
              placeholder="הזן סכום (בש״ח או דולר)"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>מספר תקציב:</label>
            <input
              type="text"
              name="budgetNumber"
              placeholder="מספר התקציב"
              value={formData.budgetNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>תיאור / פירוט ההוצאות:</label>
            <input
              type="text"
              name="description"
              placeholder='בגין הוצאות ע"פ הקבלות המצורפות'
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group inline-field">
            <label>צרפו קובצי PDF (חשבוניות/קבלות):</label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
            />
          </div>

          {attachments.length > 0 && (
            <div className="file-list">
              {attachments.map((att, index) => (
                <a
                  key={index}
                  href={att.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  📎 {att.file.name}
                </a>
              ))}
            </div>
          )}

          <button type="submit" className="submit-btn">
            שליחת בקשה
          </button>
        </form>
      )}
    </div>
  );
};

export default ExpenseForm;
