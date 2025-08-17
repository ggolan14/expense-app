import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ExpenseForm = () => {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('NIS');
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || !reason || !attachment) {
            toast.error("Please fill all fields and attach a PDF");
            return;
        }

        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('reason', reason);
        formData.append('currency', currency);
        formData.append('attachment', attachment);

        try {
            await axios.post('/expenses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            toast.success("The request has been submitted successfully");

            // הפניה אחרי 2 שניות לדף הבקשות שלי
            setTimeout(() => {
                navigate('/my-requests');
            }, 2000);
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while submitting the request");
        }
    };

    return (
        <div>
            <h2>Submit New Expense Request</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Currency:
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            <option value="NIS">NIS</option>
                            <option value="$">$</option>
                        </select>
                    </label>
                    <label>Amount:</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Reason:</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Attachment (PDF only):</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setAttachment(e.target.files[0])}
                        required
                    />
                </div>
                <button type="submit">Send Request</button>
            </form>
        </div>
    );
};

export default ExpenseForm;
