import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getPendingPharmacies,
  approvePharmacy,
  getAllPharmacies,
  updateUserRole,
  deleteUser,
  getSearchAnalytics,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics/search', getSearchAnalytics);

// Users management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Pharmacies management
router.get('/pharmacies', getAllPharmacies);
router.get('/pharmacies/pending', getPendingPharmacies);
router.patch('/pharmacies/:id/approve', approvePharmacy);

export default router;
