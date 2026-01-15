import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private Routes (Require Token)
router.get('/profile', authorize, getUserProfile);
router.put('/profile', authorize, updateUserProfile);

export default router;