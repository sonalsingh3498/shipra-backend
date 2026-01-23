import express from 'express';
const router = express.Router();
import { 
    addAttributeType, deleteAttributeType,
    addAttributeValue, deleteAttributeValue,
    addColor, deleteColor,
    addImage, deleteImage
} from '../controllers/masterDataController.js';

// Attribute Routes
router.post('/attributes/types', addAttributeType);
router.delete('/attributes/types/:id', deleteAttributeType);

router.post('/attributes/values', addAttributeValue);
router.delete('/attributes/values/:id', deleteAttributeValue);

// Master Data Routes
router.post('/colors', addColor);
router.delete('/colors/:id', deleteColor);

// Product Media Routes
router.post('/images', addImage);
router.delete('/images/:id', deleteImage);

export default router;