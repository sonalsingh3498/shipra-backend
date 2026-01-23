import { query } from '../../db/pool.js';

// --- HELPER: Generic Delete ---
const deleteById = async (res, table, idColumn, idValue) => {
    try {
        const result = await query(`DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING *`, [idValue]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
        res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- ATTRIBUTE TYPES (L1) ---
export const addAttributeType = async (req, res) => {
    const { name } = req.body;
    try {
        const result = await query('INSERT INTO attribute_types (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
export const deleteAttributeType = (req, res) => deleteById(res, 'attribute_types', 'attribute_type_id', req.params.id);

// --- ATTRIBUTE VALUES (L2) ---
export const addAttributeValue = async (req, res) => {
    const { attribute_type_id, value } = req.body;
    try {
        const result = await query('INSERT INTO attribute_values (attribute_type_id, value) VALUES ($1, $2) RETURNING *', [attribute_type_id, value]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
export const deleteAttributeValue = (req, res) => deleteById(res, 'attribute_values', 'attribute_value_id', req.params.id);

// --- MASTER DATA: COLORS ---
export const addColor = async (req, res) => {
    console.log("POST /api/master/colors hit with body:", req.body); // Check if body is parsed
    const { name, hex_code } = req.body;
    
    if (!name || !hex_code) {
        return res.status(400).json({ error: "Missing name or hex_code" });
    }

    try {
        const result = await query('INSERT INTO colors (name, hex_code) VALUES ($1, $2) RETURNING *', [name, hex_code]);
        res.status(201).json(result.rows[0]);
    } catch (err) { 
        console.error("Database Error:", err.message);
        res.status(500).json({ error: err.message }); 
    }
};
export const deleteColor = (req, res) => deleteById(res, 'colors', 'color_id', req.params.id);

// --- PRODUCT IMAGES ---
export const addImage = async (req, res) => {
    const { product_id, url, alt_text, is_main, sort_order } = req.body;
    try {
        const result = await query(
            'INSERT INTO product_images (product_id, url, alt_text, is_main, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [product_id, url, alt_text, is_main, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
export const deleteImage = (req, res) => deleteById(res, 'product_images', 'image_id', req.params.id);