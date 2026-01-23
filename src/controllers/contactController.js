import { query } from '../../db/pool.js';

// @desc    Submit a contact form
// @route   POST /api/contact
export const submitContactForm = async (req, res) => {
  const { name, email, phone, comment } = req.body;

  // Basic Validation
  if (!name || !email || !comment) {
    return res.status(400).json({ error: "Name, Email, and Comment are required" });
  }

  try {
    const sql = `
      INSERT INTO public.contacts (name, email, phone, comment)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await query(sql, [name, email, phone, comment]);

    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received.",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Contact Form Error:', err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact
export const getAllMessages = async (req, res) => {
  try {
    const result = await query("SELECT * FROM public.contacts ORDER BY created_at DESC");
    res.status(200).json({ success: true, messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};