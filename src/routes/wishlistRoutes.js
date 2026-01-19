import express from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { authorize } from '../middleware/authorization.js';

const router = express.Router();

// All wishlist routes require login
router.use(authorize);

router.route('/')
  .post(addToWishlist)
  .get(getWishlist);

router.route('/:id')
  .delete(removeFromWishlist);

export default router;