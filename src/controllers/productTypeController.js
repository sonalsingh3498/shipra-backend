import { query } from '../../db/pool.js';

// @desc    Create Product Type (L3)
// @route   POST /api/product-types
export const createProductType = async (req, res) => {
  const { subcategory_id, name, description } = req.body;

  if (!subcategory_id || !name) {
    return res.status(400).json({ error: "Subcategory ID and Name are required" });
  }

  // Generate slug: "T-shirt" -> "t-shirt"
  const slug = name.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');

  try {
    const result = await query(
      `INSERT INTO public.product_types (subcategory_id, name, slug, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [subcategory_id, name, slug, description]
    );

    res.status(201).json({ success: true, product_type: result.rows[0] });
  } catch (err) {
    console.error('L3 Creation Error:', err.message);
    if (err.code === '23503') return res.status(404).json({ error: "Parent Subcategory ID not found" });
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get All Nested Navigation (L2 -> L3)
// @route   GET /api/product-types/nested
export const getFullNavigation = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.name AS subcategory_name,
        pt.name AS type_name,
        pt.slug AS type_slug
      FROM public.subcategories s
      LEFT JOIN public.product_types pt ON pt.subcategory_id = s.subcategory_id
      ORDER BY s.name, pt.name;
    `;

    const { rows } = await query(sql);

    const result = rows.reduce((acc, row) => {
      let sub = acc.find(item => item.subcategory === row.subcategory_name);
      
      if (!sub) {
        sub = { 
          subcategory: row.subcategory_name, 
          product_types: [] 
        };
        acc.push(sub);
      }

      if (row.type_name) {
        sub.product_types.push({
          name: row.type_name,
          slug: row.type_slug
        });
      }
      
      return acc;
    }, []);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get Product Types by Subcategory ID
// @route   GET /api/product-types/subcategory/:subId
export const getTypesBySubcategory = async (req, res) => {
  const { subId } = req.params;

  try {
    const sql = `
      SELECT * FROM public.product_types 
      WHERE subcategory_id = $1 
      ORDER BY name ASC
    `;
    
    const result = await query(sql, [subId]);

    if (result.rows.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: "No product types found for this subcategory",
        product_types: [] 
      });
    }

    res.status(200).json({ 
      success: true, 
      count: result.rows.length,
      product_types: result.rows 
    });
  } catch (err) {
    console.error('Fetch L3 Error:', err.message);
    res.status(500).json({ error: "Server Error" });
  }
};