import { query, pool } from '../../db/pool.js';

// @desc    Create Product with Variants (Transaction)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  const client = await pool.connect(); // Get a dedicated client for transaction
  
  try {
    const {
      handle, title, vendor, product_category, product_type, tags,
      published, status, seo_title, seo_description, is_gift_card,
      variants // <--- Array of variants expected here
    } = req.body;

    // 1. Start Transaction
    await client.query('BEGIN');

    // 2. Insert Parent Product
    const productSql = `
      INSERT INTO public.products (
        handle, title, vendor, product_category, product_type, tags, 
        published, status, seo_title, seo_description, is_gift_card
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *;
    `;

    const productValues = [
      handle, title, vendor, product_category, product_type, tags,
      published || false, status || 'active', seo_title, seo_description, is_gift_card || false
    ];

    const productResult = await client.query(productSql, productValues);
    const newProduct = productResult.rows[0];

    // 3. Insert Variants (if provided)
    if (variants && variants.length > 0) {
      const variantSql = `
        INSERT INTO public.product_variants (
          product_id, title, price, sku, 
          option1_name, option1_value, 
          option2_name, option2_value, 
          inventory_quantity, weight
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      // Loop through all variants and save them linked to the new product_id
      for (const v of variants) {
        await client.query(variantSql, [
          newProduct.product_id, // Link to Parent
          v.title,
          v.price || 0,
          v.sku,
          v.option1_name || 'Color', v.option1_value,
          v.option2_name || 'Size', v.option2_value,
          v.inventory_quantity || 0,
          v.weight
        ]);
      }
    }

    // 4. Commit Transaction (Save everything)
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Product and variants created successfully',
      product: newProduct
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Undo everything if error
    console.error('Error creating product:', err.message);
    
    if (err.code === '23505') {
        return res.status(409).json({ error: 'Handle or SKU already exists.' });
    }
    res.status(500).json({ error: 'Server Error' });
  } finally {
    client.release(); // Release connection back to pool
  }
};

// @desc    Get All Products
// @route   GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    // We changed 'id' to 'product_id' in your schema
    const sql = 'SELECT * FROM public.products ORDER BY created_at DESC';
    const result = await query(sql);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Get Single Product (With Variants)
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  const { id } = req.params; // This maps to product_id

  try {
    // 1. Get Product
    const productRes = await query('SELECT * FROM public.products WHERE product_id = $1', [id]);
    
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Get Variants for this product
    const variantsRes = await query('SELECT * FROM public.product_variants WHERE product_id = $1', [id]);

    res.status(200).json({ 
      success: true, 
      product: productRes.rows[0],
      variants: variantsRes.rows
    });
  } catch (err) {
    console.error(err.message);
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
    // COALESCE allows partial updates. 
    // IMPORTANT: 'WHERE product_id = $12' (We updated column name)
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
      WHERE product_id = $12
      RETURNING *;
    `;

    const values = [
      handle, title, vendor, product_category, product_type, 
      tags, published, status, seo_title, seo_description, is_gift_card, 
      id 
    ];

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: result.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // CASCADE DELETE ensures variants are deleted automatically
    const sql = 'DELETE FROM public.products WHERE product_id = $1 RETURNING product_id';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Product deleted` 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};