import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import mesocycleRoutes from './routes/mesocycles.js';
import exerciseRoutes from './routes/exercises.js';
import sessionRoutes from './routes/sessions.js';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/mesocycles', mesocycleRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler — must have 4 params for Express to treat it as an error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
