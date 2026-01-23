import { query } from '../../db/pool.js';

// @desc    Create Subcategory (L2)
// @route   POST /api/subcategories
export const createSubcategory = async (req, res) => {
  const { category_id, name, description, image_url } = req.body;

  if (!category_id || !name) {
    return res.status(400).json({ error: "Category ID and Name are required" });
  }

  const slug = name.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');

  try {
    const result = await query(
      `INSERT INTO public.subcategories (category_id, name, slug, description, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, name, slug, description, image_url]
    );

    res.status(201).json({ success: true, subcategory: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: "Slug already exists" });
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get All Subcategories
// @route   GET /api/subcategories
export const getAllSubcategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, c.name as category_name 
       FROM public.subcategories s 
       JOIN public.categories c ON s.category_id = c.category_id 
       ORDER BY s.name ASC`
    );
    res.status(200).json({ success: true, subcategories: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};