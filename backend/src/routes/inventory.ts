import { Router } from 'express';
import multer from 'multer';
import {
  updateInventory,
  bulkUploadInventory,
  getInventoryItem,
  deleteInventoryItem,
  getCSVTemplate,
  getLowStockItems,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router();

// Public
router.get('/template', getCSVTemplate);
router.get('/:pharmacyId/:medicineId', getInventoryItem);

// Protected - pharmacy owners and admins
router.post(
  '/',
  authenticate,
  authorize('pharmacy_owner', 'admin'),
  updateInventory
);

router.post(
  '/bulk',
  authenticate,
  authorize('pharmacy_owner', 'admin'),
  uploadLimiter,
  upload.single('file'),
  bulkUploadInventory
);

router.get(
  '/low-stock',
  authenticate,
  authorize('pharmacy_owner', 'admin'),
  getLowStockItems
);

router.delete(
  '/:id',
  authenticate,
  authorize('pharmacy_owner', 'admin'),
  deleteInventoryItem
);

export default router;
