import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db/pool.js'; // Note: In ES6 Node, you must add .js extension
import productRoutes from './src/routes/productRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import addressRouter from './src/routes/addressRouter.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import orderRouter from './src/routes/orderRouter.js';
import contactRouter from './src/routes/contactRouter.js';
import subcategoryRouter from './src/routes/subcategoryRouter.js';
import productTypeRouter from './src/routes/productTypeRouter.js';
import masterDataRouter from './src/routes/masterDataRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));
// --- ROUTES ---
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/address', addressRouter);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRouter);
app.use('/api/contact', contactRouter);
app.use('/api/subcategories', subcategoryRouter);
app.use('/api/product-types', productTypeRouter);
app.use('/api/master', masterDataRouter);



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