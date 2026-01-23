import { query } from '../../db/pool.js';

// @desc    Create Product (Updated with L1, L2, and L3 tiers)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const {
      handle, title, vendor, tags,
      published, status, seo_title, seo_description, is_gift_card,
      category_id, subcategory_id, product_type_id, // <--- New Tiers
      price, inventory_quantity, sku
    } = req.body;

    const imagePaths = req.files 
      ? req.files.map(file => `/uploads/${file.filename}`) 
      : [];

    const sql = `
      INSERT INTO public.products (
        handle, title, vendor, tags, 
        published, status, seo_title, seo_description, is_gift_card,
        category_id, subcategory_id, product_type_id, -- <--- New Columns
        price, inventory_quantity, sku, images
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, tags,
      published || false, status || 'active', seo_title, seo_description, is_gift_card || false,
      category_id, subcategory_id, product_type_id, // $10, $11, $12
      price || 0, inventory_quantity || 0, sku, 
      imagePaths
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
    if (err.code === '23503') return res.status(400).json({ error: 'Invalid Category, Subcategory, or Product Type ID.' });
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    handle, title, vendor, tags, 
    published, status, seo_title, seo_description, is_gift_card,
    category_id, subcategory_id, product_type_id,
    price, inventory_quantity, sku
  } = req.body;

  try {
    const imagePaths = req.files && req.files.length > 0 
      ? req.files.map(file => `/uploads/${file.filename}`) 
      : null;

    const sql = `
      UPDATE public.products 
      SET 
        handle = COALESCE($1, handle),
        title = COALESCE($2, title),
        vendor = COALESCE($3, vendor),
        tags = COALESCE($4, tags),
        published = COALESCE($5, published),
        status = COALESCE($6, status),
        seo_title = COALESCE($7, seo_title),
        seo_description = COALESCE($8, seo_description),
        is_gift_card = COALESCE($9, is_gift_card),
        category_id = COALESCE($10, category_id),
        subcategory_id = COALESCE($11, subcategory_id),
        product_type_id = COALESCE($12, product_type_id),
        price = COALESCE($13, price),
        inventory_quantity = COALESCE($14, inventory_quantity),
        sku = COALESCE($15, sku),
        images = COALESCE($16, images),
        updated_at = NOW()
      WHERE product_id = $17
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, tags, 
      published, status, seo_title, seo_description, is_gift_card, 
      category_id, subcategory_id, product_type_id, 
      price, inventory_quantity, sku, 
      imagePaths, id
    ];

    const result = await query(sql, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get All Products (Updated with full hierarchy)
export const getAllProducts = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.*, 
        c.name AS category_name, 
        s.name AS subcategory_name, 
        pt.name AS product_type_name
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.category_id
      LEFT JOIN public.subcategories s ON p.subcategory_id = s.subcategory_id
      LEFT JOIN public.product_types pt ON p.product_type_id = pt.product_type_id
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql);
    res.status(200).json({ success: true, count: result.rows.length, products: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Single Product (Detailed View)
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
    console.error('Get Product By ID Error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Note: If you have foreign key constraints (like in Wishlist or Orders),
    // ensure they are set to ON DELETE CASCADE in SQL.
    const result = await query(
      'DELETE FROM public.products WHERE product_id = $1 RETURNING product_id', 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (err) {
    console.error('Delete Product Error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};