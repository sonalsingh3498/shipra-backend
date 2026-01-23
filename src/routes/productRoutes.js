import express from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { authorize } from '../middleware/authorization.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure the upload directory exists or the server will crash
const uploadDir = './public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // Generate unique filename: images-170567890.jpg
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Route: /api/products
router.route('/')
  .get(getAllProducts)
  // Logic: First authorize, then parse 'images' array (max 5), then create
  .post(authorize, upload.array('images', 5), createProduct);

// Route: /api/products/:id
router.route('/:id')
  .get(getProductById)
  // Allow image updates as well
  .put(authorize, upload.array('images', 5), updateProduct)
  .delete(authorize, deleteProduct);

export default router;