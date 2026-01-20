import express from 'express';
import { 
  addAddress, 
  getMyAddresses, 
  updateAddress, 
  deleteAddress 
} from '../controllers/addressController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// All routes require authentication
router.use(authorize);

router.post('/', addAddress);
router.get('/', getMyAddresses);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;