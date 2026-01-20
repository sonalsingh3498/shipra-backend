import express from 'express';
import { 
  createCategory, 
  getCategories, 
//   updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';

// Import middleware to protect routes (only logged-in users can edit)
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getCategories);

// @route   POST /api/categories
// @desc    Create a category
// @access  Protected
router.post('/', authorize, createCategory);

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Protected
// router.put('/:id', authorize, updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Protected
router.delete('/:id', authorize, deleteCategory);

export default router;