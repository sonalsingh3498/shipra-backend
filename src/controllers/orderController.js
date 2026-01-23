import { query, pool } from '../../db/pool.js';

// @desc    Place a new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  const client = await pool.connect();
  const { address_id, items, total_amount } = req.body; // items: [{product_id, quantity, price}]
  const user_id = req.user.id;

  try {
    await client.query('BEGIN');

    // 1. Insert into Orders table
    const orderSql = `
      INSERT INTO public.orders (user_id, address_id, total_amount)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const orderRes = await client.query(orderSql, [user_id, address_id, total_amount]);
    const newOrder = orderRes.rows[0];

    // 2. Insert items into order_items table
    const itemSql = `
      INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
      VALUES ($1, $2, $3, $4);
    `;

    for (const item of items) {
      await client.query(itemSql, [newOrder.order_id, item.product_id, item.quantity, item.price]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, order: newOrder });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  } finally {
    client.release();
  }
};

// @desc    Update Order Status (Admin)
// @route   PUT /api/orders/:id
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  try {
    const updated = await query(
      `UPDATE public.orders 
       SET status = COALESCE($1, status), 
           payment_status = COALESCE($2, payment_status),
           updated_at = NOW()
       WHERE order_id = $3 RETURNING *`,
      [status, payment_status, id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Cancel/Delete Order
// @route   DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM public.orders WHERE order_id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted/cancelled" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};