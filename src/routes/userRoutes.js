import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  verifyRegistrationOtp,
  requestPasswordReset,
  resetPassword 
} from '../controllers/userController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// --- PUBLIC ROUTES ---

// 1. Registration Flow
// Step A: Request the OTP
router.post('/request-registration-otp', verifyRegistrationOtp);
// Step B: Verify OTP and Register
router.post('/register', registerUser);

// 2. Login
router.post('/login', loginUser);

// 3. Forgot Password Flow
// Step A: Request OTP via email/phone lookup
router.post('/forgot-password', requestPasswordReset);
// Step B: Verify OTP and set new password
router.post('/reset-password', resetPassword);


// --- PRIVATE ROUTES ---
// Require JWT Token in Header

router.get('/profile', authorize, getUserProfile);
router.put('/profile', authorize, updateUserProfile);

export default router;