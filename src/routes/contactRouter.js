import express from 'express';
import { submitContactForm, getAllMessages } from '../controllers/contactController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// Public: Customers sending messages
router.post('/', submitContactForm);

// Protected: Admin viewing messages
router.get('/', authorize, getAllMessages);

export default router;