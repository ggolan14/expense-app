import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middleware/auth.js';
import expenseRoutes from './routes/expense.routes.js';

const app = express();
app.use('/uploads', express.static('uploads')); // כדי לצפות בקבצים
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);



// דוגמה לנתיב מאובטח בסיסית:
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: `Hello user ${req.user.id}`, role: req.user.role });
});

const port = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`🚀 Server on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });
