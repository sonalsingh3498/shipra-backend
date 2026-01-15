import bcrypt from 'bcrypt';
import { query } from '../../db/pool.js';
import { jwtGenerator } from '../utils/jwtGenerator.js';

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await query("SELECT * FROM public.users WHERE email = $1", [email]);

    if (user.rows.length > 0) {
      return res.status(401).json({ error: "User already exists" });
    }

    // 2. Encrypt Password (Salt level 10)
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 3. Insert into DB
    const newUser = await query(
      "INSERT INTO public.users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [full_name, email, bcryptPassword]
    );

    // 4. Generate Token
    const token = jwtGenerator(newUser.rows[0].user_id);

    res.json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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