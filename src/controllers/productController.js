import { query } from '../../db/pool.js';

// @desc    Create Product (Simplified - No Variants)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const {
      handle, title, vendor, product_type, tags,
      published, status, seo_title, seo_description, is_gift_card,
      category_id, price, inventory_quantity, sku
    } = req.body;

    const sql = `
      INSERT INTO public.products (
        handle, title, vendor, product_type, tags, 
        published, status, seo_title, seo_description, is_gift_card,
        category_id, price, inventory_quantity, sku
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, product_type, tags,
      published || false, status || 'active', seo_title, seo_description, is_gift_card || false,
      category_id, price || 0, inventory_quantity || 0, sku
    ];

    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating product:', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Handle or SKU already exists.' });
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get All Products
// @route   GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.category_id
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql);
    res.status(200).json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    handle, title, vendor, product_type, tags, 
    published, status, seo_title, seo_description, is_gift_card,
    category_id, price, inventory_quantity, sku
  } = req.body;

  try {
    const sql = `
      UPDATE public.products 
      SET 
        handle = COALESCE($1, handle),
        title = COALESCE($2, title),
        vendor = COALESCE($3, vendor),
        product_type = COALESCE($4, product_type),
        tags = COALESCE($5, tags),
        published = COALESCE($6, published),
        status = COALESCE($7, status),
        seo_title = COALESCE($8, seo_title),
        seo_description = COALESCE($9, seo_description),
        is_gift_card = COALESCE($10, is_gift_card),
        category_id = COALESCE($11, category_id),
        price = COALESCE($12, price),
        inventory_quantity = COALESCE($13, inventory_quantity),
        sku = COALESCE($14, sku),
        updated_at = NOW()
      WHERE product_id = $15
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, product_type, tags, 
      published, status, seo_title, seo_description, is_gift_card, 
      category_id, price, inventory_quantity, sku, id
    ];

    const result = await query(sql, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM public.products WHERE product_id = $1 RETURNING product_id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Single Product
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.category_id
      WHERE p.product_id = $1
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ 
      success: true, 
      product: result.rows[0] 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};