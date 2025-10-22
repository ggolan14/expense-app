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
  const [attachments, setAttachments] = useState([]); // רשימת קבצים + preview
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file), // 👈 יוצרים URL זמני
    }));
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organization) {
      toast.error('Please select organization');
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

      toast.success('Request submitted successfully');
      setTimeout(() => navigate('/my-requests'), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }
  };

  return (
    <div>
      <h2>Submit New Expense Request</h2>

      {/* בחירת ארגון */}
      <div className="form-group inline-field">
        <label>Organization:</label>
        <select
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          required
        >
          <option value="">-- Select --</option>
          <option value="Technion">Technion</option>
          <option value="Institute">Institute</option>
        </select>
      </div>

      {organization === 'Technion' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group inline-field">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>Full Name:</label>
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
            <label>ID Number:</label>
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
            <label>Faculty:</label>
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
            <label>Phone:</label>
            <input
              type="text"
              name="phone"
              placeholder="טלפון"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>אבקש להחזיר לי סך של:</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
            <label>מתקציב מספר:</label>
            <input
              type="text"
              name="budgetNumber"
              value={formData.budgetNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group inline-field">
  <label>בגין הוצאות ע"פ הקבלות המצורפות:</label>
  <input
    type="file"
    accept="application/pdf"
    multiple
    onChange={handleFileChange}
  />
</div>

          {/* ✨ רשימת הקבצים שנבחרו — לחיצה תפתח אותם */}
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

          <button type="submit">Send Request</button>
        </form>
      )}
    </div>
  );
};

export default ExpenseForm;
