import { query } from '../../db/pool.js';

// @desc    Add new address
// @route   POST /api/address
export const addAddress = async (req, res) => {
  const { address_line_1, address_line_2, city, state, postal_code, country, is_default } = req.body;
  const user_id = req.user.id; // From authorization middleware

  try {
    // If setting as default, unset previous default addresses
    if (is_default) {
      await query("UPDATE public.addresses SET is_default = FALSE WHERE user_id = $1", [user_id]);
    }

    const newAddress = await query(
      `INSERT INTO public.addresses (user_id, address_line_1, address_line_2, city, state, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, address_line_1, address_line_2, city, state, postal_code, country, is_default || false]
    );

    res.status(201).json(newAddress.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all addresses for a user
// @route   GET /api/address
export const getMyAddresses = async (req, res) => {
  try {
    const addresses = await query(
      "SELECT * FROM public.addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [req.user.id]
    );
    res.json(addresses.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update an address
// @route   PUT /api/address/:id
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { address_line_1, address_line_2, city, state, postal_code, is_default } = req.body;

  try {
    if (is_default) {
      await query("UPDATE public.addresses SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
    }

    const updated = await query(
      `UPDATE public.addresses 
       SET address_line_1 = COALESCE($1, address_line_1), 
           address_line_2 = COALESCE($2, address_line_2),
           city = COALESCE($3, city), 
           state = COALESCE($4, state), 
           postal_code = COALESCE($5, postal_code),
           is_default = COALESCE($6, is_default)
       WHERE address_id = $7 AND user_id = $8 RETURNING *`,
      [address_line_1, address_line_2, city, state, postal_code, is_default, id, req.user.id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ error: "Address not found" });

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete an address
// @route   DELETE /api/address/:id
export const deleteAddress = async (req, res) => {
  try {
    const deleted = await query(
      "DELETE FROM public.addresses WHERE address_id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (deleted.rows.length === 0) return res.status(404).json({ error: "Address not found" });

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};