import { Router } from 'express';
import {
  registerPharmacy,
  getPharmacyById,
  getNearbyPharmacies,
  getPharmacyInventory,
  getMyPharmacy,
  updatePharmacy,
  searchPharmacies,
} from '../controllers/pharmacyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/nearby', getNearbyPharmacies);
router.get('/search', searchPharmacies);

// Protected routes
router.post('/register', authenticate, registerPharmacy);
router.get('/my', authenticate, authorize('pharmacy_owner', 'admin'), getMyPharmacy);

// Mixed routes (public pharmacy details, protected update)
router.get('/:id', getPharmacyById);
router.put('/:id', authenticate, authorize('pharmacy_owner', 'admin'), updatePharmacy);
router.get('/:id/inventory', getPharmacyInventory);

export default router;
