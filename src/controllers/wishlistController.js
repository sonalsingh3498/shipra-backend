import { query } from '../../db/pool.js';

// @desc    Add Item to Wishlist
// @route   POST /api/wishlist
export const addToWishlist = async (req, res) => {
  const { variant_id } = req.body;
  const userId = req.user.id; // From middleware

  try {
    // 1. Check if variant exists
    const variantCheck = await query(
      "SELECT * FROM product_variants WHERE variant_id = $1", 
      [variant_id]
    );

    if (variantCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    // 2. Insert into Wishlist (Ignore duplicates)
    const sql = `
      INSERT INTO public.wishlist (user_id, variant_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, variant_id) DO NOTHING
      RETURNING *;
    `;

    const result = await query(sql, [userId, variant_id]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Item already in wishlist" });
    }

    res.status(201).json({ 
      message: "Added to wishlist", 
      item: result.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get User Wishlist
// @route   GET /api/wishlist
export const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    // Join Wishlist -> Variants -> Products to get nice details
    const sql = `
      SELECT 
        w.wishlist_id,
        w.created_at,
        
        -- Variant Details
        v.variant_id,
        v.price,

        
        -- Product Details
        p.product_id,
        p.title AS product_name,
        p.handle

      FROM public.wishlist w
      JOIN public.product_variants v ON w.variant_id = v.variant_id
      JOIN public.products p ON v.product_id = p.product_id
      
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC;
    `;

    const result = await query(sql, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
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

    res.json({ message: "Removed from wishlist" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};