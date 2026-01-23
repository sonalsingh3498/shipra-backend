import express from 'express';
import { createProductType, getFullNavigation, getTypesBySubcategory } from '../controllers/productTypeController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// POST /api/product-types (For adding T-shirt, Shirt, etc.)
router.post('/', authorize, createProductType);

// GET /api/product-types/nested (For your Myntra-style menu)
router.get('/nested', getFullNavigation);
router.get('/subcategory/:subId', authorize, getTypesBySubcategory);
export default router;