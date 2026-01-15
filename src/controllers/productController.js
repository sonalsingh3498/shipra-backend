import { query } from '../../db/pool.js';

// @desc    Create a new product
// @route   POST /api/products
// @access  Public (or Protected if you add auth later)
export const createProduct = async (req, res) => {
  // 1. Destructure data from the request body
  const {
    handle,
    title,
    vendor,
    product_category,
    product_type,
    tags,           // Assuming this is an Array or String
    published,      // Boolean
    status,
    seo_title,
    seo_description,
    is_gift_card    // Boolean
  } = req.body;

  // 2. Validation (Optional but recommended)
  if (!handle || !title) {
    return res.status(400).json({ error: 'Handle and Title are required fields.' });
  }

  // 3. The SQL Query
  const sql = `
    INSERT INTO public.products (
      handle, 
      title, 
      vendor, 
      product_category, 
      product_type, 
      tags, 
      published, 
      status, 
      seo_title, 
      seo_description, 
      is_gift_card,
      created_at,
      updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) 
    RETURNING *;
  `;

  // 4. The Values Array (Matches the $1, $2... order)
  const values = [
    handle,
    title,
    vendor,
    product_category,
    product_type,
    tags,
    published || false,    // Default to false if missing
    status || 'active',    // Default to 'active' if missing
    seo_title,
    seo_description,
    is_gift_card || false  // Default to false if missing
  ];

  try {
    // 5. Execute Query
    const result = await query(sql, values);
    
    // 6. Send Response (Return the created product)
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating product:', err.message);
    
    // Handle specific errors (like duplicate handle)
    if (err.code === '23505') { // Postgres error code for unique violation
        return res.status(409).json({ error: 'A product with this handle already exists.' });
    }

    res.status(500).json({ error: 'Server Error' });
  }
};
// @desc    Get All Products
// @route   GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const sql = 'SELECT * FROM public.products ORDER BY created_at DESC';
    const result = await query(sql);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Single Product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'SELECT * FROM public.products WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Update Product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    handle, title, vendor, product_category, product_type, 
    tags, published, status, seo_title, seo_description, is_gift_card
  } = req.body;

  try {
    // 1. Check if product exists
    const checkSql = 'SELECT * FROM public.products WHERE id = $1';
    const checkResult = await query(checkSql, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Dynamic Update Query
    // COALESCE($n, column_name) keeps the OLD value if the NEW value is null/undefined
    const sql = `
      UPDATE public.products 
      SET 
        handle = COALESCE($1, handle),
        title = COALESCE($2, title),
        vendor = COALESCE($3, vendor),
        product_category = COALESCE($4, product_category),
        product_type = COALESCE($5, product_type),
        tags = COALESCE($6, tags),
        published = COALESCE($7, published),
        status = COALESCE($8, status),
        seo_title = COALESCE($9, seo_title),
        seo_description = COALESCE($10, seo_description),
        is_gift_card = COALESCE($11, is_gift_card),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, product_category, product_type, 
      tags, published, status, seo_title, seo_description, is_gift_card, 
      id // The ID is the 12th parameter
    ];

    const result = await query(sql, values);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: result.rows[0]
    });

  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'DELETE FROM public.products WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Product with ID ${id} deleted` 
    });

  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};