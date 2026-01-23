import express from 'express';
import { createOrder, updateOrderStatus, deleteOrder } from '../controllers/orderController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

router.post('/', authorize, createOrder);
router.put('/:id', authorize, updateOrderStatus); // Usually for Admins
router.delete('/:id', authorize, deleteOrder);

export default router;