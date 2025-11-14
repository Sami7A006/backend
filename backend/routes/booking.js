import express from 'express';
import { createBooking, getUserBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.patch('/:bookingId/status', updateBookingStatus);

export default router;

