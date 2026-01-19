import express from 'express';
import { addToCart, getCart, removeFromCart, updateCartQuantity } from '../controllers/cartController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// Protect all cart routes
router.use(authorize);

router.post('/', addToCart);
router.get('/', getCart);
router.put('/:id', updateCartQuantity);
router.delete('/:id', removeFromCart);

export default router;