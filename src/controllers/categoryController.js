import { query } from '../../db/pool.js';

// Helper to make slugs (e.g. "Red Shoes" -> "red-shoes")
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start
    .replace(/-+$/, '');      // Trim - from end
};

// @desc    Create Category
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  const { name, slug } = req.body;

  // Auto-generate slug if not provided
  const finalSlug = slug || createSlug(name);

  try {
    const sql = `
      INSERT INTO public.categories (name, slug)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await query(sql, [name, finalSlug]);

    res.status(201).json({
      success: true,
      category: result.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
        return res.status(409).json({ error: "Category Name or Slug already exists" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Get All Categories
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const result = await query("SELECT * FROM public.categories ORDER BY category_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM public.categories WHERE category_id = $1 RETURNING *";
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted", category: result.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};