import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db/pool.js'; // Note: In ES6 Node, you must add .js extension
import productRoutes from './src/routes/productRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
// 1. Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Myntra Clone API is running with ES6!' });
});

// 2. Database Test
app.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ 
      status: 'success', 
      message: 'Database Connected Successfully', 
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

// Catch unhandled promise rejections (like DB connection issues)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});