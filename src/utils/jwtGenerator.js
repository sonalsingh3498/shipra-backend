import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const jwtGenerator = (user_id) => {
  const payload = {
    user: {
      id: user_id
    }
  };

  // Ensure you have JWT_SECRET in your .env file
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '7d' // Token lasts for 7 days
  });
};