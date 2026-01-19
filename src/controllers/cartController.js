import { query } from '../../db/pool.js';

// @desc    Add Item to Cart
// @route   POST /api/cart
export const addToCart = async (req, res) => {
  // We expect variant_id (e.g. ID for Red/Small)
  const { variant_id, quantity } = req.body;
  const userId = req.user.id; 

  try {
    // 1. Check if variant exists
    const variantCheck = await query(
      "SELECT * FROM product_variants WHERE variant_id = $1", 
      [variant_id]
    );

    if (variantCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    // 2. Upsert (Add new or Update quantity)
    const sql = `
      INSERT INTO public.cart_items (user_id, variant_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, variant_id) 
      DO UPDATE SET 
        quantity = public.cart_items.quantity + $3,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await query(sql, [userId, variant_id, quantity || 1]);

    res.status(200).json({ 
      message: "Item added to cart", 
      cartItem: result.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get User Cart
// @route   GET /api/cart
export const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // JOIN cart -> variants -> products
    const sql = `
      SELECT 
        c.cart_item_id,
        c.quantity,
        
        -- Price from Variant Table
        v.price AS unit_price,
        (c.quantity * v.price) AS subtotal,
        
        -- Variant Details
        v.variant_id,
        v.color,
        v.size,
        v.images,
        
        -- Product Details
        p.title AS product_name,
        p.product_id

      FROM public.cart_items c
      JOIN public.product_variants v ON c.variant_id = v.variant_id
      JOIN public.products p ON v.product_id = p.product_id
      
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC;
    `;

    const result = await query(sql, [userId]);

    // Calculate Grand Total
    const grandTotal = result.rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

    res.json({
      cart_items: result.rows,
      grand_total: grandTotal,
      count: result.rows.length
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update Cart Quantity
// @route   PUT /api/cart/:id
export const updateCartQuantity = async (req, res) => {
  const { id } = req.params; // cart_item_id
  const { quantity } = req.body;
  const userId = req.user.id;

  try {
    if (quantity < 1) return res.status(400).json({ error: "Quantity must be at least 1" });

    const result = await query(
      "UPDATE public.cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *",
      [quantity, id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Cart updated", item: result.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Remove Item
// @route   DELETE /api/cart/:id
export const removeFromCart = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await query(
      "DELETE FROM public.cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};