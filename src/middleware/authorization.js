import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authorize = async (req, res, next) => {
  try {
    // 1. Get token from header (key: "token")
    const jwtToken = req.header("token");

    if (!jwtToken) {
      return res.status(403).json({ error: "Not Authorized (No Token)" });
    }

    // 2. Verify token
    const payload = jwt.verify(jwtToken, process.env.JWT_SECRET || 'fallback_secret_key');

    // 3. Add user ID to request object so controllers can use it
    req.user = payload.user;
    
    next(); // Continue to the actual controller

  } catch (err) {
    console.error(err.message);
    return res.status(403).json({ error: "Not Authorized (Invalid Token)" });
  }
};