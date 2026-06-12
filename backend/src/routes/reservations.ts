import { Router } from 'express';
import {
  createReservation,
  getReservationById,
  updateReservationStatus,
  getUserReservations,
  getPharmacyReservations,
} from '../controllers/reservationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All reservation routes require authentication
router.post('/', authenticate, createReservation);
router.get('/user', authenticate, getUserReservations);
router.get('/pharmacy/:pharmacy_id', authenticate, authorize('pharmacy_owner', 'admin'), getPharmacyReservations);
router.get('/:id', authenticate, getReservationById);
router.patch('/:id/status', authenticate, updateReservationStatus);

export default router;
