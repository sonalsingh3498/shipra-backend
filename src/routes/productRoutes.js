import express from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// Route: /api/products
router.route('/')
  .get(getAllProducts)                  // Public: Anyone can view all products
  .post(authorize, createProduct);      // PROTECTED: Only logged-in users can create

// Route: /api/products/:id
router.route('/:id')
  .get(getProductById)                  // Public: Anyone can view a single product
  .put(authorize, updateProduct)        // PROTECTED: Only logged-in users can update
  .delete(authorize, deleteProduct);    // PROTECTED: Only logged-in users can delete

export default router;