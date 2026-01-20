import { query } from '../../db/pool.js';

// @desc    Add Product to Wishlist
// @route   POST /api/wishlist
export const addToWishlist = async (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.id; 

  try {
    // 1. Check if product exists
    const productCheck = await query(
      "SELECT product_id FROM public.products WHERE product_id = $1", 
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Insert into Wishlist (Ignore duplicates using ON CONFLICT)
    const sql = `
      INSERT INTO public.wishlist (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *;
    `;

    const result = await query(sql, [userId, product_id]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Item already in wishlist" });
    }

    res.status(201).json({ 
      success: true,
      message: "Added to wishlist", 
      item: result.rows[0] 
    });

  } catch (err) {
    console.error('Wishlist Add Error:', err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get User Wishlist (Simplified JOIN)
// @route   GET /api/wishlist
export const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    // JOIN Wishlist directly to Products
    const sql = `
      SELECT 
        w.wishlist_id,
        w.created_at,
        p.product_id,
        p.title,
        p.handle,
        p.price,
        p.status
      FROM public.wishlist w
      JOIN public.products p ON w.product_id = p.product_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC;
    `;

    const result = await query(sql, [userId]);
    res.status(200).json({ success: true, wishlist: result.rows });

  } catch (err) {
    console.error('Wishlist Get Error:', err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Remove from Wishlist
// @route   DELETE /api/wishlist/:id
export const removeFromWishlist = async (req, res) => {
  const { id } = req.params; // wishlist_id
  const userId = req.user.id;

  try {
    const result = await query(
      "DELETE FROM public.wishlist WHERE wishlist_id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    res.status(200).json({ success: true, message: "Removed from wishlist" });

  } catch (err) {
    console.error('Wishlist Delete Error:', err.message);
    res.status(500).json({ error: "Server Error" });
  }
};