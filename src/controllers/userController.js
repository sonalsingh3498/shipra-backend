import bcrypt from 'bcrypt';
import { query } from '../../db/pool.js';
import { jwtGenerator } from '../utils/jwtGenerator.js';
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);


export const verifyRegistrationOtp = async (req, res) => {
  const { phone, otpCode } = req.body;

  try {
    // 1. Find the user
    const userRes = await query("SELECT * FROM public.users WHERE phone = $1", [phone]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userRes.rows[0];

    // 2. Check the OTP in DB
    const otpRes = await query("SELECT * FROM public.user_otps WHERE user_id = $1", [user.user_id]);
    if (otpRes.rows.length === 0) return res.status(400).json({ error: "No OTP found for this user" });

    const { otp, expires_at } = otpRes.rows[0];

    // 3. Validate Match and Expiry
    if (otp !== otpCode) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date() > new Date(expires_at)) return res.status(400).json({ error: "OTP expired" });

    // 4. Update User to Verified and Cleanup OTP
    await query("UPDATE public.users SET is_verified = TRUE WHERE user_id = $1", [user.user_id]);
    await query("DELETE FROM public.user_otps WHERE user_id = $1", [user.user_id]);

    // 5. Generate Token now that verification is complete
    const token = jwtGenerator(user.user_id);

    res.json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error during verification");
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  const { full_name, email, password, phone } = req.body;
// const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  try {
    // 1. Check if user already exists
    const userExists = await query(
      "SELECT * FROM public.users WHERE email = $1 OR phone = $2", 
      [email, phone]
    );
    if (userExists.rows.length > 0) {
      return res.status(401).json({ error: "User with this email or phone already exists" });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 3. Insert User (Default is_verified to FALSE)
    const newUser = await query(
      "INSERT INTO public.users (full_name, email, password_hash, phone, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING user_id",
      [full_name, email, bcryptPassword, phone]
    );
    const userId = newUser.rows[0].user_id;

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // 5. Store OTP (PostgreSQL Upsert)
    await query(
      `INSERT INTO public.user_otps (user_id, otp, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [userId, otp, expiresAt]
    );

    // 6. Send via Twilio
    await client.messages.create({
      body: `Your registration code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone // Ensure phone includes country code like +91
    });

    res.status(201).json({ 
      message: "User details saved. Please verify the OTP sent to your phone.",
      phone 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error during registration");
  }
};

// @desc    Login User
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await query("SELECT * FROM public.users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Password or Email is incorrect" });
    }

    // 2. Check Password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Password or Email is incorrect" });
    }

    // 3. Generate Token
    const token = jwtGenerator(user.rows[0].user_id);

    res.json({ token, user: user.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get User Profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user comes from the middleware
    const user = await query(
      "SELECT user_id, full_name, email, phone FROM public.users WHERE user_id = $1", 
      [req.user.id]
    );
    
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  const id = req.user.id; 

  try {
    const sql = `
      UPDATE public.users 
      SET 
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
      WHERE user_id = $3  -- CHANGED from $7 to $3
      RETURNING user_id, full_name, email, phone;
    `;

    // ADDED 'id' to the end of this array
    const update = await query(sql, [full_name, phone, id]);

    if (update.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile Updated", user: update.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await query("SELECT phone FROM public.users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

    await sendOTP(user.rows[0].phone);
    res.json({ message: "Reset code sent to your registered phone" });
  } catch (err) {
    res.status(500).json({ error: "Error sending OTP" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  try {
    const user = await query("SELECT phone FROM public.users WHERE email = $1", [email]);
    
    const isVerified = await verifyOTP(user.rows[0].phone, otpCode);
    if (!isVerified) return res.status(400).json({ error: "Invalid OTP" });

    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(newPassword, salt);

    await query("UPDATE public.users SET password_hash = $1 WHERE email = $2", [hashedPwd, email]);
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
};