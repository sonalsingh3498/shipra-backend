import express from 'express';
import { createSubcategory, getAllSubcategories } from '../controllers/subcategoryController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

router.route('/')
  .get(getAllSubcategories)
  .post(authorize, createSubcategory);

export default router;