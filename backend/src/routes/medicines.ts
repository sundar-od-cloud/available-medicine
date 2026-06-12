import { Router } from 'express';
import {
  searchMedicines,
  getMedicineById,
  getAlternatives,
  getMedicineAvailability,
  getCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getPopularMedicines,
} from '../controllers/medicineController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (optional auth for search history tracking)
router.get('/search', searchLimiter, optionalAuth, searchMedicines);
router.get('/categories', getCategories);
router.get('/popular', getPopularMedicines);
router.get('/:id', getMedicineById);
router.get('/:id/alternatives', getAlternatives);
router.get('/:id/availability', getMedicineAvailability);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), createMedicine);
router.put('/:id', authenticate, authorize('admin'), updateMedicine);
router.delete('/:id', authenticate, authorize('admin'), deleteMedicine);

export default router;
